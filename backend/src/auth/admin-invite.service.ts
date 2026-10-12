import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { plainToInstance } from 'class-transformer';
import type { Request } from 'express';
import * as crypto from 'crypto';

import { AdminInvite } from './entities/admin-invite.entity';
import { UserService } from 'src/user/user.service';
import { UserRegistrationProvider } from 'src/user/providers/create-user.provider';
import { MailService } from 'src/mail/mail.service';
import { AuthService } from './auth.service';
import { AuthResponseDto, RegisterUserDto } from './dto/auth.dto';
import {
  AcceptAdminInviteDto,
  AdminInviteResponseDto,
  CreateAdminInviteDto,
  ValidateAdminInviteResponseDto,
} from './dto/admin-invite.dto';
import {
  AdminAlertPriority,
  AdminAlertType,
  AdminInviteStatus,
  UserRole,
} from 'src/common/enums/enums';
import { AdminAlertsService } from 'src/admin-alerts/admin-alerts.service';

const EXPIRY_DAYS = 3;

@Injectable()
export class AdminInviteService {
  private readonly logger = new Logger(AdminInviteService.name);

  constructor(
    @InjectRepository(AdminInvite)
    private readonly inviteRepository: Repository<AdminInvite>,
    private readonly userService: UserService,
    private readonly userRegistrationProvider: UserRegistrationProvider,
    private readonly mailService: MailService,
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
    private readonly adminAlertsService: AdminAlertsService,
  ) {}

  // ===================================================
  // SUPER ADMIN — send / list / revoke
  // ===================================================

  async createInvite(
    dto: CreateAdminInviteDto,
    invitedById: string,
  ): Promise<AdminInviteResponseDto> {
    const invitedBy = await this.userService.findById(invitedById);
    const email = dto.email.trim().toLowerCase();

    const existingUser = await this.userService.findByEmail(email);
    if (existingUser) {
      throw new ConflictException('An account with this email already exists');
    }

    // Re-inviting someone just supersedes whatever invite they already had.
    await this.inviteRepository.update(
      { email, status: AdminInviteStatus.PENDING },
      { status: AdminInviteStatus.REVOKED, revokedAt: new Date() },
    );

    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = this.hashToken(rawToken);
    const expiresAt = new Date(
      Date.now() + EXPIRY_DAYS * 24 * 60 * 60 * 1000,
    );

    const invite = this.inviteRepository.create({
      email,
      firstName: dto.firstName.trim(),
      lastName: dto.lastName.trim(),
      phoneNumber: dto.phoneNumber ?? null,
      designation: dto.designation ?? null,
      role: dto.role,
      tokenHash,
      status: AdminInviteStatus.PENDING,
      invitedById: invitedBy.id,
      expiresAt,
    });
    await this.inviteRepository.save(invite);

    const inviteUrl = `${this.configService.get('FRONTEND_URL')}/admin-onboarding?token=${rawToken}`;
    const invitedByName = `${invitedBy.firstName} ${invitedBy.lastName}`.trim();

    try {
      await this.mailService.sendAdminInvitationEmail(email, {
        firstName: invite.firstName,
        lastName: invite.lastName,
        phone: invite.phoneNumber ?? undefined,
        invitedByName,
        expiryDays: EXPIRY_DAYS,
        inviteUrl,
        role: this.roleLabel(dto.role),
      });
    } catch (error: any) {
      this.logger.error(
        `Failed to send admin invite email to ${email}: ${error?.message}`,
      );
    }

    this.adminAlertsService
      .raise({
        type: AdminAlertType.ADMIN_ACTION,
        title: 'Admin invite sent',
        body: `${invitedByName} invited ${email} to join as ${this.roleLabel(dto.role)}.`,
        priority: AdminAlertPriority.LOW,
        actionUrl: `/admin/users`,
        metadata: { email, role: dto.role, invitedById: invitedBy.id },
      })
      .catch((err) =>
        this.logger.error(`admin_action alert failed: ${err.message}`),
      );

    return this.toResponseDto(invite, invitedByName);
  }

  async listInvites(): Promise<AdminInviteResponseDto[]> {
    const invites = await this.inviteRepository.find({
      order: { createdAt: 'DESC' },
      relations: ['invitedBy'],
    });

    const nowExpired = invites.filter(
      (i) => i.status === AdminInviteStatus.PENDING && i.isExpired(),
    );
    if (nowExpired.length) {
      nowExpired.forEach((i) => (i.status = AdminInviteStatus.EXPIRED));
      await this.inviteRepository.save(nowExpired);
    }

    return invites.map((i) =>
      this.toResponseDto(
        i,
        i.invitedBy ? `${i.invitedBy.firstName} ${i.invitedBy.lastName}`.trim() : null,
      ),
    );
  }

  async revokeInvite(id: string): Promise<{ message: string }> {
    const invite = await this.inviteRepository.findOne({ where: { id } });
    if (!invite) {
      throw new NotFoundException('Invite not found');
    }
    if (invite.status !== AdminInviteStatus.PENDING) {
      throw new BadRequestException('Only a pending invite can be revoked');
    }

    invite.status = AdminInviteStatus.REVOKED;
    invite.revokedAt = new Date();
    await this.inviteRepository.save(invite);

    return { message: 'Invite revoked' };
  }

  // ===================================================
  // INVITEE (public) — validate / accept
  // ===================================================

  async validateInvite(rawToken: string): Promise<ValidateAdminInviteResponseDto> {
    const invite = await this.getValidPendingInviteOrThrow(rawToken);

    return plainToInstance(ValidateAdminInviteResponseDto, {
      email: invite.email,
      firstName: invite.firstName,
      lastName: invite.lastName,
      role: invite.role,
      expiresAt: invite.expiresAt,
    });
  }

  async acceptInvite(
    dto: AcceptAdminInviteDto,
    req: Request,
  ): Promise<AuthResponseDto> {
    const invite = await this.getValidPendingInviteOrThrow(dto.token);

    // Belt-and-braces — registerUser() also checks this inside its own
    // transaction, but failing fast here avoids burning a valid invite
    // on a race we can already see coming.
    const existingUser = await this.userService.findByEmail(invite.email);
    if (existingUser) {
      throw new ConflictException('An account with this email already exists');
    }

    const registerDto: RegisterUserDto = {
      firstName: invite.firstName,
      lastName: invite.lastName,
      email: invite.email,
      phoneNumber: invite.phoneNumber ?? undefined,
      password: dto.password,
      role: invite.role,
    } as RegisterUserDto;

    const user = await this.userRegistrationProvider.registerUser(registerDto);

    // Clicking a link only the invitee received is itself a form of
    // email verification — don't make them verify twice.
    user.markEmailVerified();
    user.isOnboarded = true;
    await this.userService.save(user);

    invite.status = AdminInviteStatus.ACCEPTED;
    invite.acceptedAt = new Date();
    invite.createdUserId = user.id;
    await this.inviteRepository.save(invite);

    this.mailService
      .sendWelcomeEmail(user.email, {
        firstName: user.firstName,
        dashboardUrl: `${this.configService.get('FRONTEND_URL')}/admin`,
      })
      .catch((err) =>
        this.logger.error(`Welcome email failed for ${user.email}: ${err.message}`),
      );

    this.adminAlertsService
      .raise({
        type: AdminAlertType.ADMIN_ACTION,
        title: 'Admin invite accepted',
        body: `${user.email} accepted their invite and is now a ${this.roleLabel(user.role)}.`,
        priority: AdminAlertPriority.LOW,
        actionUrl: `/admin/users/${user.id}`,
        metadata: { userId: user.id, email: user.email, role: user.role },
      })
      .catch((err) =>
        this.logger.error(`admin_action alert failed: ${err.message}`),
      );

    return this.authService.issueSession(user, req);
  }

  // ===================================================
  // PRIVATE HELPERS
  // ===================================================

  private async getValidPendingInviteOrThrow(rawToken: string): Promise<AdminInvite> {
    const tokenHash = this.hashToken(rawToken);
    const invite = await this.inviteRepository.findOne({
      where: { tokenHash },
    });

    if (!invite) {
      throw new NotFoundException('Invalid or expired invite link');
    }
    if (invite.status === AdminInviteStatus.ACCEPTED) {
      throw new BadRequestException('This invite has already been used');
    }
    if (invite.status === AdminInviteStatus.REVOKED) {
      throw new BadRequestException('This invite has been revoked');
    }
    if (invite.status === AdminInviteStatus.EXPIRED || invite.isExpired()) {
      if (invite.status !== AdminInviteStatus.EXPIRED) {
        invite.status = AdminInviteStatus.EXPIRED;
        await this.inviteRepository.save(invite);
      }
      throw new BadRequestException(
        'This invite link has expired. Ask a super admin to send a new one.',
      );
    }

    return invite;
  }

  private hashToken(rawToken: string): string {
    return crypto.createHash('sha256').update(rawToken).digest('hex');
  }

  private roleLabel(role: UserRole): string {
    return role === UserRole.SUPER_ADMIN ? 'Super Administrator' : 'Administrator';
  }

  private toResponseDto(
    invite: AdminInvite,
    invitedByName?: string | null,
  ): AdminInviteResponseDto {
    return plainToInstance(AdminInviteResponseDto, {
      id: invite.id,
      email: invite.email,
      firstName: invite.firstName,
      lastName: invite.lastName,
      phoneNumber: invite.phoneNumber,
      designation: invite.designation,
      role: invite.role,
      status: invite.status,
      invitedByName,
      expiresAt: invite.expiresAt,
      createdAt: invite.createdAt,
    });
  }
}

import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { User } from '../entities/user.entity';
import { UserSettings } from '../entities/user-settings.entity';
import { UserNotificationPreferences } from '../../notifications/entities/user-notification-preferences.entity';

import {
  BulkCreateUsersDto,
  BulkCreateUserRowDto,
  BulkCreateUsersResponseDto,
} from '../dto/create-user.dto';
import {
  AuthProvider,
  SubscriptionStatus,
  SubscriptionTier,
  UserRole,
} from 'src/common/enums/enums';
import { HashProvider } from 'src/common/hash/providers/Hash.provider';
import { StudentProfile } from 'src/students/entities/student-profile.entity';
import { Subscription } from 'src/subscriptions/entities/subscription.entity';

@Injectable()
export class BulkCreateUsersProvider {
  private readonly logger = new Logger(BulkCreateUsersProvider.name);
  private readonly CHUNK_SIZE = 50;

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly hashProvider: HashProvider,
    private readonly dataSource: DataSource,
  ) {}

  async execute(dto: BulkCreateUsersDto): Promise<BulkCreateUsersResponseDto> {
    const result: BulkCreateUsersResponseDto = {
      created: 0,
      skipped: 0,
      failed: 0,
      errors: [],
      generatedPasswords: [],
    };

    const chunks = this.chunk(dto.users, this.CHUNK_SIZE);
    for (const chunk of chunks) {
      await this.processChunk(chunk, dto, result);
    }

    this.logger.log(
      `Bulk create complete — created: ${result.created}, skipped: ${result.skipped}, failed: ${result.failed}`,
    );

    return result;
  }

  private async processChunk(
    rows: BulkCreateUserRowDto[],
    dto: BulkCreateUsersDto,
    result: BulkCreateUsersResponseDto,
  ): Promise<void> {
    // ── 1. Collect identifiers ─────────────────────────────────
    const emails = rows
      .map((r) => r.email?.toLowerCase().trim())
      .filter((e): e is string => !!e);

    const phoneNumbers = rows
      .map((r) => r.phoneNumber?.trim())
      .filter((p): p is string => !!p);

    // ── 2. Single duplicate-check query ────────────────────────
    let existingUsers: User[] = [];
    if (emails.length > 0 || phoneNumbers.length > 0) {
      const qb = this.userRepository
        .createQueryBuilder('u')
        .select(['u.email', 'u.phoneNumber']);

      if (emails.length > 0)
        qb.orWhere('LOWER(u.email) IN (:...emails)', { emails });
      if (phoneNumbers.length > 0)
        qb.orWhere('u.phoneNumber IN (:...phoneNumbers)', { phoneNumbers });

      existingUsers = await qb.getMany();
    }

    const existingEmails = new Set(
      existingUsers.map((u) => u.email?.toLowerCase().trim()).filter(Boolean),
    );
    const existingPhones = new Set(
      existingUsers.map((u) => u.phoneNumber?.trim()).filter(Boolean),
    );

    // ── 3. Classify rows ───────────────────────────────────────
    const toCreate: BulkCreateUserRowDto[] = [];

    for (const row of rows) {
      const email = row.email?.toLowerCase().trim();
      const phone = row.phoneNumber?.trim();

      if (!email && !phone) {
        result.failed++;
        result.errors.push('Row missing both email and phone — skipped');
        continue;
      }

      const duplicateReasons: string[] = [];
      if (email && existingEmails.has(email))
        duplicateReasons.push(`email ${email} already exists`);
      if (phone && existingPhones.has(phone))
        duplicateReasons.push(`phone ${phone} already exists`);

      if (duplicateReasons.length > 0) {
        if (dto.skipDuplicates) {
          result.skipped++;
        } else {
          result.failed++;
          result.errors.push(`Row rejected — ${duplicateReasons.join(', ')}`);
        }
        continue;
      }

      toCreate.push(row);
    }

    if (toCreate.length === 0) return;

    // ── 4. Prepare all user objects (hash passwords in parallel) ──
    const prepared = await Promise.all(
      toCreate.map(async (row) => {
        try {
          const wasGenerated = !row.password;
          const rawPassword = row.password ?? this.generateTempPassword();
          const passwordHash =
            await this.hashProvider.hashPassword(rawPassword);

          if (wasGenerated) {
            result.generatedPasswords.push({
              identifier: row.email || row.phoneNumber || 'unknown',
              temporaryPassword: rawPassword,
            });
          }

          return { row, passwordHash };
        } catch (err) {
          result.failed++;
          result.errors.push(
            `${row.email || row.phoneNumber || 'unknown'}: failed to prepare — ${(err as Error).message}`,
          );
          return null;
        }
      }),
    );

    const validRows = prepared.filter(
      (p): p is { row: BulkCreateUserRowDto; passwordHash: string } =>
        p !== null,
    );

    if (validRows.length === 0) return;

    // ── 5. Single transaction — batch insert each entity type ──
    try {
      await this.dataSource.transaction(async (manager) => {
        // ── 5a. Insert all Users first ───────────────────────
        const users = validRows.map(({ row, passwordHash }) =>
          manager.create(User, {
            firstName: row.firstName.trim(),
            lastName: row.lastName.trim(),
            middleName: row.middleName?.trim() ?? null,
            email: row.email?.toLowerCase().trim() ?? null,
            phoneNumber: row.phoneNumber?.trim() ?? null,
            passwordHash,
            role: row.role ?? UserRole.STUDENT,
            stateOfResidence: row.stateOfResidence ?? null,
            lga: row.lga ?? null,
            isActive: true,
            // Admin-created users skip email verification
            isEmailVerified: true,
            authProvider: AuthProvider.EMAIL,
          }),
        );

        // Batch insert — one INSERT with all rows, not N inserts
        const savedUsers = await manager.save(User, users);

        // ── 5b. Batch insert UserSettings ────────────────────
        const settings = savedUsers.map((user) =>
          manager.create(UserSettings, { user }),
        );
        await manager.save(UserSettings, settings);

        // ── 5c. Batch insert NotificationPreferences ─────────
        const notifPrefs = savedUsers.map((user) =>
          manager.create(UserNotificationPreferences, { user }),
        );
        await manager.save(UserNotificationPreferences, notifPrefs);

        // ── 5d. Batch insert Subscriptions ────────────────────
        const subscriptions = savedUsers.map((user) =>
          manager.create(Subscription, {
            user,
            tier: SubscriptionTier.FREE,
            status: SubscriptionStatus.ACTIVE,
            startedAt: new Date(),
            expiresAt: null,
            autoRenew: false,
          }),
        );
        await manager.save(Subscription, subscriptions);

        // ── 5e. Batch insert StudentProfiles (STUDENT + PROFESSIONAL_STUDENT) ──
        // Was STUDENT-only, so a bulk-added PROFESSIONAL_STUDENT hit the
        // same "no student profile" 404 as adminCreateUser did.
        const studentUsers = savedUsers.filter(
          (u) =>
            u.role === UserRole.STUDENT ||
            u.role === UserRole.PROFESSIONAL_STUDENT,
        );

        if (studentUsers.length > 0) {
          const profiles = studentUsers.map((user) =>
            manager.create(StudentProfile, {
              user,
              totalXp: 0,
              level: 1,
              levelTitle: 'Beginner',
              currentStreak: 0,
              longestStreak: 0,
            }),
          );
          await manager.save(StudentProfile, profiles);
        }
      });

      result.created += validRows.length;
    } catch (bulkErr) {
      // ── 6. Fallback: row-by-row if batch fails ─────────────
      // One bad row shouldn't discard the whole chunk
      this.logger.warn(
        `Chunk bulk insert failed — falling back to row-by-row: ${(bulkErr as Error).message}`,
      );

      for (const { row, passwordHash } of validRows) {
        try {
          await this.dataSource.transaction(async (manager) => {
            const user = await manager.save(
              User,
              manager.create(User, {
                firstName: row.firstName.trim(),
                lastName: row.lastName.trim(),
                middleName: row.middleName?.trim() ?? null,
                email: row.email?.toLowerCase().trim() ?? null,
                phoneNumber: row.phoneNumber?.trim() ?? null,
                passwordHash,
                role: row.role ?? UserRole.STUDENT,
                stateOfResidence: row.stateOfResidence ?? null,
                lga: row.lga ?? null,
                isActive: true,
                isEmailVerified: true,
                authProvider: AuthProvider.EMAIL,
              }),
            );

            await manager.save(
              UserSettings,
              manager.create(UserSettings, { user }),
            );
            await manager.save(
              UserNotificationPreferences,
              manager.create(UserNotificationPreferences, { user }),
            );
            await manager.save(
              Subscription,
              manager.create(Subscription, {
                user,
                tier: SubscriptionTier.FREE,
                status: SubscriptionStatus.ACTIVE,
                startedAt: new Date(),
                expiresAt: null,
                autoRenew: false,
              }),
            );

            const rowRole = row.role ?? UserRole.STUDENT;
            if (
              rowRole === UserRole.STUDENT ||
              rowRole === UserRole.PROFESSIONAL_STUDENT
            ) {
              await manager.save(
                StudentProfile,
                manager.create(StudentProfile, {
                  user,
                  totalXp: 0,
                  level: 1,
                  levelTitle: 'Beginner',
                  currentStreak: 0,
                  longestStreak: 0,
                }),
              );
            }
          });

          result.created++;
        } catch (rowErr) {
          result.failed++;
          result.errors.push(
            `${row.email || row.phoneNumber || 'unknown'}: ${(rowErr as Error).message}`,
          );
        }
      }
    }
  }

  private chunk<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  private generateTempPassword(): string {
    const year = new Date().getFullYear();
    const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#';
    const random = Array.from(
      { length: 6 },
      () => chars[Math.floor(Math.random() * chars.length)],
    ).join('');
    return `Gravitest@${year}${random}`;
  }
}

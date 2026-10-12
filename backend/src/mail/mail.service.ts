import { Injectable, Logger } from '@nestjs/common';
import { MailProvider } from './providers/mail.provider';
import { MailTemplate } from './enums/mail-template.enum';
import { MailTemplateMap } from './interfaces/mail-template-map.interface';

import {
  EmailVerificationTemplate,
  PasswordResetTemplate,
  PasswordChangedTemplate,
  LoginNewDeviceTemplate,
  EmailChangedTemplate,
  TwoFactorTemplate,
  WelcomeTemplate,
  AccountDeactivatedTemplate,
  AccountRestoredTemplate,
  AccountDeletedTemplate,
  AccountLockedTemplate,
  LogoutAllTemplate,
  SessionRevokedTemplate,
  SubscriptionActivatedTemplate,
  PaymentReceiptTemplate,
  AdminInviteTemplate,
  AnnouncementTemplate,
  UnsubscribeConfirmationTemplate,
} from './interfaces/template.interface';
import { TemplateRendererProvider } from './providers/template-renderer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  constructor(
    private readonly mailProvider: MailProvider,
    private readonly templateRenderer: TemplateRendererProvider,
  ) {}

  /* =========================================================
     PRIVATE UNIVERSAL DISPATCH ENGINE
  ========================================================= */

  private async dispatchEmail<T extends MailTemplate>(
    email: string,
    template: T,
    subject: string,
    variables: MailTemplateMap[T],
    metadata?: {
      type?: string;
      attachments?: any[];
    },
  ): Promise<void> {
    try {
      this.logger.log(`Sending ${template} email to ${email}`);

      const { html, text } = await this.templateRenderer.render(template, {
        subject,
        ...variables,
      });

      await this.mailProvider.send({
        to: email,
        subject,
        html,
        text,
        attachments: metadata?.attachments,
      });

      this.logger.log(`${template} email successfully sent to ${email}`);
    } catch (error: any) {
      this.logger.error(
        `Failed sending ${template} email to ${email}: ${error?.message}`,
        error?.stack,
      );
      // Mail failures do not crash auth/account flows.
      // For strict transactional behaviour, re-throw here.
    }
  }

  /* =========================================================
     AUTH EMAILS
  ========================================================= */

  async sendEmailVerificationOtp(
    email: string,
    variables: EmailVerificationTemplate,
  ): Promise<void> {
    return this.dispatchEmail(
      email,
      MailTemplate.EMAIL_VERIFICATION,
      'Verify your email address — Gravitest', // OTP never in subject
      variables,
      { type: 'verification' },
    );
  }

  async sendPasswordResetOtp(
    email: string,
    variables: PasswordResetTemplate,
  ): Promise<void> {
    return this.dispatchEmail(
      email,
      MailTemplate.PASSWORD_RESET,
      'Reset your password — Gravitest',
      variables,
      { type: 'password-reset' },
    );
  }

  async sendPasswordChangedAlert(
    email: string,
    variables: PasswordChangedTemplate,
  ): Promise<void> {
    return this.dispatchEmail(
      email,
      MailTemplate.PASSWORD_CHANGED,
      'Your password has been changed — Gravitest',
      variables,
      { type: 'security' },
    );
  }

  async sendLoginNewDeviceAlert(
    email: string,
    variables: LoginNewDeviceTemplate,
  ): Promise<void> {
    return this.dispatchEmail(
      email,
      MailTemplate.LOGIN_NEW_DEVICE,
      'New sign-in to your account — Gravitest',
      variables,
      { type: 'security' },
    );
  }

  async sendEmailChangedAlert(
    email: string,
    variables: EmailChangedTemplate,
  ): Promise<void> {
    return this.dispatchEmail(
      email,
      MailTemplate.EMAIL_CHANGED,
      'Your email address has been updated — Gravitest',
      variables,
      { type: 'security' },
    );
  }

  async sendTwoFactorCode(
    email: string,
    variables: TwoFactorTemplate,
  ): Promise<void> {
    return this.dispatchEmail(
      email,
      MailTemplate.TWO_FACTOR,
      'Your two-factor authentication code — Gravitest', // OTP never in subject
      variables,
      { type: 'verification' },
    );
  }

  /* =========================================================
     ACCOUNT EMAILS
  ========================================================= */

  async sendWelcomeEmail(
    email: string,
    variables: WelcomeTemplate,
  ): Promise<void> {
    return this.dispatchEmail(
      email,
      MailTemplate.WELCOME,
      'Welcome to Gravitest — your preparation starts now',
      variables,
      { type: 'welcome' },
    );
  }

  async sendAccountDeactivatedEmail(
    email: string,
    variables: AccountDeactivatedTemplate,
  ): Promise<void> {
    return this.dispatchEmail(
      email,
      MailTemplate.ACCOUNT_DEACTIVATED,
      'Your account has been deactivated — Gravitest',
      variables,
      { type: 'account' },
    );
  }

  async sendAccountRestoredEmail(
    email: string,
    variables: AccountRestoredTemplate,
  ): Promise<void> {
    return this.dispatchEmail(
      email,
      MailTemplate.ACCOUNT_RESTORED,
      'Your account has been restored — Gravitest',
      variables,
      { type: 'account' },
    );
  }

  async sendAccountDeletedEmail(
    email: string,
    variables: AccountDeletedTemplate,
  ): Promise<void> {
    return this.dispatchEmail(
      email,
      MailTemplate.ACCOUNT_DELETED,
      'Your account has been deleted — Gravitest',
      variables,
      { type: 'account' },
    );
  }

  async sendAccountLockedEmail(
    email: string,
    variables: AccountLockedTemplate,
  ): Promise<void> {
    return this.dispatchEmail(
      email,
      MailTemplate.ACCOUNT_LOCKED,
      'Your account has been temporarily locked — Gravitest',
      variables,
      { type: 'security' },
    );
  }

  /* =========================================================
     SESSION EMAILS
  ========================================================= */

  async sendLogoutAllDevicesEmail(
    email: string,
    variables: LogoutAllTemplate,
  ): Promise<void> {
    return this.dispatchEmail(
      email,
      MailTemplate.LOGOUT_ALL,
      'You have been signed out of all devices — Gravitest',
      variables,
      { type: 'security' },
    );
  }

  async sendSessionRevokedEmail(
    email: string,
    variables: SessionRevokedTemplate,
  ): Promise<void> {
    return this.dispatchEmail(
      email,
      MailTemplate.SESSION_REVOKED,
      'A session has been revoked — Gravitest',
      variables,
      { type: 'security' },
    );
  }

  /* =========================================================
     PRODUCT EMAILS
  ========================================================= */

  async sendSubscriptionActivatedEmail(
    email: string,
    variables: SubscriptionActivatedTemplate,
  ): Promise<void> {
    return this.dispatchEmail(
      email,
      MailTemplate.SUBSCRIPTION_ACTIVATED,
      'Your Gravitest subscription is now active',
      variables,
      { type: 'billing' },
    );
  }

  async sendPaymentReceiptEmail(
    email: string,
    variables: PaymentReceiptTemplate,
    attachments?: any[],
  ): Promise<void> {
    const ref = variables.invoiceNumber ?? variables.reference;
    return this.dispatchEmail(
      email,
      MailTemplate.PAYMENT_RECEIPT,
      `Payment receipt${ref ? ` — ${ref}` : ''} — Gravitest`,
      variables,
      { type: 'billing', attachments },
    );
  }

  async sendAdminInvitationEmail(
    email: string,
    variables: AdminInviteTemplate,
  ): Promise<void> {
    return this.dispatchEmail(
      email,
      MailTemplate.ADMIN_INVITE,
      `You have been invited to join the Gravitest admin team`,
      variables,
      { type: 'invitation' },
    );
  }

  /* =========================================================
     NOTIFICATION / BROADCAST EMAILS
  ========================================================= */

  // Used by NotificationsService for admin-composed broadcasts and, as a
  // fallback, for any notification type sent via NotificationChannel.EMAIL
  // that doesn't yet have its own dedicated template.
  async sendAnnouncementEmail(
    email: string,
    variables: AnnouncementTemplate,
  ): Promise<void> {
    return this.dispatchEmail(
      email,
      MailTemplate.ANNOUNCEMENT,
      variables.subject,
      variables,
      { type: 'announcement' },
    );
  }

  // Sent once, right after someone uses the one-click unsubscribe link
  // (see mail/mail.controller.ts) — confirms it worked and clarifies
  // that essential account emails (receipts, password resets, security
  // alerts) are unaffected, since those aren't part of this preference.
  async sendUnsubscribeConfirmation(
    email: string,
    variables: UnsubscribeConfirmationTemplate,
  ): Promise<void> {
    return this.dispatchEmail(
      email,
      MailTemplate.UNSUBSCRIBE_CONFIRMATION,
      "You've been unsubscribed",
      variables,
      { type: 'unsubscribe-confirmation' },
    );
  }
}

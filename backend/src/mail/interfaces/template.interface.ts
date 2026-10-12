import { UserTemplateContext } from './template-context.interface';

/* =========================
   AUTH TEMPLATES
========================= */

export interface EmailVerificationTemplate extends UserTemplateContext {
  otpCode: string;
  expiryMinutes: number;
  verificationUrl?: string;
}

export interface PasswordResetTemplate extends UserTemplateContext {
  otpCode: string;
  expiryMinutes: number;
  resetUrl?: string;
}

export interface TwoFactorTemplate extends UserTemplateContext {
  otpCode: string;
  expiryMinutes: number;
  loginUrl?: string;
}

// Single declaration — no duplicate
export interface PasswordChangedTemplate extends UserTemplateContext {
  changedAt: string;
  deviceName?: string;
  browser?: string;
  ipAddress?: string;
  time?: string;
  securityUrl?: string;
}

export interface LoginNewDeviceTemplate extends UserTemplateContext {
  deviceName?: string;
  browser?: string;
  ipAddress?: string;
  time?: string;
  location?: string;
  securityUrl?: string;
}

export interface EmailChangedTemplate extends UserTemplateContext {
  oldEmail: string;
  newEmail: string;
  changedAt?: string;
  revertUrl?: string;
}

/* =========================
   ACCOUNT TEMPLATES
========================= */

export interface WelcomeTemplate extends UserTemplateContext {
  dashboardUrl: string;
}

export interface AccountDeactivatedTemplate extends UserTemplateContext {
  supportUrl?: string;
  reason?: string;
}

export interface AccountRestoredTemplate extends UserTemplateContext {
  loginUrl: string;
}

export interface AccountDeletedTemplate extends UserTemplateContext {}

export interface AccountLockedTemplate extends UserTemplateContext {
  resetUrl?: string;
  reason?: string;
  lockedAt?: string;
  supportLink?: string;
}

/* =========================
   SESSION TEMPLATES
========================= */

export interface LogoutAllTemplate extends UserTemplateContext {
  loginUrl?: string; // matches template: {{loginUrl}}
}

export interface SessionRevokedTemplate extends UserTemplateContext {
  deviceName?: string; // matches template: {{deviceName}}
  sessionsUrl?: string; // matches template: {{sessionsUrl}}
}

/* =========================
   PRODUCT TEMPLATES
========================= */

export interface SubscriptionActivatedTemplate extends UserTemplateContext {
  planName: string;
  billingCycle: string;
  amount: string;
  nextBillingDate: string;
  dashboardUrl?: string;
}

export interface PaymentReceiptTemplate extends UserTemplateContext {
  description: string;
  amount: string;
  date: string;
  reference: string;
  paymentMethod: string;
  invoiceUrl?: string;
  invoiceNumber?: string;
}

export interface AdminInviteTemplate extends UserTemplateContext {
  firstName: string;
  lastName: string;
  phone?: string;
  invitedByName: string;
  expiryDays: number;
  inviteUrl: string;
  role: string;
}

/* =========================
   NOTIFICATION / BROADCAST TEMPLATES
========================= */

// Backs admin-composed broadcasts (see AdminBroadcast entity).
// `subject` doubles as the email subject line and the page <title>.
export interface AnnouncementTemplate extends UserTemplateContext {
  subject: string;
  heading?: string; // optional bold headline above the body text
  body: string; // admin-authored freeform message
  buttonText?: string;
  buttonUrl?: string;
  unsubscribeUrl?: string;
}

export interface UnsubscribeConfirmationTemplate extends UserTemplateContext {
  notificationSettingsUrl: string;
}

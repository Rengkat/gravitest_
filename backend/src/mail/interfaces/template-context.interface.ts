export interface SystemTemplateContext {
  appName: string;
  year: number;
  appUrl: string;
  supportEmail?: string;
  logoUrl?: string;
  // Per-recipient, one-click unsubscribe link (see mail/mail.controller.ts
  // + auth/providers/unsubscribe-token.provider.ts). Only set for
  // marketing/broadcast sends — transactional emails (password reset,
  // OTP, security alerts) never pass this, and the footer partial hides
  // the link entirely when it's absent, so there's no risk of someone
  // unsubscribing from a critical security email by mistake.
  unsubscribeUrl?: string;
}

/**
 * Common business variable required by most user-facing templates
 */
export interface UserTemplateContext {
  firstName: string;
}

/**
 * Final merged context seen inside handlebars during rendering
 */
export type BaseTemplateContext = SystemTemplateContext & UserTemplateContext;

export enum MailTemplate {
  EMAIL_VERIFICATION = 'auth/email-verification',
  PASSWORD_RESET = 'auth/password-reset',
  PASSWORD_CHANGED = 'auth/password-changed',
  LOGIN_NEW_DEVICE = 'auth/login-new-device',
  EMAIL_CHANGED = 'auth/email-changed',
  TWO_FACTOR = 'auth/two-factor',

  WELCOME = 'account/welcome',
  ACCOUNT_DEACTIVATED = 'account/deactivated',
  ACCOUNT_RESTORED = 'account/restored',
  ACCOUNT_DELETED = 'account/deleted',
  ACCOUNT_LOCKED = 'account/account-locked',
  ADMIN_INVITE = 'account/admin-invite',

  LOGOUT_ALL = 'session/logout-all',
  SESSION_REVOKED = 'session/session-revoked',

  SUBSCRIPTION_ACTIVATED = 'product/subscription-activated',
  PAYMENT_RECEIPT = 'product/payment-receipt',

  ANNOUNCEMENT = 'notifications/announcement',
  UNSUBSCRIBE_CONFIRMATION = 'notifications/unsubscribe',
}

export type SettingsSection =
  | "appearance"
  | "study"
  | "accessibility"
  | "language"
  | "privacy"
  | "data"
  | "integrations"
  | "danger"
  | "platform"
  | "security"
  | "notifications"
  | "backup";

export type ThemeMode = "light" | "dark" | "system";
export type FontSize = "small" | "medium" | "large";
export type DashboardLayout = "compact" | "comfortable" | "spacious";
export type AccentColor = "green" | "gold" | "blue" | "purple" | "orange" | "red";

export interface AppearanceSettings {
  theme: ThemeMode;
  accentColor: AccentColor;
  fontSize: FontSize;
  dashboardLayout: DashboardLayout;
  showAnimations: boolean;
  showAvatarInHeader: boolean;
  sidebarCollapsed: boolean;
}

export interface PlatformSettings {
  maintenanceMode: boolean;
  registrationEnabled: boolean;
  emailVerificationRequired: boolean;
  defaultUserRole: "student";
  proPlanEnabled: boolean;
  annualDiscountsEnabled: boolean;
  aiExplainEnabled: boolean;
  aiTutorEnabled: boolean;
  voiceInputEnabled: boolean;
  pidginModeEnabled: boolean;
}

export interface SecuritySettings {
  requireStrongPassword: boolean;
  twoFactorEnabled: boolean;
  forceTwoFactorForAdmins: boolean;
  sessionTimeout: number;
  maxLoginAttempts: number;
  apiRateLimit: number;
  loginRateLimit: number;
}

export interface NotificationSettings {
  newUserEmail: boolean;
  paymentEmail: boolean;
  refundEmail: boolean;
  supportEmail: boolean;
  systemAlertEmail: boolean;
  otpSms: boolean;
  paymentSms: boolean;
}

export interface IntegrationSettings {
  paystackEnabled: boolean;
  paystackSecretKey: string;
  flutterwaveEnabled: boolean;
  flutterwaveSecretKey: string;
  termiiEnabled: boolean;
  termiiApiKey: string;
  termiiSenderId: string;
  aiEnabled: boolean;
  aiApiKey: string;
  aiModel: string;
}

export interface AllSettings {
  appearance: AppearanceSettings;
  platform: PlatformSettings;
  security: SecuritySettings;
  notifications: NotificationSettings;
  integrations: IntegrationSettings;
}

// Default settings
export const DEFAULT_APPEARANCE: AppearanceSettings = {
  theme: "light",
  accentColor: "green",
  fontSize: "medium",
  dashboardLayout: "comfortable",
  showAnimations: true,
  showAvatarInHeader: true,
  sidebarCollapsed: false,
};

export const DEFAULT_PLATFORM: PlatformSettings = {
  maintenanceMode: false,
  registrationEnabled: true,
  emailVerificationRequired: true,
  defaultUserRole: "student",
  proPlanEnabled: true,
  annualDiscountsEnabled: true,
  aiExplainEnabled: true,
  aiTutorEnabled: true,
  voiceInputEnabled: true,
  pidginModeEnabled: true,
};

export const DEFAULT_SECURITY: SecuritySettings = {
  requireStrongPassword: true,
  twoFactorEnabled: true,
  forceTwoFactorForAdmins: true,
  sessionTimeout: 28800,
  maxLoginAttempts: 5,
  apiRateLimit: 60,
  loginRateLimit: 10,
};

export const DEFAULT_NOTIFICATIONS: NotificationSettings = {
  newUserEmail: true,
  paymentEmail: true,
  refundEmail: true,
  supportEmail: true,
  systemAlertEmail: true,
  otpSms: true,
  paymentSms: true,
};

export const DEFAULT_INTEGRATIONS: IntegrationSettings = {
  paystackEnabled: true,
  paystackSecretKey: "",
  flutterwaveEnabled: false,
  flutterwaveSecretKey: "",
  termiiEnabled: true,
  termiiApiKey: "",
  termiiSenderId: "GRAVITEST",
  aiEnabled: true,
  aiApiKey: "",
  aiModel: "claude-sonnet-4",
};

export const DEFAULT_SETTINGS: AllSettings = {
  appearance: DEFAULT_APPEARANCE,
  platform: DEFAULT_PLATFORM,
  security: DEFAULT_SECURITY,
  notifications: DEFAULT_NOTIFICATIONS,
  integrations: DEFAULT_INTEGRATIONS,
};

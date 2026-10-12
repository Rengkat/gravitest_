export type UserRole = "student" | "admin" | "super_admin";
export type Gender = "male" | "female" | "other" | "prefer_not_to_say";
export type ProfileSection =
  | "profile"
  | "academic"
  | "security"
  | "notifications"
  | "connected"
  | "billing";

export interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  email: string;
  phoneNumber?: string;
  role: UserRole;
  avatarUrl?: string | null;
  dateOfBirth?: string;
  gender?: Gender;
  stateOfResidence?: string;
  lga?: string;
  bio?: string;
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  createdAt: string;
  lastLoginAt?: string;
  // Academic info (student-specific)
  currentClass?: string;
  targetExams?: string[];
  school?: string;
  aspirations?: string;
  // Stats
  totalXP: number;
  level: number;
  streak: number;
  completedSessions: number;
  rank: number;
}

export interface NotificationSettings {
  emailNotifications: boolean;
  pushNotifications: boolean;
  smsNotifications: boolean;
  marketingEmails: boolean;
  sessionReminders: boolean;
  achievementAlerts: boolean;
  weeklyReport: boolean;
  newResourceAlerts: boolean;
}

export interface ProfileFormData {
  firstName: string;
  lastName: string;
  middleName: string;
  phoneNumber: string;
  dateOfBirth: string;
  gender: string;
  stateOfResidence: string;
  lga: string;
  bio: string;
}

export interface AcademicFormData {
  currentClass: string;
  targetExams: string[];
  school: string;
  targetUniversity: string;
  targetCourse: string;
  targetScore: string;
}

export interface PasswordFormData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface ActiveSession {
  id: string;
  device: string;
  browser: string;
  ipAddress: string;
  lastActive: string;
  isCurrent: boolean;
}

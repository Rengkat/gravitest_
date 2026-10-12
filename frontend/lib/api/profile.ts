import { apiClient } from "./client";

// ── User (account) profile ───────────────────────────────────────────────

export interface BackendUserProfile {
  id: string;
  firstName: string;
  lastName: string;
  middleName?: string | null;
  fullName: string;
  email: string;
  phoneNumber?: string | null;
  role: string;
  isActive: boolean;
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  isOnboarded: boolean;
  avatarUrl?: string | null;
  dateOfBirth?: string | null;
  gender?: string | null;
  stateOfResidence?: string | null;
  lga?: string | null;
  bio?: string | null;
  lastLoginAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateUserPayload {
  firstName?: string;
  lastName?: string;
  middleName?: string;
  phoneNumber?: string;
  avatar?: string;
  dateOfBirth?: string;
  gender?: string;
  stateOfResidence?: string;
  lga?: string;
  bio?: string;
}

export async function uploadAvatar(file: File): Promise<BackendUserProfile> {
  const formData = new FormData();
  formData.append("file", file);
  const { data } = await apiClient.post("/users/me/avatar", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
}

export async function getMe(): Promise<BackendUserProfile> {
  const { data } = await apiClient.get("/users/me");
  return data;
}

export async function updateMe(payload: UpdateUserPayload): Promise<BackendUserProfile> {
  const { data } = await apiClient.patch("/users/me", payload);
  return data;
}

export async function changePassword(payload: {
  currentPassword: string;
  newPassword: string;
}): Promise<{ message: string }> {
  const { data } = await apiClient.patch("/users/me/password", payload);
  return data;
}

export async function deactivateAccount(): Promise<{ message: string }> {
  const { data } = await apiClient.delete("/users/me");
  return data;
}

// Called once at the end of /complete-registration, after personal +
// academic + exam-goal details are saved. Flips isOnboarded to true so the
// user is never sent back through the wizard.
export async function completeOnboarding(): Promise<BackendUserProfile> {
  const { data } = await apiClient.patch("/users/me/complete-onboarding");
  return data;
}

export async function getSettings(): Promise<Record<string, unknown>> {
  const { data } = await apiClient.get("/users/me/settings");
  return data;
}

export async function updateSettings(payload: Record<string, unknown>): Promise<Record<string, unknown>> {
  const { data } = await apiClient.patch("/users/me/settings", payload);
  return data;
}

// ── Academic (student) profile ───────────────────────────────────────────

export interface BackendStudentProfile {
  id: string;
  currentSchool: string | null;
  currentClass: string | null;
  graduationYear: number | null;
  examTargets: string[];
  examDate: string | null;
  targetScore: number | null;
  targetUniversity: string | null;
  targetCourse: string | null;
  focusSubjects: string[];
  totalXp: number;
  level: number;
  levelTitle: string;
  currentStreak: number;
  longestStreak: number;
  averageScore: number;
  totalExamsTaken: number;
  leaderboardRank: number | null;
}

export interface UpdateAcademicPayload {
  currentSchool?: string | null;
  currentClass?: string | null;
  graduationYear?: number | null;
  examTargets?: string[];
  examDate?: string | null;
  targetScore?: number | null;
  targetUniversity?: string | null;
  targetCourse?: string | null;
  focusSubjects?: string[];
}

export async function getAcademicProfile(): Promise<BackendStudentProfile> {
  const { data } = await apiClient.get("/students/me/profile");
  return data;
}

export async function updateAcademicProfile(
  payload: UpdateAcademicPayload,
): Promise<BackendStudentProfile> {
  const { data } = await apiClient.patch("/students/me/profile", payload);
  return data;
}

// ── Sessions ──────────────────────────────────────────────────────────────

export interface BackendSession {
  id: string;
  deviceName: string | null;
  userAgent: string | null;
  ipAddress: string | null;
  createdAt: string;
  lastUsedAt: string | null;
  isCurrent: boolean;
}

export async function listSessions(): Promise<BackendSession[]> {
  const { data } = await apiClient.get("/auth/sessions");
  return data;
}

export async function revokeSession(id: string): Promise<{ message: string }> {
  const { data } = await apiClient.delete(`/auth/sessions/${id}`);
  return data;
}

export async function logoutAllDevices(): Promise<{ message: string; sessionsRevoked?: number }> {
  const { data } = await apiClient.post("/auth/logout-all");
  return data;
}

"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import * as profileApi from "@/lib/api/profile";
import type { BackendUserProfile, BackendStudentProfile } from "@/lib/api/profile";
import type { UserProfile, ProfileFormData, AcademicFormData } from "@/types/profile";
import { extractErrorMessage } from "@/lib/api/client";

function mapToUserProfile(
  user: BackendUserProfile,
  student: BackendStudentProfile | null,
): UserProfile {
  return {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    middleName: user.middleName ?? undefined,
    email: user.email,
    phoneNumber: user.phoneNumber ?? undefined,
    role: user.role as UserProfile["role"],
    avatarUrl: user.avatarUrl,
    dateOfBirth: user.dateOfBirth ?? undefined,
    gender: (user.gender as UserProfile["gender"]) ?? undefined,
    stateOfResidence: user.stateOfResidence ?? undefined,
    lga: user.lga ?? undefined,
    bio: user.bio ?? undefined,
    isEmailVerified: user.isEmailVerified,
    isPhoneVerified: user.isPhoneVerified,
    createdAt: user.createdAt,
    lastLoginAt: user.lastLoginAt ?? undefined,
    currentClass: student?.currentClass ?? undefined,
    targetExams: student?.examTargets ?? [],
    school: student?.currentSchool ?? undefined,
    // No free-text "aspirations" field on the backend — see
    // AcademicSection, which uses targetUniversity/targetCourse instead.
    aspirations: undefined,
    totalXP: student?.totalXp ?? 0,
    level: student?.level ?? 1,
    streak: student?.currentStreak ?? 0,
    completedSessions: student?.totalExamsTaken ?? 0,
    rank: student?.leaderboardRank ?? 0,
  };
}

function toFormData(user: BackendUserProfile): ProfileFormData {
  return {
    firstName: user.firstName,
    lastName: user.lastName,
    middleName: user.middleName ?? "",
    phoneNumber: user.phoneNumber ?? "",
    dateOfBirth: user.dateOfBirth ? user.dateOfBirth.split("T")[0] : "",
    gender: user.gender ?? "",
    stateOfResidence: user.stateOfResidence ?? "",
    lga: user.lga ?? "",
    bio: user.bio ?? "",
  };
}

function toAcademicFormData(student: BackendStudentProfile | null): AcademicFormData {
  return {
    currentClass: student?.currentClass ?? "",
    targetExams: student?.examTargets ?? [],
    school: student?.currentSchool ?? "",
    targetUniversity: student?.targetUniversity ?? "",
    targetCourse: student?.targetCourse ?? "",
    targetScore: student?.targetScore != null ? String(student.targetScore) : "",
  };
}

export function useProfile() {
  const [user, setUser] = useState<BackendUserProfile | null>(null);
  const [student, setStudent] = useState<BackendStudentProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [userResult, studentResult] = await Promise.all([
        profileApi.getMe(),
        profileApi.getAcademicProfile().catch(() => null), // e.g. admin accounts have no student profile
      ]);
      setUser(userResult);
      setStudent(studentResult);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const profile = useMemo(() => (user ? mapToUserProfile(user, student) : null), [user, student]);
  const formData = useMemo(() => (user ? toFormData(user) : null), [user]);
  const academicFormData = useMemo(() => toAcademicFormData(student), [student]);

  const saveProfile = useCallback(async (data: ProfileFormData) => {
    const updated = await profileApi.updateMe({
      firstName: data.firstName,
      lastName: data.lastName,
      middleName: data.middleName || undefined,
      phoneNumber: data.phoneNumber || undefined,
      dateOfBirth: data.dateOfBirth || undefined,
      gender: data.gender || undefined,
      stateOfResidence: data.stateOfResidence || undefined,
      lga: data.lga || undefined,
      bio: data.bio || undefined,
    });
    setUser(updated);
  }, []);

  const saveAcademic = useCallback(async (data: AcademicFormData) => {
    const updated = await profileApi.updateAcademicProfile({
      currentClass: data.currentClass || undefined,
      currentSchool: data.school || undefined,
      examTargets: data.targetExams as any,
      targetUniversity: data.targetUniversity || undefined,
      targetCourse: data.targetCourse || undefined,
      targetScore: data.targetScore ? Number(data.targetScore) : undefined,
    });
    setStudent(updated);
  }, []);

  return {
    isLoading,
    error,
    reload: load,
    profile,
    formData,
    academicFormData,
    saveProfile,
    saveAcademic,
  };
}

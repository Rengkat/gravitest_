"use client";

import { Flame, Trophy, Target, TrendingUp, GraduationCap, Calendar } from "lucide-react";
import type { AdminUser } from "../../types";
import type { StudentOverview } from "@/lib/api/admin-dashboard";
import { Card, MiniStatCard } from "../../components/Primitives";

const STUDENT_ROLES = new Set(["student", "professional_student"]);

export function OverviewTab({
  user,
  studentOverview,
}: {
  user: AdminUser;
  studentOverview: StudentOverview | null;
}) {
  if (!STUDENT_ROLES.has(user.role)) {
    return (
      <Card className="p-6 text-center text-text-muted text-[14px]">
        {user.fullName} has an {user.role.replace("_", " ")} account — there's no learner profile
        (XP, streak, exam data) for admin accounts.
      </Card>
    );
  }

  if (!studentOverview) {
    return (
      <Card className="p-6 text-center text-text-muted text-[14px]">
        No student profile data available for this account yet.
      </Card>
    );
  }

  const { profile, stats, daysUntilExam } = studentOverview;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MiniStatCard icon={Trophy} label="Total XP" value={stats.totalXp.toLocaleString()} color="#f5c842" />
        <MiniStatCard icon={Flame} label="Current Streak" value={`${stats.currentStreak}d`} color="#f97316" />
        <MiniStatCard icon={Target} label="Avg Score" value={`${Math.round(stats.averageScore)}%`} color="#0284c7" />
        <MiniStatCard
          icon={TrendingUp}
          label="Exams Taken"
          value={stats.totalExamsTaken.toLocaleString()}
          color="#10b981"
        />
      </div>

      <Card className="p-6">
        <h3 className="font-serif text-lg text-green-900 mb-4">Academic Profile</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-[13px]">
          <div className="flex items-center gap-2">
            <GraduationCap size={16} className="text-text-muted" />
            <span className="text-text-muted">School:</span>
            <span className="font-semibold text-green-900">{profile.currentSchool ?? "Not set"}</span>
          </div>
          <div className="flex items-center gap-2">
            <GraduationCap size={16} className="text-text-muted" />
            <span className="text-text-muted">Class:</span>
            <span className="font-semibold text-green-900">{profile.currentClass ?? "Not set"}</span>
          </div>
          <div className="flex items-center gap-2">
            <Target size={16} className="text-text-muted" />
            <span className="text-text-muted">Exam Targets:</span>
            <span className="font-semibold text-green-900 uppercase">
              {profile.examTargets.join(", ") || "Not set"}
            </span>
          </div>
          {daysUntilExam !== null && (
            <div className="flex items-center gap-2">
              <Calendar size={16} className="text-text-muted" />
              <span className="text-text-muted">Days Until Exam:</span>
              <span className="font-semibold text-green-900">{daysUntilExam}</span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <Trophy size={16} className="text-text-muted" />
            <span className="text-text-muted">Level:</span>
            <span className="font-semibold text-green-900">
              {stats.level} — {stats.levelTitle}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Flame size={16} className="text-text-muted" />
            <span className="text-text-muted">Longest Streak:</span>
            <span className="font-semibold text-green-900">{stats.longestStreak} days</span>
          </div>
          {stats.leaderboardRank !== null && (
            <div className="flex items-center gap-2">
              <TrendingUp size={16} className="text-text-muted" />
              <span className="text-text-muted">Leaderboard Rank:</span>
              <span className="font-semibold text-green-900">#{stats.leaderboardRank}</span>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}

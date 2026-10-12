"use client";

import Link from "next/link";
import { Flame, Sparkles, Target, Clock, Award, Zap, Library, AlertCircle, Loader2 } from "lucide-react";
import StatCard from "@/Components/StatCard";
import WeakTopicCard from "../components/WeakTopicCard";
import QuickActionCard from "../components/QuickActions";
import RecentSessionList from "../components/RecentSessionLis";
import LibraryItemCard from "../components/LibraryItemCard";
import Achievements from "../components/Achievements";
import GamesOverviewPanel from "../components/GamesOverviewPanel";
import { useDashboardOverview } from "../hooks/useDashboardOverview";
import { useAuthStore } from "@/lib/store/authStore";

export default function DashboardHome() {
  const firstName = useAuthStore((s) => s.user?.firstName) ?? "there";
  const {
    isLoading,
    error,
    reload,
    overview,
    recentSessions,
    weakTopics,
    recommendedLibraryItems,
  } = useDashboardOverview();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 size={32} className="animate-spin text-green-600" />
      </div>
    );
  }

  if (error || !overview) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center gap-3">
        <p className="text-[14px] text-red-600">{error ?? "Couldn't load your dashboard."}</p>
        <button
          onClick={reload}
          className="px-4 py-2 rounded-xl bg-green-700 text-white text-[13px] font-medium hover:bg-green-800 transition-all">
          Try again
        </button>
      </div>
    );
  }

  const { stats, daysUntilExam } = overview;
  const studyHours = Math.round((stats.totalMinutesStudied / 60) * 10) / 10;

  return (
    <div className="max-w-7xl mx-auto">
      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="font-serif text-3xl text-green-900 mb-2">Welcome back, {firstName}! 👋</h1>
        <p className="text-text-muted">
          {daysUntilExam != null
            ? `Your exam is in ${daysUntilExam} day${daysUntilExam !== 1 ? "s" : ""}. Let's make every session count.`
            : "Set a target exam date in your profile to see a countdown here."}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard icon={Flame} label="Current Streak" value={`${stats.currentStreak} days`} color="#f97316" />
        <StatCard icon={Sparkles} label="Total XP" value={stats.totalXp.toLocaleString()} color="#f5c842" />
        <StatCard
          icon={Target}
          label="Average Score"
          value={`${Math.round(stats.averageScore)}%`}
          color="#2e8b57"
        />
        <StatCard icon={Clock} label="Study Hours" value={`${studyHours} hrs`} color="#6366f1" />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <QuickActionCard
          href="/dashboard/practice"
          gradient="from-green-800 to-green-700"
          icon={Target}
          title="Start Practice"
          description="Take a mock exam or practice session"
        />

        <QuickActionCard
          href="/dashboard/ai-tutor"
          gradient="from-gold to-gold-dark"
          icon={Zap}
          title="Ask AI Tutor"
          description="Get instant explanations in Pidgin"
          textColor="text-green-900"
          descriptionColor="text-green-900/60"
        />

        <QuickActionCard
          href="/dashboard/games"
          gradient="from-purple-600 to-purple-500"
          icon={Award}
          title="Play & Learn"
          description="Challenge yourself with academic games"
        />
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Recent Sessions & Weak Topics */}
        <div className="lg:col-span-2 space-y-6">
          <div className="p-6 rounded-2xl bg-white border" style={{ borderColor: "rgba(30,80,50,0.08)" }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-serif text-xl text-green-900">Recent Sessions</h2>
              <Link
                href="/dashboard/performance"
                className="text-[12px] font-semibold text-green-600 hover:text-green-700">
                View All →
              </Link>
            </div>
            <div className="space-y-3">
              <RecentSessionList
                sessions={recentSessions}
                maxItems={5}
                emptyMessage="No exam sessions yet — start a practice session to see it here."
              />
            </div>
          </div>

          {/* Weak Topics */}
          <div className="p-6 rounded-2xl bg-white border" style={{ borderColor: "rgba(30,80,50,0.08)" }}>
            <div className="flex items-center gap-2 mb-4">
              <AlertCircle size={18} className="text-orange-500" />
              <h2 className="font-serif text-xl text-green-900">Topics to Improve</h2>
            </div>
            {weakTopics.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {weakTopics.map((topic) => (
                  <WeakTopicCard key={topic.id} {...topic} />
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-[13px] text-text-muted">
                No weak topics flagged yet — keep practicing and we'll surface areas to focus on.
              </div>
            )}
          </div>
        </div>

        {/* Right Column - Recommended Library & Achievements */}
        <div className="space-y-6">
          {/* Recommended Library */}
          <div className="p-6 rounded-2xl bg-white border" style={{ borderColor: "rgba(30,80,50,0.08)" }}>
            <div className="flex items-center gap-2 mb-4">
              <Library size={18} className="text-green-600" />
              <h2 className="font-serif text-xl text-green-900">Recommended for You</h2>
            </div>
            {recommendedLibraryItems.length > 0 ? (
              recommendedLibraryItems.map((item) => <LibraryItemCard key={item.id} item={item} />)
            ) : (
              <div className="text-center py-6">
                <Library size={32} className="mx-auto mb-2 text-text-muted/50" />
                <div className="text-[13px] text-text-muted">No recommendations yet</div>
                <Link
                  href="/dashboard/library"
                  className="inline-block mt-2 text-[12px] font-semibold text-green-600">
                  Browse Library →
                </Link>
              </div>
            )}
          </div>

          {/* Game Progress — cross-game overview, grows as more games land */}
          <GamesOverviewPanel />

          {/* Achievements */}
          <Achievements
            currentStreak={stats.currentStreak}
            totalExamsTaken={stats.totalExamsTaken}
            level={stats.level}
            levelTitle={stats.levelTitle}
          />
        </div>
      </div>
    </div>
  );
}

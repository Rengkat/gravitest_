"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Target,
  ClipboardCheck,
  MessageSquare,
  BookOpen,
  TrendingUp,
  Lightbulb,
  Clock,
  Loader2,
} from "lucide-react";
import { ScoreDistribution } from "../components/ScoreDistribution";
import { AutoGradingPanel } from "../components/AutoGradingPanel";
import { FeedbackAnalytics } from "../components/FeedbackAnalytics";
import { RubricManager } from "../components/RubricManager";
import { InsightsTab } from "../components/InsightsTab";
import type { PracticeQuestionScore, ScoringAnalytics, ExamSubmission } from "../../types";
import * as aiAdminApi from "@/lib/api/ai-admin";
import { extractErrorMessage } from "@/lib/api/client";

type Tab = "overview" | "grading" | "feedback" | "insights" | "rubrics";

const TABS: { id: Tab; label: string; icon: any }[] = [
  { id: "overview", label: "Overview", icon: TrendingUp },
  { id: "grading", label: "Auto-Grading", icon: ClipboardCheck },
  { id: "feedback", label: "Feedback", icon: MessageSquare },
  { id: "insights", label: "Insights", icon: Lightbulb },
  { id: "rubrics", label: "Rubrics", icon: BookOpen },
];

const EMPTY_EXAM_SUBMISSIONS: ExamSubmission[] = [];

function mapScore(s: aiAdminApi.AiEssayScore): PracticeQuestionScore {
  return {
    id: s.id,
    questionId: s.questionId ?? "",
    questionText: s.questionText ?? "",
    studentId: s.userId,
    studentName: `User ${s.userId.slice(0, 8)}`,
    studentAnswer: s.studentAnswer,
    correctAnswer: s.modelAnswer ?? undefined,
    aiScore: Math.round((s.aiScore / s.maxScore) * 100),
    aiFeedback: s.aiFeedback,
    confidence: Number(s.confidence),
    suggestedImprovements: s.improvements,
    scoringCriteria: s.scoringCriteria,
    gradedAt: s.gradedAt,
    reviewedBy: s.reviewedBy ?? undefined,
    reviewedScore: s.reviewedScore ?? undefined,
    reviewNotes: s.reviewNotes ?? undefined,
  };
}

export default function PracticeScoringPage() {
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [analytics, setAnalytics] = useState<ScoringAnalytics | null>(null);
  const [needsReview, setNeedsReview] = useState<PracticeQuestionScore[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [analyticsRes, reviewList] = await Promise.all([
        aiAdminApi.getScoringAnalytics(),
        aiAdminApi.listNeedsReview(),
      ]);
      setAnalytics({
        totalQuestionsGraded: analyticsRes.totalQuestionsGraded,
        averageScore: Math.round(analyticsRes.averageScorePct * 10) / 10,
        scoreDistribution: analyticsRes.scoreDistribution,
        // Not available from a single backend query yet — see
        // AiScoringService.getAnalytics(), which doesn't break scores down
        // by confidence bucket or subject. Left empty rather than faked;
        // ScoreDistribution/the subject-performance block below both
        // handle an empty array by rendering nothing.
        confidenceDistribution: [],
        subjectPerformance: [],
        teacherReviewRate: Math.round(analyticsRes.teacherReviewRate * 10) / 10,
        reviewDiscrepancy: analyticsRes.reviewDiscrepancyAvg ?? 0,
      });
      setNeedsReview(reviewList.map(mapScore));
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleOverride = async (scoreId: string, reviewedScore: number, reviewNotes: string) => {
    const prev = needsReview;
    setNeedsReview((list) => list.filter((s) => s.id !== scoreId));
    try {
      await aiAdminApi.reviewScore(scoreId, reviewedScore, reviewNotes);
    } catch (err) {
      setNeedsReview(prev);
      setError(extractErrorMessage(err));
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 size={28} className="animate-spin text-green-700" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl text-green-900">Practice Scoring</h1>
        <p className="text-text-muted text-[13px]">
          AI grading for self-registered users practicing on the platform
        </p>
      </div>

      {error && (
        <div className="px-4 py-3 rounded-xl bg-red-50 border border-red-100 text-[13px] text-red-600">
          {error}
        </div>
      )}

      {analytics && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            {
              icon: Target,
              label: "Questions Graded",
              value: analytics.totalQuestionsGraded.toLocaleString(),
              color: "#2e8b57",
              bg: "#2e8b5715",
            },
            {
              icon: TrendingUp,
              label: "Avg AI Score",
              value: `${analytics.averageScore}%`,
              color: "#3b82f6",
              bg: "#3b82f615",
            },
            {
              icon: ClipboardCheck,
              label: "Teacher Review Rate",
              value: `${analytics.teacherReviewRate}%`,
              color: "#8b5cf6",
              bg: "#8b5cf615",
            },
            {
              icon: Clock,
              label: "AI/Teacher Diff",
              value: `±${analytics.reviewDiscrepancy.toFixed(1)}`,
              color: "#f59e0b",
              bg: "#f59e0b15",
            },
          ].map(({ icon: Icon, label, value, color, bg }) => (
            <div
              key={label}
              className="flex items-center gap-3 p-4 rounded-2xl bg-white border"
              style={{ borderColor: "rgba(30,80,50,0.08)" }}>
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: bg }}>
                <Icon size={17} style={{ color }} />
              </div>
              <div>
                <div className="text-[18px] font-bold text-green-900 leading-tight">{value}</div>
                <div className="text-[10px] font-semibold uppercase tracking-wide text-text-muted">
                  {label}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div
        className="flex items-center gap-1 border-b overflow-x-auto"
        style={{ borderColor: "rgba(30,80,50,0.08)" }}>
        {TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-2.5 text-[12px] font-medium transition-all flex items-center gap-1.5 whitespace-nowrap border-b-2 ${
                activeTab === tab.id
                  ? "border-green-800 text-green-900"
                  : "border-transparent text-text-muted hover:text-green-700"
              }`}>
              <Icon size={13} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {activeTab === "overview" && analytics && (
        <div className="space-y-5">
          <ScoreDistribution analytics={analytics} />
        </div>
      )}

      {activeTab === "grading" && (
        <AutoGradingPanel scores={needsReview} onOverride={handleOverride} />
      )}

      {activeTab === "feedback" && (
        <FeedbackAnalytics practiceScores={needsReview} examSubmissions={EMPTY_EXAM_SUBMISSIONS} />
      )}

      {activeTab === "insights" && (
        <InsightsTab allSubjectPoints={[]} contextLabel="practice sessions" />
      )}

      {activeTab === "rubrics" && <RubricManager />}
    </div>
  );
}

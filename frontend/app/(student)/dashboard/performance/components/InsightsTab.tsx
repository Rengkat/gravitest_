"use client";

import { useEffect, useState } from "react";
import {
  AlertCircle,
  CheckCircle,
  ChevronRight,
  Lightbulb,
  Trophy,
  XCircle,
  Flag,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import * as studentsApi from "@/lib/api/students";
import { extractErrorMessage } from "@/lib/api/client";
import { usePerformanceFilter } from "../context/PerformanceFilterContext";

interface InsightsData {
  strengths: { subject: string; score: number }[];
  weaknesses: studentsApi.BackendWeakTopic[];
  daysUntilExam: number | null;
  examTargets: string[];
}

// Strengths/weaknesses/recommendations here are derived deterministically
// from real subject scores and the weak-topics tracker — there's no
// recommendation engine or goals system in the backend to draw from, so
// rather than fabricate AI-sounding copy, these are template sentences
// filled in with real numbers.
const InsightsTab = () => {
  const { days } = usePerformanceFilter();
  const [data, setData] = useState<InsightsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    Promise.all([
      studentsApi.getMyPerformance(days),
      studentsApi.getMyWeakTopics({ status: "active" }),
      studentsApi.getMyOverview(),
    ])
      .then(([perf, weakTopics, overview]) => {
        setData({
          strengths: perf.subjectPerformance
            .filter((s) => s.score >= 70)
            .sort((a, b) => b.score - a.score)
            .slice(0, 5)
            .map((s) => ({ subject: s.subject, score: s.score })),
          weaknesses: weakTopics.data.slice(0, 5),
          daysUntilExam: overview.daysUntilExam,
          examTargets: overview.profile.examTargets ?? [],
        });
      })
      .catch((err) => setError(extractErrorMessage(err)))
      .finally(() => setLoading(false));
  }, [days]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 size={28} className="animate-spin text-blue-600" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
        <AlertTriangle size={28} className="mx-auto mb-3 text-red-400" />
        <p className="text-gray-600">Couldn&apos;t load insights{error ? ` (${error})` : ""}.</p>
      </div>
    );
  }

  const { strengths, weaknesses, daysUntilExam, examTargets } = data;

  return (
    <div className="space-y-6">
      {/* Strengths & Weaknesses */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex items-center gap-2 mb-4">
            <Trophy size={24} className="text-green-600" />
            <h3 className="text-lg font-semibold text-gray-800">Strengths</h3>
          </div>
          {strengths.length === 0 ? (
            <p className="text-sm text-gray-400">
              Keep practicing — subjects will show here once your average crosses 70%.
            </p>
          ) : (
            <ul className="space-y-3">
              {strengths.map((s) => (
                <li key={s.subject} className="flex items-start gap-2 text-gray-700">
                  <CheckCircle size={18} className="text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="capitalize">
                    Strong in {s.subject} — averaging {s.score}%
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex items-center gap-2 mb-4">
            <AlertCircle size={24} className="text-orange-600" />
            <h3 className="text-lg font-semibold text-gray-800">Areas for Improvement</h3>
          </div>
          {weaknesses.length === 0 ? (
            <p className="text-sm text-gray-400">No active weak topics flagged right now — nice work.</p>
          ) : (
            <ul className="space-y-3">
              {weaknesses.map((w) => (
                <li key={w.id} className="flex items-start gap-2 text-gray-700">
                  <XCircle size={18} className="text-red-600 mt-0.5 flex-shrink-0" />
                  <span className="capitalize">
                    {w.topic} ({w.subject}) — averaging {Math.round(w.averageScore)}%
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Exam target countdown — real data, replaces a fabricated "goals" list */}
      {(daysUntilExam !== null || examTargets.length > 0) && (
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex items-center gap-2 mb-4">
            <Flag size={24} className="text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-800">Exam Target</h3>
          </div>
          <div className="flex flex-wrap gap-6">
            {daysUntilExam !== null && (
              <div>
                <p className="text-3xl font-bold text-blue-600">{daysUntilExam}</p>
                <p className="text-sm text-gray-500">days until your exam</p>
              </div>
            )}
            {examTargets.length > 0 && (
              <div>
                <p className="text-sm text-gray-500 mb-1">Targeting</p>
                <p className="text-lg font-semibold text-gray-800 uppercase">
                  {examTargets.join(", ")}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Recommendations — generated from real weak topics */}
      {weaknesses.length > 0 && (
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl shadow-lg p-6 text-white">
          <div className="flex items-center gap-2 mb-4">
            <Lightbulb size={24} />
            <h3 className="text-lg font-semibold">Where to Focus Next</h3>
          </div>
          <ul className="space-y-3">
            {weaknesses.map((w) => (
              <li key={w.id} className="flex items-start gap-2">
                <ChevronRight size={18} className="mt-0.5 flex-shrink-0" />
                <span className="capitalize">
                  Review {w.topic} in {w.subject} — you're averaging {Math.round(w.averageScore)}% there
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* General study cadence guidance — evergreen advice, not
          personalized data (labeled as such rather than implying it's
          computed from your activity). */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-1">General Study Guidance</h3>
        <p className="text-xs text-gray-400 mb-4">A general framework, not personalized to your data</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="border border-blue-200 rounded-xl p-4 bg-blue-50">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">Daily</div>
              <div className="text-sm text-gray-600 mt-2">• Focused practice sessions</div>
              <div className="text-sm text-gray-600">• Review weak topics</div>
            </div>
          </div>
          <div className="border border-green-200 rounded-xl p-4 bg-green-50">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">Weekly</div>
              <div className="text-sm text-gray-600 mt-2">• Full practice exams</div>
              <div className="text-sm text-gray-600">• Progress check-in</div>
            </div>
          </div>
          <div className="border border-purple-200 rounded-xl p-4 bg-purple-50">
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">Monthly</div>
              <div className="text-sm text-gray-600 mt-2">• Mock examinations</div>
              <div className="text-sm text-gray-600">• Reassess weak areas</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InsightsTab;

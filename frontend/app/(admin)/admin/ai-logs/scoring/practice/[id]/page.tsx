"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, User, Loader2 } from "lucide-react";
import { StudentInsightPanel } from "../../components/Studentinsightpanel";
import * as aiAdminApi from "@/lib/api/ai-admin";
import type { StudentInsightResponse } from "@/lib/api/ai-admin";
import { extractErrorMessage } from "@/lib/api/client";

export default function PracticeStudentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const studentId = typeof params.id === "string" ? params.id : (params.id?.[0] ?? "");

  const [data, setData] = useState<StudentInsightResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await aiAdminApi.getStudentInsight(studentId));
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [studentId]);

  useEffect(() => {
    load();
  }, [load]);

  // No name-resolution endpoint wired up yet (same limitation noted
  // elsewhere in ai-logs) — showing a short userId instead of a real name.
  const studentName = `User ${studentId.slice(0, 8)}`;

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 size={28} className="animate-spin text-green-700" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="space-y-4">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-[13px] text-text-muted hover:text-green-900 transition-colors">
          <ArrowLeft size={15} /> Back
        </button>
        <div className="px-4 py-3 rounded-xl bg-red-50 border border-red-100 text-[13px] text-red-600">
          {error ?? "Couldn't load this student's insight."}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-[13px] text-text-muted hover:text-green-900 transition-colors">
          <ArrowLeft size={15} /> Back
        </button>
        <div className="w-px h-5 bg-gray-200" />
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-green-100 text-green-800 flex items-center justify-center text-[11px] font-bold">
            <User size={14} />
          </div>
          <h1 className="font-serif text-xl text-green-900">{studentName}</h1>
        </div>
      </div>

      <StudentInsightPanel
        studentId={data.studentId}
        studentName={studentName}
        subjectPoints={data.subjects}
      />

      <div
        className="bg-white rounded-2xl border overflow-hidden"
        style={{ borderColor: "rgba(30,80,50,0.08)" }}>
        <div className="px-6 py-4 border-b" style={{ borderColor: "rgba(30,80,50,0.08)" }}>
          <h3 className="font-serif text-base text-green-900">Recent Graded Questions</h3>
        </div>
        {data.recentScores.length === 0 ? (
          <div className="px-6 py-8 text-center text-[13px] text-text-muted">
            No graded questions yet for this student.
          </div>
        ) : (
          data.recentScores.map((s) => (
            <div
              key={s.id}
              className="px-6 py-4 border-b last:border-0"
              style={{ borderColor: "rgba(30,80,50,0.06)" }}>
              <div className="flex items-start justify-between gap-3 mb-2">
                <span className="text-[13px] text-green-900 flex-1">
                  {s.questionText ?? "(no question text)"}
                </span>
                <span className="text-[13px] font-bold text-green-900 shrink-0">
                  {Math.round((s.aiScore / s.maxScore) * 100)}%
                </span>
              </div>
              <div className="rounded-lg bg-cream p-2.5 text-[12px] text-green-900 mb-1.5">
                {s.studentAnswer}
              </div>
              <p className="text-[11px] text-text-muted">{s.aiFeedback}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

"use client";

import Link from "next/link";
import { CheckCircle, Sparkles, BookOpen, Target } from "lucide-react";
import type { FullRegistration } from "../schemas";

export function SuccessState({ data }: { data: Partial<FullRegistration> }) {
  return (
    <div className="text-center py-8">
      <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 mb-6 shadow-lg">
        <CheckCircle size={40} className="text-green-600" />
      </div>

      <h2 className="font-serif text-3xl text-green-900 mb-2">
        Welcome aboard, {data.firstName}! 🎉
      </h2>
      <p className="text-text-muted max-w-md mx-auto mb-8">
        Your Gravitas account is all set. We've personalised your dashboard based on your goals.
      </p>

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 text-left">
        <SummaryCard
          icon={Target}
          color="#ef4444"
          title="Your Targets"
          value={data.examTargets?.join(", ").toUpperCase() ?? "—"}
          sub={`Aiming for ${data.targetScore ?? "—"} points`}
        />
        <SummaryCard
          icon={BookOpen}
          color="#f59e0b"
          title="Focus Subjects"
          value={`${data.focusSubjects?.length ?? 0} subjects`}
          sub={data.focusSubjects?.slice(0, 2).join(", ")}
        />
        <SummaryCard
          icon={Sparkles}
          color="#8b5cf6"
          title="Target Course"
          value={data.targetCourse ?? "—"}
          sub={`Class: ${data.currentClass ?? "—"}`}
        />
      </div>

      <div className="flex gap-3 justify-center flex-wrap">
        <Link
          href="/dashboard"
          className="px-8 py-3 rounded-xl bg-green-800 text-white font-semibold hover:bg-green-700 transition-all shadow-lg hover:shadow-xl text-[14px]">
          Go to Dashboard
        </Link>
        <Link
          href="/practice"
          className="px-8 py-3 rounded-xl border-2 border-green-800 text-green-800 font-semibold hover:bg-green-50 transition-all text-[14px]">
          Start Practising
        </Link>
      </div>
    </div>
  );
}

function SummaryCard({
  icon: Icon,
  color,
  title,
  value,
  sub,
}: {
  icon: any;
  color: string;
  title: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="p-4 rounded-2xl bg-white border" style={{ borderColor: "rgba(30,80,50,0.08)" }}>
      <div className="flex items-center gap-2 mb-2">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ background: `${color}15` }}>
          <Icon size={16} style={{ color }} />
        </div>
        <span className="text-[12px] font-semibold text-text-muted">{title}</span>
      </div>
      <div className="text-[14px] font-bold text-green-900 line-clamp-1">{value}</div>
      {sub && <div className="text-[11px] text-text-muted mt-0.5 line-clamp-1">{sub}</div>}
    </div>
  );
}

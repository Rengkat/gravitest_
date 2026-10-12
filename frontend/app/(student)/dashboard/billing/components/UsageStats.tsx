import { TrendingUp, BookOpen, Zap, HelpCircle } from "lucide-react";
import { formatDate } from "@/lib/constants/billing";
import type { UsageSummary } from "@/types/billing";

interface UsageStatsProps {
  usage: UsageSummary | null;
}

// Only renders numbers this schema actually tracks (exam sessions, questions
// answered, AI requests used). There's no video-watch-time or per-student
// storage tracking anywhere in the app — see the comment on
// StudentsService.getExamUsageStats on the backend — so those cards were
// removed rather than showing fabricated numbers.
export default function UsageStats({ usage }: UsageStatsProps) {
  if (!usage) return null;

  const stats = [
    {
      icon: BookOpen,
      label: "Exam Sessions",
      value: usage.examSessions.toLocaleString(),
      color: "text-sky-200",
    },
    {
      icon: HelpCircle,
      label: "Questions Answered",
      value: usage.questionsAnswered.toLocaleString(),
      color: "text-amber-200",
    },
    {
      icon: Zap,
      label: "AI Requests Used",
      value: usage.aiExplanations.toLocaleString(),
      color: "text-purple-200",
    },
  ];

  return (
    <div
      className="rounded-2xl p-6 text-white relative overflow-hidden"
      style={{ background: "linear-gradient(135deg, #065f46 0%, #047857 60%, #059669 100%)" }}>
      {/* Texture */}
      <div
        className="absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.8) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />
      <div className="absolute -top-12 -right-12 w-48 h-48 bg-emerald-300 rounded-full blur-3xl opacity-10 pointer-events-none" />

      <div className="relative">
        {/* Header */}
        <div className="flex items-center gap-2 mb-5">
          <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center">
            <TrendingUp size={16} className="text-white" />
          </div>
          <div>
            <h3 className="text-[15px] font-bold text-white">This Billing Period</h3>
            <p className="text-[11px] text-green-300">
              {formatDate(usage.periodStart)} — {formatDate(usage.periodEnd)}
            </p>
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {stats.map(({ icon: Icon, label, value, color }) => (
            <div key={label} className="text-center">
              <Icon size={16} className={`${color} mx-auto mb-1.5 opacity-80`} />
              <p className="text-[22px] font-black text-white">{value}</p>
              <p className="text-[11px] text-green-200 leading-tight">{label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

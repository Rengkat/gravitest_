import { WeakTopic } from "@/lib/constants/dashboard";
export default function WeakTopicCard({ topic, subject, accuracy, priority }: WeakTopic) {
  const priorityColor =
    priority === "high" ? "#ef4444" : priority === "medium" ? "#f59e0b" : "#10b981";

  return (
    <div className="p-4 rounded-xl bg-white border" style={{ borderColor: "rgba(30,80,50,0.08)" }}>
      <div className="flex items-start justify-between mb-2">
        <div>
          <div className="text-[14px] font-semibold text-green-900">{topic}</div>
          <div className="text-[11px] text-text-muted">{subject}</div>
        </div>
        <div
          className="px-2 py-1 rounded-full text-[10px] font-bold"
          style={{ background: `${priorityColor}15`, color: priorityColor }}>
          {priority.toUpperCase()}
        </div>
      </div>
      <div className="mt-3">
        <div className="flex justify-between text-[11px] mb-1">
          <span className="text-text-muted">Accuracy</span>
          <span className="font-semibold" style={{ color: accuracy < 50 ? "#ef4444" : "#f59e0b" }}>
            {accuracy}%
          </span>
        </div>
        <div className="h-1.5 rounded-full bg-cream overflow-hidden">
          <div
            className="h-full rounded-full transition-all"
            style={{ width: `${accuracy}%`, background: accuracy < 50 ? "#ef4444" : "#f59e0b" }}
          />
        </div>
      </div>
      <button
        className="w-full mt-3 py-2 rounded-lg text-[12px] font-semibold transition-all"
        style={{ background: "rgba(26,74,46,0.08)", color: "#1a4a2e" }}>
        Practice Topic →
      </button>
    </div>
  );
}

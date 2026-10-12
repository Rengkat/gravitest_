import { Timer, Pencil } from "lucide-react";
import { SessionMode } from "@/lib/session/practiceSession";

interface SessionModeSectionProps {
  sessionMode: SessionMode;
  onChange: (mode: SessionMode) => void;
}

const MODES: {
  id: SessionMode;
  label: string;
  desc: string;
  icon: typeof Pencil;
  activeBg: string;
}[] = [
  {
    id: "practice",
    label: "Practice Mode",
    desc: "See the correct answer / AI feedback right after each question.",
    icon: Pencil,
    activeBg: "border-green-600 bg-green-50",
  },
  {
    id: "exam",
    label: "Exam Mode",
    desc: "Timed, no answers shown until you submit everything.",
    icon: Timer,
    activeBg: "border-blue-500 bg-blue-50",
  },
];

export default function SessionModeSection({ sessionMode, onChange }: SessionModeSectionProps) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <div className="flex items-center gap-2.5 mb-5">
        <div className="w-8 h-8 rounded-lg bg-rose-100 flex items-center justify-center">
          <Timer size={16} className="text-rose-600" />
        </div>
        <div>
          <h3 className="text-[15px] font-bold text-gray-800">Session Mode</h3>
          <p className="text-[11px] text-gray-400">
            Practice mode reveals answers as you go. Exam mode scores you at the end.
          </p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {MODES.map((m) => {
          const Icon = m.icon;
          const active = sessionMode === m.id;
          return (
            <button
              key={m.id}
              onClick={() => onChange(m.id)}
              className={`p-3.5 rounded-xl text-left transition-all duration-150 border-2 ${active ? m.activeBg : "border-gray-100 bg-gray-50 hover:border-gray-200"}`}>
              <Icon size={18} className={`mb-2 ${active ? "text-green-700" : "text-gray-400"}`} />
              <div className="text-[13px] font-semibold text-gray-800">{m.label}</div>
              <div className="text-[11px] text-gray-400 mt-0.5">{m.desc}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

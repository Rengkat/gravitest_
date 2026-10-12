import { SUBJECTS } from "@/lib/constants/ai-tutor";
import { Subject } from "@/types/ai-tutor";

export default function SubjectChip({ subject }: { subject: Subject }) {
  const s = SUBJECTS.find((x) => x.id === subject)!;
  const Icon = s.icon;
  return (
    <div
      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wide"
      style={{ background: s.iconBg, color: s.color, border: `1px solid ${s.color}22` }}>
      <Icon size={10} />
      {s.name}
    </div>
  );
}

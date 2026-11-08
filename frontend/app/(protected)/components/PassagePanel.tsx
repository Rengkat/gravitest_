import { BookOpen } from "lucide-react";
import MathText from "@/Components/content/MathText";
import QuestionImage from "@/Components/content/QuestionImage";

export interface PassageData {
  title?: string | null;
  instructions?: string | null;
  passageText?: string | null;
  passageImageUrl?: string | null;
}

// Renders a shared comprehension passage / diagram above a question or
// question group. Shown on every question in the set (not just the first)
// since real CBT candidates jump around non-linearly via the navigator —
// this matches how JAMB/WAEC CBT itself keeps the passage visible for
// every question that belongs to it, rather than assuming linear reading.
export default function PassagePanel({ passage }: { passage?: PassageData | null }) {
  if (!passage || (!passage.passageText && !passage.passageImageUrl)) return null;

  return (
    <div
      className="border-b bg-amber-50/40 p-5"
      style={{ borderColor: "rgba(30,80,50,0.1)" }}
      role="region"
      aria-label="Comprehension passage">
      <div className="flex items-center gap-2 mb-2">
        <BookOpen size={16} className="text-amber-700" aria-hidden="true" />
        <span className="text-[12px] font-bold text-amber-800 uppercase tracking-wide">
          {passage.title || "Passage"}
        </span>
      </div>
      {passage.instructions && (
        <MathText as="p" text={passage.instructions} className="mb-3 block text-[13px] text-amber-800/80 italic" />
      )}
      {passage.passageText && (
        <MathText as="p" text={passage.passageText} className="block text-[14px] text-gray-700 leading-relaxed" />
      )}
      {passage.passageImageUrl && (
        <div className="mt-3">
          <QuestionImage src={passage.passageImageUrl} alt={passage.title || "Passage diagram"} />
        </div>
      )}
    </div>
  );
}

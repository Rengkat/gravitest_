import type { InstructionLine } from "@/lib/session/examSummary";

/** Renders the dynamic instruction lines (see buildInstructionLines). */
export default function InstructionList({ lines }: { lines: InstructionLine[] }) {
  return (
    <ol className="space-y-3 mb-8 list-none p-0">
      {lines.map((line, i) => (
        <li key={i} className="flex gap-3">
          <span
            className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 ${
              line.warning ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"
            }`}
            aria-hidden="true">
            {i + 1}
          </span>
          <p className={`text-sm leading-relaxed ${line.warning ? "text-red-800" : "text-gray-700"}`}>
            {line.segments.map((seg, j) =>
              seg.bold ? <strong key={j}>{seg.text}</strong> : <span key={j}>{seg.text}</span>,
            )}
          </p>
        </li>
      ))}
    </ol>
  );
}

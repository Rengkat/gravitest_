import { ChevronDown } from "lucide-react";

export default function FaqItem({
  question,
  answer,
  isOpen,
  onClick,
}: {
  question: string;
  answer: string;
  isOpen: boolean;
  onClick: () => void;
}) {
  return (
    <div
      className="border-b transition-all duration-200"
      style={{ borderColor: "rgba(30,80,50,0.1)" }}>
      <button
        onClick={onClick}
        className="w-full flex items-center justify-between gap-4 py-5 text-left transition-all duration-200 hover:pl-1"
        style={{
          background: "none",
          border: "none",
          cursor: "pointer",
          fontFamily: "'Sora', sans-serif",
        }}>
        <span
          style={{
            fontSize: 16,
            fontWeight: 600,
            color: isOpen ? "#1a4a2e" : "#0d2b1a",
            lineHeight: 1.4,
            flex: 1,
          }}>
          {question}
        </span>
        <div
          className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-all duration-300"
          style={{
            background: isOpen ? "#1a4a2e" : "rgba(26,74,46,0.08)",
            transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
          }}>
          <ChevronDown
            size={14}
            strokeWidth={2.5}
            style={{ color: isOpen ? "white" : "#1a4a2e" }}
          />
        </div>
      </button>

      <div
        style={{
          fontSize: 14,
          color: "#4a6357",
          lineHeight: 1.7,
          maxHeight: isOpen ? 500 : 0,
          overflow: "hidden",
          paddingBottom: isOpen ? 20 : 0,
          transition: "max-height 0.4s cubic-bezier(0.4, 0, 0.2, 1), padding 0.3s ease",
        }}>
        {answer}
      </div>
    </div>
  );
}

import { FaqItem } from "@/lib/constants/help-data";
import { useState } from "react";

/* ─────────────────────────────────────────────────────────
   FAQ ACCORDION
───────────────────────────────────────────────────────── */
export default function FaqAccordion({ faqs }: { faqs: FaqItem[] }) {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <div className="flex flex-col" data-testid="faq-accordion">
      {faqs.map((faq, i) => (
        <div
          key={i}
          data-testid={`faq-item-${i}`}
          style={{ borderBottom: "1px solid rgba(30,80,50,0.12)" }}>
          <button
            title="open"
            onClick={() => setOpen(open === i ? null : i)}
            className="w-full flex items-center justify-between gap-4 text-left py-5 transition-colors duration-200"
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              fontFamily: "'Sora', sans-serif",
              fontSize: 15,
              fontWeight: 600,
              color: open === i ? "#1a4a2e" : "#111a14",
            }}
            // aria-expanded={open === i}
            data-testid={`faq-btn-${i}`}>
            <span>{faq.question}</span>
            <span
              className="w-6 h-6 rounded-full border flex items-center justify-center shrink-0 transition-all duration-250"
              style={{
                border: open === i ? "1.5px solid #1a4a2e" : "1.5px solid rgba(30,80,50,0.2)",
                background: open === i ? "#1a4a2e" : "transparent",
                color: open === i ? "white" : "#4a6357",
                transform: open === i ? "rotate(180deg)" : "none",
              }}>
              ▾
            </span>
          </button>

          <div
            data-testid={`faq-answer-${i}`}
            style={{
              fontSize: 14,
              color: "#4a6357",
              lineHeight: 1.75,
              maxHeight: open === i ? 400 : 0,
              overflow: "hidden",
              paddingBottom: open === i ? 20 : 0,
              transition: "max-height 0.35s ease, padding 0.35s ease",
            }}>
            {faq.answer}
          </div>
        </div>
      ))}
    </div>
  );
}

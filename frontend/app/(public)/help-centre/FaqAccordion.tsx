import { useState } from "react";

interface Faq { id: string; question: string; answer: string }

export default function FaqAccordion({ faqs }: { faqs: Faq[] }) {
  const [open, setOpen] = useState<string | null>(null);

  if (!faqs.length) return <p className="text-center" style={{ color: "#4a6357" }}>No questions here yet.</p>;

  return (
    <div className="flex flex-col" data-testid="faq-accordion">
      {faqs.map((faq, i) => {
        const isOpen = open === faq.id;
        const panelId = `faq-panel-${faq.id}`;
        return (
          <div key={faq.id} data-testid={`faq-item-${i}`} style={{ borderBottom: "1px solid rgba(30,80,50,0.12)" }}>
            <h3>
              <button
                type="button"
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() => setOpen(isOpen ? null : faq.id)}
                className="w-full flex items-center justify-between gap-4 text-left py-5 transition-colors duration-200"
                style={{ background: "none", border: "none", cursor: "pointer", fontFamily: "'Sora', sans-serif", fontSize: 15, fontWeight: 600, color: "#0d2b1a" }}>
                <span>{faq.question}</span>
                <span aria-hidden="true" style={{ color: "#1a4a2e", fontSize: 20, lineHeight: 1 }}>{isOpen ? "−" : "+"}</span>
              </button>
            </h3>
            {isOpen && (
              <div id={panelId} style={{ paddingBottom: 20, fontSize: 14, color: "#4a6357", lineHeight: 1.7 }}>
                {faq.answer}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

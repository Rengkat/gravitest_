"use client";

import { useState } from "react";
import Link from "next/link";
import { HelpCircle } from "lucide-react";
import DynamicIcon from "@/Components/DynamicIcon";
import SectionLabel from "@/Components/SectionLabel";
import FaqItem from "./FaqItem";
import { useBlocks, useCollection } from "@/lib/hooks/useSiteContent";

const BLOCKS = ["pricing.page", "site.contact"] as const;

/** Pricing-page FAQ: the admin's FAQs ticked "show on pricing page", plus the stat tiles and contact box. */
export default function PricingFAQ() {
  const { data: allFaqs } = useCollection("faqs");
  const { blocks } = useBlocks(BLOCKS);
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>("all");

  const faqs = (allFaqs ?? []).filter((f) => f.showOnPricing);
  const page = blocks?.["pricing.page"] ?? {};
  const contact = blocks?.["site.contact"] ?? {};
  const stats = page.faqStats ?? [];

  if (!faqs.length && !stats.length) return null;

  const categories = ["all", ...new Set(faqs.map((f) => f.category))];
  const visible = activeCategory === "all" ? faqs : faqs.filter((f) => f.category === activeCategory);
  const supportHref = contact.supportEmail ? `mailto:${contact.supportEmail}` : "/help-centre";

  return (
    <section className="px-[5%] py-[100px] bg-cream">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-12">
          <SectionLabel>FAQ</SectionLabel>
          {page.faqTitle && (
            <h2 className="font-serif text-green-900 tracking-[-0.8px] mb-3" style={{ fontSize: "clamp(28px, 3.5vw, 44px)" }}>
              {page.faqTitle}
            </h2>
          )}
          {page.faqSubtitle && <p className="text-base text-text-muted">{page.faqSubtitle}</p>}
        </div>

        {stats.length > 0 && (
          <ul className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12 list-none">
            {stats.map((stat, i) => (
              <li key={`${stat.label}-${i}`} className="text-center p-4 rounded-2xl bg-white border border-green-900/10">
                <div className="flex justify-center mb-2">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-green-500/10 text-green-600">
                    <DynamicIcon name={stat.icon} size={18} strokeWidth={1.8} />
                  </div>
                </div>
                <div className="text-lg font-bold text-green-900 mb-1">{stat.value}</div>
                <div className="text-[11px] text-text-muted">{stat.label}</div>
              </li>
            ))}
          </ul>
        )}

        {faqs.length > 0 && (
          <>
            {categories.length > 2 && (
              <div className="flex flex-wrap gap-2 justify-center mb-8">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    aria-pressed={activeCategory === cat}
                    onClick={() => { setActiveCategory(cat); setOpenIndex(null); }}
                    className={`px-4 py-2 rounded-full text-[13px] font-medium transition-all duration-200 ${
                      activeCategory === cat ? "bg-green-800 text-white" : "bg-white text-text-muted border border-green-900/15"
                    }`}>
                    {cat === "all" ? "All Questions" : cat}
                  </button>
                ))}
              </div>
            )}

            <div className="bg-white rounded-2xl border border-green-900/10 overflow-hidden">
              <div className="p-6">
                {visible.map((faq, index) => (
                  <FaqItem
                    key={faq.id}
                    question={faq.question}
                    answer={faq.answer}
                    isOpen={openIndex === index}
                    onClick={() => setOpenIndex(openIndex === index ? null : index)}
                  />
                ))}
              </div>
            </div>
          </>
        )}

        {(page.faqContactTitle || page.faqContactText) && (
          <div className="mt-12 text-center p-8 rounded-2xl bg-white border border-green-900/10">
            <HelpCircle size={32} strokeWidth={1.5} className="mx-auto mb-4 text-green-800" aria-hidden="true" />
            {page.faqContactTitle && <h3 className="font-serif text-xl text-green-900 mb-2">{page.faqContactTitle}</h3>}
            {page.faqContactText && <p className="text-sm text-text-muted mb-5">{page.faqContactText}</p>}
            <div className="flex gap-3 justify-center flex-wrap">
              <Link href={supportHref} className="px-6 py-2.5 rounded-xl text-[13px] font-semibold bg-green-800 text-white no-underline">
                Contact Support
              </Link>
              <Link href="/help-centre" className="px-6 py-2.5 rounded-xl text-[13px] font-semibold border-2 border-green-800/20 text-green-800 no-underline">
                View All FAQs
              </Link>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

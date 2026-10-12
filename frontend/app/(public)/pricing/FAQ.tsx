"use client";

import { useState } from "react";
import { HelpCircle } from "lucide-react";
import { ADDITIONAL_FAQS, FAQS, STATS } from "@/lib/constants/pricing";
import FaqItem from "./FaqItem";
import SectionLabel from "@/Components/SectionLabel";
// import CategoryBadge from "./CategoryBadge";

const PRICING_FAQ_CATEGORIES = ["Getting Started", "Billing & Subscription"];

const PRICING_FAQS = FAQS.filter((faq) => PRICING_FAQ_CATEGORIES.includes(faq.category));

const ALL_PRICING_FAQS = [...PRICING_FAQS, ...ADDITIONAL_FAQS];

export default function PricingFAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>("all");

  const categories = ["all", ...new Set(ALL_PRICING_FAQS.map((f) => f.category))];

  const filteredFaqs =
    activeCategory === "all"
      ? ALL_PRICING_FAQS
      : ALL_PRICING_FAQS.filter((f) => f.category === activeCategory);

  return (
    <section className="px-[5%] py-[100px] bg-cream">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <SectionLabel>FAQ</SectionLabel>
          <h2
            className="font-serif text-green-900 tracking-[-0.8px] mb-3"
            style={{ fontSize: "clamp(28px, 3.5vw, 44px)" }}>
            Frequently Asked Questions
          </h2>
          <p className="text-base text-text-muted">
            Everything you need to know about Gravitest pricing and plans.
          </p>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          {STATS.map((stat) => {
            const IconComponent = stat.icon;
            return (
              <div
                key={stat.label}
                className="text-center p-4 rounded-2xl bg-white border"
                style={{ borderColor: "rgba(30,80,50,0.08)" }}>
                <div className="flex justify-center mb-2">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ background: `${stat.color}10` }}>
                    <IconComponent size={18} strokeWidth={1.8} style={{ color: stat.color }} />
                  </div>
                </div>
                <div style={{ fontSize: 18, fontWeight: 700, color: "#0d2b1a", marginBottom: 4 }}>
                  {stat.value}
                </div>
                <div style={{ fontSize: 11, color: "#4a6357" }}>{stat.label}</div>
              </div>
            );
          })}
        </div>

        {/* Category Filters */}
        <div className="flex flex-wrap gap-2 justify-center mb-8">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className="px-4 py-2 rounded-full text-[13px] font-medium transition-all duration-200 capitalize"
              style={{
                background: activeCategory === cat ? "#1a4a2e" : "white",
                color: activeCategory === cat ? "white" : "#4a6357",
                border: activeCategory === cat ? "none" : "1px solid rgba(30,80,50,0.15)",
              }}>
              {cat === "all" ? "All Questions" : cat}
            </button>
          ))}
        </div>

        {/* FAQ Accordion */}
        <div
          className="bg-white rounded-2xl border overflow-hidden"
          style={{ borderColor: "rgba(30,80,50,0.1)" }}>
          <div className="p-6">
            {filteredFaqs.map((faq, index) => (
              <FaqItem
                key={index}
                question={faq.question}
                answer={faq.answer}
                isOpen={openIndex === index}
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
              />
            ))}
          </div>
        </div>

        {/* Still have questions */}
        <div
          className="mt-12 text-center p-8 rounded-2xl"
          style={{ background: "white", border: "1px solid rgba(30,80,50,0.08)" }}>
          <HelpCircle size={32} strokeWidth={1.5} style={{ color: "#1a4a2e", marginBottom: 16 }} />
          <h3
            style={{
              fontFamily: "'DM Serif Display', serif",
              fontSize: 20,
              color: "#0d2b1a",
              marginBottom: 8,
            }}>
            Still have questions?
          </h3>
          <p style={{ fontSize: 14, color: "#4a6357", marginBottom: 20 }}>
            {"Can't find the answer you're looking for? Please chat with our friendly team."}
          </p>
          <div className="flex gap-3 justify-center">
            <button
              className="px-6 py-2.5 rounded-xl text-[13px] font-semibold transition-all duration-200"
              style={{
                background: "#1a4a2e",
                color: "white",
              }}>
              Contact Support
            </button>
            <button
              className="px-6 py-2.5 rounded-xl text-[13px] font-semibold transition-all duration-200 border-2"
              style={{
                background: "transparent",
                borderColor: "rgba(26,74,46,0.2)",
                color: "#1a4a2e",
              }}>
              View All FAQs
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

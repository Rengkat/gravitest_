"use client";

import { Zap, Book, Headphones, Star, ArrowRight } from "lucide-react";
import { useState } from "react";
import Link from "next/link";
import { CATEGORIES, FAQS, CONTACT_OPTIONS, POPULAR } from "@/lib/constants/help-data";
import SearchBar from "./SearchBar";
import SectionLabel from "./SectionLabel";
import SearchResults from "./SearchResults";
import CategoryCard from "./CategoryCard";
import FaqAccordion from "./FaqAccordion";
import ContactCard from "./ContactCard";

export default function HelpCenterClient() {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const isSearching = search.trim().length > 1;
  const filteredFaqs = activeCategory ? FAQS.filter((f) => f.category === activeCategory) : FAQS;

  const faqCategories = Array.from(new Set(FAQS.map((f) => f.category)));

  return (
    <div style={{ background: "var(--color-cream)" }}>
      {/* ══ HERO ══ */}
      <section
        data-testid="help-hero"
        className="relative overflow-hidden text-center"
        style={{ padding: "120px 5% 80px" }}>
        {/* BG gradients */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 60% 50% at 50% 0%, rgba(46,139,87,0.08) 0%, transparent 70%), radial-gradient(ellipse 40% 30% at 80% 80%, rgba(245,200,66,0.05) 0%, transparent 60%)",
          }}
        />
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage:
              "linear-gradient(rgba(26,74,46,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(26,74,46,0.03) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
            maskImage: "radial-gradient(ellipse 80% 60% at 50% 0%, black 30%, transparent 80%)",
          }}
        />

        <div className="relative z-10">
          <SectionLabel>Help Centre</SectionLabel>

          <h1
            style={{
              fontFamily: "'DM Serif Display', serif",
              fontSize: "clamp(36px, 5vw, 62px)",
              lineHeight: 1.08,
              letterSpacing: "-1.5px",
              color: "#0d2b1a",
              marginBottom: 18,
              animation: "fadeUp 0.6s 0.1s ease both",
            }}>
            How can we help you?
          </h1>

          <p
            style={{
              fontSize: 18,
              color: "#4a6357",
              maxWidth: 480,
              margin: "0 auto 40px",
              lineHeight: 1.7,
              animation: "fadeUp 0.6s 0.2s ease both",
            }}>
            Search our docs, browse categories, or ask our team directly.
          </p>

          <div style={{ animation: "fadeUp 0.6s 0.3s ease both" }}>
            <SearchBar value={search} onChange={setSearch} />
          </div>

          {/* Popular quick-links — hidden when searching */}
          {!isSearching && (
            <div
              className="flex flex-wrap justify-center gap-2 mt-6"
              style={{ animation: "fadeUp 0.6s 0.4s ease both" }}>
              <span
                style={{
                  fontSize: 12,
                  color: "#8aab98",
                  display: "flex",
                  alignItems: "center",
                  marginRight: 4,
                }}>
                Popular:
              </span>
              {POPULAR.map((p) => {
                const IconComponent = p.icon;
                return (
                  <a
                    key={p.href}
                    href={p.href}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-medium no-underline transition-all duration-200"
                    style={{
                      background: "white",
                      border: "1px solid rgba(30,80,50,0.12)",
                      color: "#4a6357",
                    }}>
                    <IconComponent size={14} strokeWidth={1.8} />
                    {p.label}
                  </a>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* ══ SEARCH RESULTS or STATS BAR ══ */}
      {isSearching ? (
        <section className="px-[5%] pb-20 max-w-[800px] mx-auto">
          <SearchResults query={search.trim()} />
        </section>
      ) : (
        /* Stats trust bar */
        <div
          className="flex items-center justify-center flex-wrap gap-8"
          style={{
            padding: "24px 5%",
            borderTop: "1px solid rgba(30,80,50,0.1)",
            borderBottom: "1px solid rgba(30,80,50,0.1)",
            background: "white",
          }}>
          {[
            { icon: Book, value: "120+", label: "Help articles" },
            { icon: Zap, value: "< 2 min", label: "Avg search result" },
            { icon: Headphones, value: "4 hrs", label: "Email response time" },
            { icon: Star, value: "4.9 / 5", label: "Support satisfaction" },
          ].map((s) => (
            <div key={s.label} className="flex items-center gap-2.5">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: "rgba(46,139,87,0.1)" }}>
                <s.icon size={15} strokeWidth={1.8} style={{ color: "#1a4a2e" }} />
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#0d2b1a" }}>{s.value}</div>
                <div style={{ fontSize: 11, color: "#8aab98" }}>{s.label}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {!isSearching && (
        <>
          {/* ══ CATEGORIES ══ */}
          <section
            data-testid="categories-section"
            style={{ padding: "80px 5%", maxWidth: 1200, margin: "0 auto" }}>
            <div className="mb-10">
              <SectionLabel>Browse by Topic</SectionLabel>
              <h2
                style={{
                  fontFamily: "'DM Serif Display', serif",
                  fontSize: "clamp(28px,3.5vw,44px)",
                  color: "#0d2b1a",
                  letterSpacing: "-0.5px",
                }}>
                Find answers by category
              </h2>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
                gap: 20,
              }}>
              {CATEGORIES.map((cat, i) => (
                <CategoryCard key={cat.title} cat={cat} index={i} />
              ))}
            </div>
          </section>

          {/* ══ FAQ ══ */}
          <section
            data-testid="faq-section"
            style={{ padding: "80px 5% 100px", background: "var(--color-cream-dark)" }}>
            <div style={{ maxWidth: 800, margin: "0 auto" }}>
              <div className="text-center mb-12">
                <SectionLabel>FAQs</SectionLabel>
                <h2
                  style={{
                    fontFamily: "'DM Serif Display', serif",
                    fontSize: "clamp(28px,3.5vw,44px)",
                    color: "#0d2b1a",
                    letterSpacing: "-0.8px",
                    marginBottom: 12,
                  }}>
                  Frequently asked questions
                </h2>
                <p style={{ fontSize: 16, color: "#4a6357" }}>
                  {"Can't find the answer?"}{" "}
                  <a
                    href="mailto:support@gravitest.ng"
                    style={{ color: "#1a4a2e", fontWeight: 600, textDecoration: "none" }}>
                    Email our team →
                  </a>
                </p>
              </div>

              {/* Category filter pills */}
              <div className="flex flex-wrap gap-2 mb-8 justify-center">
                <button
                  onClick={() => setActiveCategory(null)}
                  className="px-4 py-2 rounded-full text-[13px] font-semibold border transition-all duration-200"
                  style={{
                    background: activeCategory === null ? "#1a4a2e" : "white",
                    color: activeCategory === null ? "white" : "#4a6357",
                    border:
                      activeCategory === null
                        ? "1px solid #1a4a2e"
                        : "1px solid rgba(30,80,50,0.15)",
                    fontFamily: "'Sora', sans-serif",
                  }}>
                  All
                </button>
                {faqCategories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(activeCategory === cat ? null : cat)}
                    className="px-4 py-2 rounded-full text-[13px] font-semibold border transition-all duration-200"
                    style={{
                      background: activeCategory === cat ? "#1a4a2e" : "white",
                      color: activeCategory === cat ? "white" : "#4a6357",
                      border:
                        activeCategory === cat
                          ? "1px solid #1a4a2e"
                          : "1px solid rgba(30,80,50,0.15)",
                      fontFamily: "'Sora', sans-serif",
                    }}>
                    {cat}
                  </button>
                ))}
              </div>

              <FaqAccordion faqs={filteredFaqs} />

              {/* Browse all link */}
              <div className="text-center mt-10">
                <Link
                  href="/help/faq"
                  className="inline-flex items-center gap-2 text-[14px] font-semibold no-underline transition-colors"
                  style={{ color: "#1a4a2e" }}>
                  View all frequently asked questions
                  <ArrowRight size={14} strokeWidth={2.5} />
                </Link>
              </div>
            </div>
          </section>

          {/* ══ CONTACT ══ */}
          <section
            data-testid="contact-section"
            style={{ padding: "80px 5% 100px", maxWidth: 1200, margin: "0 auto" }}>
            <div className="text-center mb-12">
              <SectionLabel>Still Need Help?</SectionLabel>
              <h2
                style={{
                  fontFamily: "'DM Serif Display', serif",
                  fontSize: "clamp(28px,3.5vw,44px)",
                  color: "#0d2b1a",
                  letterSpacing: "-0.5px",
                  marginBottom: 12,
                }}>
                Our team is here for you
              </h2>
              <p style={{ fontSize: 16, color: "#4a6357", maxWidth: 440, margin: "0 auto" }}>
                Available Monday–Friday, 8am–8pm WAT. We typically respond to emails within 4 hours.
              </p>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: 20,
                maxWidth: 900,
                margin: "0 auto",
              }}>
              {CONTACT_OPTIONS.map((opt) => (
                <ContactCard key={opt.title} {...opt} />
              ))}
            </div>
          </section>

          {/* ══ BOTTOM CTA ══ */}
          <section
            className="relative overflow-hidden text-center"
            style={{ padding: "80px 5%", background: "#1a4a2e" }}>
            <div
              className="absolute pointer-events-none"
              style={{
                top: "50%",
                left: "50%",
                transform: "translate(-50%,-50%)",
                width: 600,
                height: 600,
                background: "radial-gradient(circle, rgba(245,200,66,0.07), transparent 60%)",
                borderRadius: "50%",
              }}
            />
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                backgroundImage:
                  "linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)",
                backgroundSize: "48px 48px",
              }}
            />
            <div className="relative z-10 max-w-[560px] mx-auto">
              <h2
                style={{
                  fontFamily: "'DM Serif Display', serif",
                  fontSize: "clamp(28px,4vw,48px)",
                  color: "white",
                  lineHeight: 1.1,
                  letterSpacing: "-1px",
                  marginBottom: 14,
                }}>
                Ready to get back
                <br />
                to <em style={{ color: "#f5c842" }}>studying?</em>
              </h2>
              <p
                style={{
                  fontSize: 16,
                  color: "rgba(255,255,255,0.55)",
                  marginBottom: 32,
                  lineHeight: 1.7,
                }}>
                12,000+ students are already preparing with Gravitest. Start free — no credit card
                needed.
              </p>
              <Link
                href="/register"
                className="inline-flex items-center gap-2 px-8 py-4 rounded-xl text-[15px] font-bold no-underline transition-all duration-200 hover:-translate-y-0.5"
                style={{
                  background: "#f5c842",
                  color: "#0d2b1a",
                  boxShadow: "0 8px 32px rgba(245,200,66,0.3)",
                }}>
                Start Practising Free →
              </Link>
            </div>
          </section>
        </>
      )}

      <style>{`
        @keyframes fadeUp { from { opacity:0; transform:translateY(24px); } to { opacity:1; transform:translateY(0); } }
      `}</style>
    </div>
  );
}

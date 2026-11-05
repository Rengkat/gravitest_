"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import SearchBar from "./SearchBar";
import SectionLabel from "./SectionLabel";
import SearchResults from "./SearchResults";
import CategoryCard from "./CategoryCard";
import FaqAccordion from "./FaqAccordion";
import ContactCard from "./ContactCard";
import DynamicIcon from "@/Components/DynamicIcon";
import { useBlocks, useCollection } from "@/lib/hooks/useSiteContent";

const BLOCKS = ["help.page", "site.contact"] as const;

export default function HelpCenterClient() {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const { blocks } = useBlocks(BLOCKS);
  const categoriesQuery = useCollection("help-categories");
  const faqsQuery = useCollection("faqs");
  const page = blocks?.["help.page"] ?? {};
  const contact = blocks?.["site.contact"] ?? {};
  const categories = useMemo(() => categoriesQuery.data ?? [], [categoriesQuery.data]);
  const faqs = useMemo(() => faqsQuery.data ?? [], [faqsQuery.data]);

  const isSearching = search.trim().length > 1;
  const filteredFaqs = activeCategory ? faqs.filter((f) => f.category === activeCategory) : faqs;
  const faqCategories = Array.from(new Set(faqs.map((f) => f.category)));
  const stats = page.stats ?? [];
  const popular = page.popularLinks ?? [];
  const options = page.contactOptions ?? [];

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
            {page.heroTitle}
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
            {page.heroSubtitle}
          </p>

          <div style={{ animation: "fadeUp 0.6s 0.3s ease both" }}>
            <SearchBar value={search} onChange={setSearch} />
          </div>

          {/* Popular quick-links — hidden when searching */}
          {!isSearching && popular.length > 0 && (
            <div className="flex flex-wrap justify-center gap-2 mt-6" style={{ animation: "fadeUp 0.6s 0.4s ease both" }}>
              <span style={{ fontSize: 12, color: "#8aab98", display: "flex", alignItems: "center", marginRight: 4 }}>Popular:</span>
              {popular.map((p, i) => (
                <Link
                  key={`${p.href}-${i}`}
                  href={p.href}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-medium no-underline transition-all duration-200"
                  style={{ background: "white", border: "1px solid rgba(30,80,50,0.12)", color: "#4a6357" }}>
                  <DynamicIcon name={p.icon} size={14} strokeWidth={1.8} />
                  {p.label}
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ══ SEARCH RESULTS or STATS BAR ══ */}
      {isSearching ? (
        <section className="px-[5%] pb-20 max-w-[800px] mx-auto">
          <SearchResults query={search.trim()} categories={categories} faqs={faqs} />
        </section>
      ) : (
        stats.length > 0 && (
          <div
            className="flex items-center justify-center flex-wrap gap-8"
            style={{ padding: "24px 5%", borderTop: "1px solid rgba(30,80,50,0.1)", borderBottom: "1px solid rgba(30,80,50,0.1)", background: "white" }}>
            {stats.map((st, i) => (
              <div key={`${st.label}-${i}`} className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "rgba(46,139,87,0.1)", color: "#1a4a2e" }}>
                  <DynamicIcon name={st.icon} size={15} strokeWidth={1.8} />
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#0d2b1a" }}>{st.value}</div>
                  <div style={{ fontSize: 11, color: "#8aab98" }}>{st.label}</div>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {!isSearching && (
        <>
          {/* ══ CATEGORIES ══ */}
          {categories.length > 0 && (
            <section data-testid="categories-section" style={{ padding: "80px 5%", maxWidth: 1200, margin: "0 auto" }}>
              <div className="mb-10">
                <SectionLabel>Browse by Topic</SectionLabel>
                {page.categoriesTitle && (
                  <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: "clamp(28px,3.5vw,44px)", color: "#0d2b1a", letterSpacing: "-0.5px" }}>
                    {page.categoriesTitle}
                  </h2>
                )}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 20 }}>
                {categories.map((cat, i) => (
                  <CategoryCard key={cat.id} cat={cat} index={i} />
                ))}
              </div>
            </section>
          )}

          {/* ══ FAQ ══ */}
          {faqs.length > 0 && (
            <section data-testid="faq-section" style={{ padding: "80px 5% 100px", background: "var(--color-cream-dark)" }}>
              <div style={{ maxWidth: 800, margin: "0 auto" }}>
                <div className="text-center mb-12">
                  <SectionLabel>FAQs</SectionLabel>
                  {page.faqTitle && (
                    <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: "clamp(28px,3.5vw,44px)", color: "#0d2b1a", letterSpacing: "-0.8px", marginBottom: 12 }}>
                      {page.faqTitle}
                    </h2>
                  )}
                  {(page.faqSubtitle || contact.supportEmail) && (
                    <p style={{ fontSize: 16, color: "#4a6357" }}>
                      {page.faqSubtitle}{" "}
                      {contact.supportEmail && (
                        <a href={`mailto:${contact.supportEmail}`} style={{ color: "#1a4a2e", fontWeight: 600, textDecoration: "none" }}>
                          Email our team →
                        </a>
                      )}
                    </p>
                  )}
                </div>

                {faqCategories.length > 1 && (
                  <div role="group" aria-label="Filter questions by category" className="flex flex-wrap gap-2 mb-8 justify-center">
                    {[null, ...faqCategories].map((cat) => {
                      const on = activeCategory === cat;
                      return (
                        <button
                          key={cat ?? "all"}
                          type="button"
                          aria-pressed={on}
                          onClick={() => setActiveCategory(cat)}
                          className="px-4 py-2 rounded-full text-[13px] font-semibold border transition-all duration-200"
                          style={{
                            background: on ? "#1a4a2e" : "white",
                            color: on ? "white" : "#4a6357",
                            border: on ? "1px solid #1a4a2e" : "1px solid rgba(30,80,50,0.15)",
                            fontFamily: "'Sora', sans-serif",
                          }}>
                          {cat ?? "All"}
                        </button>
                      );
                    })}
                  </div>
                )}

                <FaqAccordion faqs={filteredFaqs} />
              </div>
            </section>
          )}

          {/* ══ CONTACT ══ */}
          {options.length > 0 && (
            <section data-testid="contact-section" style={{ padding: "80px 5% 100px", maxWidth: 1200, margin: "0 auto" }}>
              <div className="text-center mb-12">
                <SectionLabel>Still Need Help?</SectionLabel>
                {page.contactTitle && (
                  <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: "clamp(28px,3.5vw,44px)", color: "#0d2b1a", letterSpacing: "-0.5px", marginBottom: 12 }}>
                    {page.contactTitle}
                  </h2>
                )}
                {contact.supportHours && <p style={{ fontSize: 16, color: "#4a6357", maxWidth: 440, margin: "0 auto" }}>Available {contact.supportHours}.</p>}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 20, maxWidth: 900, margin: "0 auto" }}>
                {options.map((opt, i) => (
                  <ContactCard key={`${opt.title}-${i}`} icon={opt.icon} title={opt.title} desc={opt.description} cta={opt.ctaLabel} href={opt.href} primary={!!opt.primary} />
                ))}
              </div>
            </section>
          )}

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
                {page.ctaTitle}
                {page.ctaTitleHighlight && (
                  <>
                    <br />
                    <em style={{ color: "#f5c842" }}>{page.ctaTitleHighlight}</em>
                  </>
                )}
              </h2>
              <p
                style={{
                  fontSize: 16,
                  color: "rgba(255,255,255,0.55)",
                  marginBottom: 32,
                  lineHeight: 1.7,
                }}>
                {page.ctaSubtitle}
              </p>
              {page.ctaButtonLabel && page.ctaButtonHref && (
                <Link
                  href={page.ctaButtonHref}
                  className="inline-flex items-center gap-2 px-8 py-4 rounded-xl text-[15px] font-bold no-underline transition-all duration-200 hover:-translate-y-0.5"
                  style={{ background: "#f5c842", color: "#0d2b1a", boxShadow: "0 8px 32px rgba(245,200,66,0.3)" }}>
                  {page.ctaButtonLabel}
                </Link>
              )}
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

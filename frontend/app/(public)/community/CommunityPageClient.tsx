"use client";

import CommunityCard from "./CommunityCard";
import { CheckCircle, Globe, MessageCircle, Send, Users2 } from "lucide-react";
import SectionLabel from "@/Components/SectionLabel";
import DynamicIcon from "@/Components/DynamicIcon";
import { useBlock, useCollection } from "@/lib/hooks/useSiteContent";
import type { CommunityLinkItem } from "@/lib/site-content/types";

// Per-platform look. Static literals; the admin only picks the platform type.
const PLATFORM_STYLE: Record<CommunityLinkItem["kind"], { icon: React.ElementType; color: string; bg: string; text: string; btn: string }> = {
  whatsapp: { icon: MessageCircle, color: "#25D366", bg: "rgba(37,211,102,0.1)", text: "#075E54", btn: "#25D366" },
  telegram: { icon: Send, color: "#2AABEE", bg: "rgba(42,171,238,0.1)", text: "#2AABEE", btn: "#2AABEE" },
  discord: { icon: Users2, color: "#5865F2", bg: "rgba(88,101,242,0.1)", text: "#5865F2", btn: "#5865F2" },
  facebook: { icon: Users2, color: "#1877F2", bg: "rgba(24,119,242,0.1)", text: "#1877F2", btn: "#1877F2" },
  other: { icon: Globe, color: "#1a4a2e", bg: "rgba(46,139,87,0.1)", text: "#1a4a2e", btn: "#1a4a2e" },
};

export default function CommunityPageClient() {
  const { block, isLoading } = useBlock("community.page");
  const { data: links } = useCollection("community-links");
  const page = block ?? {};
  const community = links ?? [];
  const stats = page.stats ?? [];
  const benefits = page.benefits ?? [];
  const rules = page.rules ?? [];

  if (isLoading) return <div role="status" aria-busy="true" className="min-h-screen" style={{ background: "var(--color-cream)" }}><span className="sr-only">Loading…</span></div>;

  return (
    <div style={{ background: "var(--color-cream)" }}>
      {/* ══ HERO SECTION ══ */}
      <section
        className="relative overflow-hidden text-center"
        style={{ padding: "140px 5% 80px" }}>
        {/* Background gradients */}
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
          <SectionLabel>Community</SectionLabel>

          <h1
            style={{
              fontFamily: "'DM Serif Display', serif",
              fontSize: "clamp(44px, 6vw, 72px)",
              lineHeight: 1.08,
              letterSpacing: "-1.5px",
              color: "#0d2b1a",
              marginBottom: 18,
              animation: "fadeUp 0.6s 0.1s ease both",
            }}>
            {page.heroTitleLead}
            {page.heroTitleHighlight && (
              <>
                <br />
                <em style={{ color: "#1a4a2e" }}>{page.heroTitleHighlight}</em>
              </>
            )}
          </h1>

          <p
            style={{
              fontSize: 18,
              color: "#4a6357",
              maxWidth: 560,
              margin: "0 auto 40px",
              lineHeight: 1.7,
              animation: "fadeUp 0.6s 0.2s ease both",
            }}>
            {page.heroSubtitle}
          </p>

          {/* Stats */}
          <div
            className="flex flex-wrap justify-center gap-8 max-w-3xl mx-auto"
            style={{ animation: "fadeUp 0.6s 0.3s ease both" }}>
            {stats.map((stat, i) => {
              return (
                <div key={`${stat.label}-${i}`} className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ background: "rgba(46,139,87,0.1)" }}>
                    <DynamicIcon name={stat.icon} size={18} strokeWidth={1.8} />
                  </div>
                  <div className="text-left">
                    <div style={{ fontSize: 20, fontWeight: 700, color: "#0d2b1a" }}>
                      {stat.value}
                    </div>
                    <div style={{ fontSize: 11, color: "#8aab98" }}>{stat.label}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ══ COMMUNITY CARDS ══ */}
      <section style={{ padding: "60px 5% 80px", maxWidth: 1000, margin: "0 auto" }}>
        <div
          className="grid grid-cols-1 md:grid-cols-2 gap-8"
          style={{ animation: "fadeUp 0.6s 0.4s ease both" }}>
          {community.length === 0 && (
            <p className="md:col-span-2 text-center" style={{ color: "#4a6357" }}>
              Our community links are coming soon. Check back shortly.
            </p>
          )}
          {community.map((c) => {
            const st = PLATFORM_STYLE[c.kind] ?? PLATFORM_STYLE.other;
            return (
              <CommunityCard
                key={c.id}
                platform={c.platform}
                icon={st.icon}
                members={c.members ?? ""}
                description={c.description ?? ""}
                inviteLink={c.inviteUrl}
                buttonLabel={c.buttonLabel}
                color={st.color}
                bgColor={st.bg}
                textColor={st.text}
              />
            );
          })}
        </div>
      </section>

      {/* ══ BENEFITS SECTION ══ */}
      {benefits.length > 0 && (
        <section style={{ padding: "80px 5%", background: "white" }}>
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <SectionLabel>Why Join</SectionLabel>
              {page.benefitsTitle && (
                <h2
                  style={{
                    fontFamily: "'DM Serif Display', serif",
                    fontSize: "clamp(28px, 3.5vw, 44px)",
                    color: "#0d2b1a",
                    letterSpacing: "-0.5px",
                    marginBottom: 12,
                  }}>
                  {page.benefitsTitle}
                </h2>
              )}
              {page.benefitsSubtitle && (
                <p style={{ fontSize: 16, color: "#4a6357", maxWidth: 520, margin: "0 auto" }}>{page.benefitsSubtitle}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {benefits.map((benefit, i) => (
                <div
                  key={`${benefit.title}-${i}`}
                  className="p-6 rounded-2xl border transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
                  style={{
                    background: "white",
                    border: "1px solid rgba(30,80,50,0.08)",
                    animation: `fadeUp 0.6s ${0.1 + i * 0.05}s ease both`,
                  }}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4" style={{ background: "rgba(46,139,87,0.1)", color: "#1a4a2e" }}>
                    <DynamicIcon name={benefit.icon} size={18} strokeWidth={1.8} />
                  </div>
                  <h3 style={{ fontFamily: "'Sora', sans-serif", fontSize: 16, fontWeight: 600, color: "#0d2b1a", marginBottom: 8 }}>
                    {benefit.title}
                  </h3>
                  <p style={{ fontSize: 13, color: "#4a6357", lineHeight: 1.6 }}>{benefit.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ══ COMMUNITY RULES ══ */}
      {rules.length > 0 && (
        <section style={{ padding: "80px 5%", background: "var(--color-cream-dark)" }}>
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <SectionLabel>Community Guidelines</SectionLabel>
              {page.rulesTitle && (
                <h2
                  style={{
                    fontFamily: "'DM Serif Display', serif",
                    fontSize: "clamp(28px, 3.5vw, 44px)",
                    color: "#0d2b1a",
                    letterSpacing: "-0.5px",
                    marginBottom: 12,
                  }}>
                  {page.rulesTitle}
                </h2>
              )}
              {page.rulesSubtitle && <p style={{ fontSize: 16, color: "#4a6357" }}>{page.rulesSubtitle}</p>}
            </div>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-6 list-none">
              {rules.map((rule, i) => (
                <li key={`${rule}-${i}`} className="flex items-start gap-3">
                  <CheckCircle size={16} strokeWidth={2} aria-hidden="true" style={{ color: "#1a4a2e", marginTop: 2, flexShrink: 0 }} />
                  <span style={{ fontSize: 14, color: "#4a6357" }}>{rule}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* ══ CTA SECTION ══ */}
      {page.ctaTitle && (
        <section className="relative overflow-hidden text-center" style={{ padding: "80px 5%", background: "#1a4a2e" }}>
          <div
            className="absolute pointer-events-none"
            style={{
              top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: 600, height: 600,
              background: "radial-gradient(circle, rgba(245,200,66,0.07), transparent 60%)", borderRadius: "50%",
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
            {page.ctaSubtitle && (
              <p style={{ fontSize: 16, color: "rgba(255,255,255,0.55)", marginBottom: 32, lineHeight: 1.7 }}>{page.ctaSubtitle}</p>
            )}
            <div className="flex justify-center gap-4 flex-wrap">
              {community.map((c) => {
                const st = PLATFORM_STYLE[c.kind] ?? PLATFORM_STYLE.other;
                const Icon = st.icon;
                return (
                  <a
                    key={c.id}
                    href={c.inviteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-8 py-4 rounded-xl text-[15px] font-bold no-underline transition-all duration-200 hover:-translate-y-0.5"
                    style={{ background: st.btn, color: c.kind === "whatsapp" ? "#075E54" : "white", boxShadow: `0 8px 32px ${st.color}4D` }}>
                    <Icon size={18} aria-hidden="true" />
                    {c.buttonLabel || `Join ${c.platform}`}
                  </a>
                );
              })}
            </div>
          </div>
        </section>
      )}

      <style>{`
        @keyframes fadeUp { 
          from { opacity: 0; transform: translateY(24px); } 
          to { opacity: 1; transform: translateY(0); } 
        }
      `}</style>
    </div>
  );
}

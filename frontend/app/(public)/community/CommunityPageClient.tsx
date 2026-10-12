"use client";

import { BENEFITS, STATS } from "@/lib/constants/community";
import CommunityCard from "./CommunityCard";
import { CheckCircle, MessageCircle, Send } from "lucide-react";
import SectionLabel from "@/Components/SectionLabel";

export default function CommunityPageClient() {
  // const [activeTab, setActiveTab] = useState<"whatsapp" | "telegram">("whatsapp");

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
            Join 12,000+ students
            <br />
            on <em style={{ color: "#1a4a2e" }}>WhatsApp & Telegram</em>
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
            Connect with peers, get study tips, and stay updated on exam news. Join the
            fastest-growing student community in Nigeria.
          </p>

          {/* Stats */}
          <div
            className="flex flex-wrap justify-center gap-8 max-w-3xl mx-auto"
            style={{ animation: "fadeUp 0.6s 0.3s ease both" }}>
            {STATS.map((stat) => {
              const IconComponent = stat.icon;
              return (
                <div key={stat.label} className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ background: "rgba(46,139,87,0.1)" }}>
                    <IconComponent size={18} strokeWidth={1.8} style={{ color: "#1a4a2e" }} />
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
          <CommunityCard
            platform="WhatsApp"
            icon={MessageCircle}
            members="8,500+ active members"
            description="Join our WhatsApp community for daily discussions, instant updates, and real-time peer support. Perfect for quick questions and staying connected on mobile."
            inviteLink="https://chat.whatsapp.com/Gravitest-community"
            color="#25D366"
            bgColor="rgba(37,211,102,0.1)"
            buttonColor="rgba(37,211,102,0.1)"
          />
          <CommunityCard
            platform="Telegram"
            icon={Send}
            members="3,500+ members"
            description="Prefer Telegram? Join our Telegram channel for organized discussions, file sharing, and a more structured community experience. Get access to exclusive resources."
            inviteLink="https://t.me/Gravitest_community"
            color="#2AABEE"
            bgColor="rgba(42,171,238,0.1)"
            buttonColor="rgba(42,171,238,0.1)"
          />
        </div>
      </section>

      {/* ══ BENEFITS SECTION ══ */}
      <section style={{ padding: "80px 5%", background: "white" }}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <SectionLabel>Why Join</SectionLabel>
            <h2
              style={{
                fontFamily: "'DM Serif Display', serif",
                fontSize: "clamp(28px, 3.5vw, 44px)",
                color: "#0d2b1a",
                letterSpacing: "-0.5px",
                marginBottom: 12,
              }}>
              {"What you'll get as a member"}
            </h2>
            <p style={{ fontSize: 16, color: "#4a6357", maxWidth: 520, margin: "0 auto" }}>
              {"More than just a group — it's your support system for exam success."}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {BENEFITS.map((benefit, i) => {
              const IconComponent = benefit.icon;
              return (
                <div
                  key={benefit.title}
                  className="p-6 rounded-2xl border transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
                  style={{
                    background: "white",
                    border: "1px solid rgba(30,80,50,0.08)",
                    animation: `fadeUp 0.6s ${0.1 + i * 0.05}s ease both`,
                  }}>
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
                    style={{ background: "rgba(46,139,87,0.1)" }}>
                    <IconComponent size={18} strokeWidth={1.8} style={{ color: "#1a4a2e" }} />
                  </div>
                  <h3
                    style={{
                      fontFamily: "'Sora', sans-serif",
                      fontSize: 16,
                      fontWeight: 600,
                      color: "#0d2b1a",
                      marginBottom: 8,
                    }}>
                    {benefit.title}
                  </h3>
                  <p style={{ fontSize: 13, color: "#4a6357", lineHeight: 1.6 }}>
                    {benefit.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ══ COMMUNITY RULES ══ */}
      <section style={{ padding: "80px 5%", background: "var(--color-cream-dark)" }}>
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <SectionLabel>Community Guidelines</SectionLabel>
            <h2
              style={{
                fontFamily: "'DM Serif Display', serif",
                fontSize: "clamp(28px, 3.5vw, 44px)",
                color: "#0d2b1a",
                letterSpacing: "-0.5px",
                marginBottom: 12,
              }}>
              Safe space for learning
            </h2>
            <p style={{ fontSize: 16, color: "#4a6357" }}>
              We keep our communities respectful, helpful, and spam-free.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              "Be respectful to all members",
              "No spam or promotional content",
              "Stay on topic (exam prep & education)",
              "Help others when you can",
              "No hate speech or bullying",
              "Share resources that add value",
            ].map((rule) => (
              <div key={rule} className="flex items-start gap-3">
                <CheckCircle
                  size={16}
                  strokeWidth={2}
                  style={{ color: "#1a4a2e", marginTop: 2, flexShrink: 0 }}
                />
                <span style={{ fontSize: 14, color: "#4a6357" }}>{rule}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ CTA SECTION ══ */}
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
          {/* <Users2 size={48} strokeWidth={1.2} style={{ color: "#f5c842", marginBottom: 24 }} /> */}
          <h2
            style={{
              fontFamily: "'DM Serif Display', serif",
              fontSize: "clamp(28px,4vw,48px)",
              color: "white",
              lineHeight: 1.1,
              letterSpacing: "-1px",
              marginBottom: 14,
            }}>
            Ready to join
            <br />
            <em style={{ color: "#f5c842" }}>12,000+ students?</em>
          </h2>
          <p
            style={{
              fontSize: 16,
              color: "rgba(255,255,255,0.55)",
              marginBottom: 32,
              lineHeight: 1.7,
            }}>
            Choose your preferred platform and start connecting with fellow students today.
          </p>
          <div className="flex justify-center gap-4 flex-wrap">
            <a
              href="https://chat.whatsapp.com/Gravitest-community"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl text-[15px] font-bold no-underline transition-all duration-200 hover:-translate-y-0.5"
              style={{
                background: "#25D366",
                color: "#075E54",
                boxShadow: "0 8px 32px rgba(37,211,102,0.3)",
              }}>
              <MessageCircle size={18} />
              Join WhatsApp
            </a>
            <a
              href="https://t.me/Gravitest_community"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl text-[15px] font-bold no-underline transition-all duration-200 hover:-translate-y-0.5"
              style={{
                background: "#2AABEE",
                color: "white",
                boxShadow: "0 8px 32px rgba(42,171,238,0.3)",
              }}>
              <Send size={18} />
              Join Telegram
            </a>
          </div>
        </div>
      </section>

      <style>{`
        @keyframes fadeUp { 
          from { opacity: 0; transform: translateY(24px); } 
          to { opacity: 1; transform: translateY(0); } 
        }
      `}</style>
    </div>
  );
}

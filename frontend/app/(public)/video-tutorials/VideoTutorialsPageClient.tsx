"use client";

import { useState } from "react";
import {
  Play,
  Clock,
  Users,
  Star,
  BookOpen,
  Trophy,
  ChevronRight,
  Calendar,
  PlayCircle,
  GraduationCap,
} from "lucide-react";
import Link from "next/link";
import SectionLabel from "./SectionLabel";
import { CATEGORIES, VIDEOS } from "@/lib/constants/video-tutorial";
import VideoCard from "./VideoCard";

const FEATURED_MASTERCLASSES = VIDEOS.filter((v) => v.category === "masterclasses" && v.featured);

export default function VideoTutorialsPageClient() {
  const [activeCategory, setActiveCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredVideos = VIDEOS.filter((video) => {
    const matchesCategory = activeCategory === "all" || video.category === activeCategory;
    const matchesSearch =
      video.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      video.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

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
          <SectionLabel>Video Tutorials</SectionLabel>

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
            How to use Gravitest
            <br />+ <em style={{ color: "#1a4a2e" }}>Exam Prep Masterclasses</em>
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
            Watch step-by-step tutorials, masterclass sessions, and get expert tips to ace your
            exams.
          </p>

          {/* Search bar */}
          <div
            className="relative max-w-[500px] mx-auto"
            style={{ animation: "fadeUp 0.6s 0.3s ease both" }}>
            <input
              type="search"
              placeholder="Search tutorials..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-5 py-3 rounded-xl text-[14px] outline-none"
              style={{
                background: "white",
                border: "1px solid rgba(30,80,50,0.15)",
                color: "#111a14",
              }}
            />
            <Play
              size={16}
              className="absolute left-4 top-1/2 -translate-y-1/2"
              style={{ color: "#8aab98" }}
            />
          </div>
        </div>
      </section>

      {/* ══ FEATURED MASTERCLASSES ══ */}
      {FEATURED_MASTERCLASSES.length > 0 && (
        <section style={{ padding: "60px 5%", maxWidth: 1200, margin: "0 auto" }}>
          <div className="mb-8">
            <SectionLabel>Featured Masterclass</SectionLabel>
            <h2
              style={{
                fontFamily: "'DM Serif Display', serif",
                fontSize: "clamp(28px, 3.5vw, 44px)",
                color: "#0d2b1a",
                letterSpacing: "-0.5px",
              }}>
              Boost Your Score with Expert-Led Sessions
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {FEATURED_MASTERCLASSES.map((masterclass, i) => (
              <div
                key={masterclass.id}
                className="rounded-2xl overflow-hidden border bg-white transition-all duration-300 hover:-translate-y-1"
                style={{
                  border: "1px solid rgba(46,139,87,0.2)",
                  boxShadow: "0 8px 24px rgba(13,43,26,0.08)",
                  animation: `fadeUp 0.6s ${0.1 + i * 0.1}s ease both`,
                }}>
                <div className="grid grid-cols-1 md:grid-cols-2">
                  <div className="relative aspect-video md:aspect-auto bg-gradient-to-br from-green-800 to-green-600 flex items-center justify-center">
                    <div
                      className="w-16 h-16 rounded-full flex items-center justify-center"
                      style={{ background: "rgba(0,0,0,0.6)" }}>
                      <Play size={28} strokeWidth={2} style={{ color: "white", marginLeft: 2 }} />
                    </div>
                    <div className="absolute bottom-3 right-3 px-2 py-1 rounded-md bg-black/70 text-white text-[11px] font-mono">
                      {masterclass.duration}
                    </div>
                  </div>
                  <div className="p-6">
                    <div className="flex items-center gap-2 mb-3">
                      <Trophy size={16} style={{ color: "#f5c842" }} />
                      <span className="text-[11px] font-bold text-gold-dark uppercase tracking-wide">
                        Premium Masterclass
                      </span>
                    </div>
                    <h3
                      style={{
                        fontFamily: "'Sora', sans-serif",
                        fontSize: 20,
                        fontWeight: 700,
                        color: "#0d2b1a",
                        marginBottom: 12,
                      }}>
                      {masterclass.title}
                    </h3>
                    <p style={{ fontSize: 14, color: "#4a6357", marginBottom: 16 }}>
                      {masterclass.description}
                    </p>
                    <div className="flex items-center gap-4 text-[12px] text-text-light mb-4">
                      <div className="flex items-center gap-1">
                        <GraduationCap size={12} />
                        <span>{masterclass.instructor}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar size={12} />
                        <span>Available Now</span>
                      </div>
                    </div>
                    <button className="w-full py-2.5 rounded-xl text-[14px] font-semibold bg-green-800 text-white transition-all duration-200 hover:bg-green-700">
                      Watch Masterclass →
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ══ CATEGORY FILTERS ══ */}
      <section style={{ padding: "40px 5% 20px", maxWidth: 1200, margin: "0 auto" }}>
        <div className="flex flex-wrap gap-2 justify-center">
          {CATEGORIES.map((cat) => {
            const IconComponent = cat.icon;
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-[13px] font-medium transition-all duration-200"
                style={{
                  background: isActive ? "#1a4a2e" : "white",
                  color: isActive ? "white" : "#4a6357",
                  border: isActive ? "none" : "1px solid rgba(30,80,50,0.15)",
                }}>
                <IconComponent size={14} strokeWidth={1.8} />
                {cat.label}
              </button>
            );
          })}
        </div>
      </section>

      {/* ══ VIDEO GRID ══ */}
      <section style={{ padding: "40px 5% 80px", maxWidth: 1200, margin: "0 auto" }}>
        {filteredVideos.length === 0 ? (
          <div className="text-center py-12">
            <PlayCircle
              size={48}
              strokeWidth={1.5}
              style={{ color: "#8aab98", marginBottom: 16 }}
            />
            <h3 style={{ fontSize: 18, fontWeight: 600, color: "#0d2b1a", marginBottom: 8 }}>
              No videos found
            </h3>
            <p style={{ fontSize: 14, color: "#4a6357" }}>
              {"Try adjusting your search or filter to find what you're looking for."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredVideos.map((video, i) => (
              <VideoCard key={video.id} video={video} index={i} />
            ))}
          </div>
        )}
      </section>

      {/* ══ STATS SECTION ══ */}
      <section
        style={{
          padding: "80px 5%",
          background: "white",
          borderTop: "1px solid rgba(30,80,50,0.08)",
        }}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <SectionLabel>Impact</SectionLabel>
            <h2
              style={{
                fontFamily: "'DM Serif Display', serif",
                fontSize: "clamp(28px, 3.5vw, 44px)",
                color: "#0d2b1a",
                letterSpacing: "-0.5px",
              }}>
              Trusted by Thousands of Students
            </h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { icon: PlayCircle, value: "50+", label: "Video Tutorials" },
              { icon: Users, value: "15,000+", label: "Students Trained" },
              { icon: Star, value: "4.9/5", label: "Average Rating" },
              { icon: Clock, value: "500+", label: "Hours of Content" },
            ].map((stat) => {
              const IconComponent = stat.icon;
              return (
                <div key={stat.label} className="text-center">
                  <div className="flex justify-center mb-3">
                    <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center">
                      <IconComponent size={22} strokeWidth={1.8} style={{ color: "#1a4a2e" }} />
                    </div>
                  </div>
                  <div style={{ fontSize: 28, fontWeight: 700, color: "#0d2b1a", marginBottom: 4 }}>
                    {stat.value}
                  </div>
                  <div style={{ fontSize: 13, color: "#4a6357" }}>{stat.label}</div>
                </div>
              );
            })}
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
        <div className="relative z-10 max-w-[560px] mx-auto">
          <BookOpen size={48} strokeWidth={1.2} style={{ color: "#f5c842", marginBottom: 24 }} />
          <h2
            style={{
              fontFamily: "'DM Serif Display', serif",
              fontSize: "clamp(28px,4vw,48px)",
              color: "white",
              lineHeight: 1.1,
              letterSpacing: "-1px",
              marginBottom: 14,
            }}>
            Ready to master
            <br />
            <em style={{ color: "#f5c842" }}>your exams?</em>
          </h2>
          <p
            style={{
              fontSize: 16,
              color: "rgba(255,255,255,0.55)",
              marginBottom: 32,
              lineHeight: 1.7,
            }}>
            Start watching tutorials and join 12,000+ students already preparing with Gravitest.
          </p>
          <div className="flex justify-center gap-4 flex-wrap">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl text-[15px] font-bold no-underline transition-all duration-200 hover:-translate-y-0.5"
              style={{
                background: "#f5c842",
                color: "#0d2b1a",
                boxShadow: "0 8px 32px rgba(245,200,66,0.3)",
              }}>
              Start Free Today
              <ChevronRight size={16} strokeWidth={2.5} />
            </Link>
            <Link
              href="/help-centre"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl text-[15px] font-semibold no-underline transition-all duration-200 border-2 border-white/30 hover:border-white/60"
              style={{ color: "white" }}>
              Visit Help Centre
            </Link>
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

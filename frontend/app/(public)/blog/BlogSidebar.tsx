"use client";

import { useState } from "react";
import { ArrowRight, Send, TrendingUp } from "lucide-react";
import { POSTS, POPULAR_TAGS } from "./blogData";

export default function BlogSidebar() {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);

  function handleSubscribe(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return;
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSubscribed(true);
    }, 1200);
  }

  const popular = POSTS.slice(0, 3);

  return (
    <aside className="flex flex-col gap-6">
      {/* ── Newsletter ── */}
      <div className="rounded-[20px] bg-green-800 p-6 relative overflow-hidden">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />
        <div
          className="absolute top-0 right-0 w-40 h-40 rounded-full pointer-events-none opacity-20"
          style={{
            background: "radial-gradient(circle, rgba(245,200,66,0.4) 0%, transparent 70%)",
          }}
        />

        <div className="relative z-[1]">
          <div className="w-10 h-10 rounded-xl bg-gold/20 flex items-center justify-center mb-4">
            <Send size={18} strokeWidth={1.75} className="text-gold" />
          </div>
          <h3 className="font-serif text-[20px] text-white leading-tight mb-2">
            Get study tips weekly
          </h3>
          <p className="text-white/55 text-[13px] leading-relaxed mb-4">
            JAMB updates, WAEC strategies, and exam alerts sent to your inbox every Friday.
          </p>

          {subscribed ? (
            <div className="flex items-center gap-2 py-3 px-4 rounded-xl bg-green-500/20 border border-green-400/20">
              <div className="w-5 h-5 rounded-full bg-green-400 flex items-center justify-center shrink-0">
                <svg width="10" height="8" fill="none" viewBox="0 0 10 8">
                  <path
                    d="M1 4l2.5 2.5L9 1"
                    stroke="white"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <span className="text-green-300 text-sm font-semibold">You&apos;re subscribed!</span>
            </div>
          ) : (
            <form onSubmit={handleSubscribe} className="flex flex-col gap-2">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="adaeze@example.com"
                className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/15 text-white text-sm placeholder:text-white/30 font-medium outline-none focus:border-gold/50 focus:bg-white/15 transition-all"
              />
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-gold text-green-900 font-bold text-sm rounded-xl hover:bg-gold-dark transition-all duration-200 hover:-translate-y-0.5 border-none cursor-pointer disabled:opacity-60">
                {loading ? "Subscribing…" : "Subscribe Free"}
              </button>
            </form>
          )}

          <p className="text-white/30 text-[11px] mt-3 text-center">
            No spam. Unsubscribe anytime.
          </p>
        </div>
      </div>

      {/* ── Popular Tags ── */}
      <div className="rounded-[20px] bg-white border border-cream-border p-6">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp size={16} strokeWidth={1.75} className="text-green-600" />
          <h3 className="text-sm font-bold text-green-900 uppercase tracking-[0.08em]">
            Popular Topics
          </h3>
        </div>
        <div className="flex flex-wrap gap-2">
          {POPULAR_TAGS.map((tag) => (
            <a
              key={tag}
              href={`/blog?q=${encodeURIComponent(tag)}`}
              className="px-3 py-1.5 rounded-lg bg-cream-dark border border-cream-border text-xs font-semibold text-text-muted no-underline transition-all duration-200 hover:border-green-800/30 hover:bg-green-50 hover:text-green-800">
              {tag}
            </a>
          ))}
        </div>
      </div>

      {/* ── Popular Posts ── */}
      <div className="rounded-[20px] bg-white border border-cream-border p-6">
        <h3 className="text-sm font-bold text-green-900 uppercase tracking-[0.08em] mb-4">
          Most Read
        </h3>
        <div className="flex flex-col gap-4">
          {popular.map((post, i) => (
            <a
              key={post.slug}
              href={`/blog/${post.slug}`}
              className="flex items-start gap-3 group no-underline">
              <span className="font-serif text-[28px] text-green-800/15 leading-none shrink-0 w-6 text-center">
                {i + 1}
              </span>
              <div>
                <p className="text-[13px] font-semibold text-green-900 leading-[1.4] group-hover:text-green-600 transition-colors">
                  {post.title}
                </p>
                <p className="text-[11px] text-text-light mt-1">
                  {post.readTime} · {post.date}
                </p>
              </div>
            </a>
          ))}
        </div>
      </div>

      {/* ── CTA card ── */}
      <div className="rounded-[20px] bg-cream-dark border border-cream-border p-6 text-center">
        <div className="text-3xl mb-3">🎯</div>
        <h3 className="font-serif text-[18px] text-green-900 mb-2">Ready to start practising?</h3>
        <p className="text-[13px] text-text-muted leading-relaxed mb-4">
          Join 12,000+ students using Gravitest to pass JAMB and WAEC.
        </p>
        <a
          href="/register"
          className="inline-flex items-center gap-2 px-5 py-3 bg-green-800 text-white font-bold text-sm rounded-xl no-underline hover:bg-green-700 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(26,74,46,0.3)]">
          Start Free
          <ArrowRight size={14} strokeWidth={2.5} />
        </a>
      </div>
    </aside>
  );
}

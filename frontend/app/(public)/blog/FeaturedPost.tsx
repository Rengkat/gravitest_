import { ArrowRight, Clock } from "lucide-react";
import type { Post } from "./blogData";
import Link from "next/link";

function AuthorAvatar({ initials }: { initials: string }) {
  const base =
    "w-8 h-8 rounded-full flex items-center justify-center text-xs font-extrabold shrink-0";
  if (initials === "TF") return <div className={`${base} bg-green-500 text-white`}>{initials}</div>;
  if (initials === "NE") return <div className={`${base} bg-green-700 text-white`}>{initials}</div>;
  if (initials === "EA") return <div className={`${base} bg-teal-600 text-white`}>{initials}</div>;
  if (initials === "FM") return <div className={`${base} bg-gold text-green-900`}>{initials}</div>;
  if (initials === "KA")
    return <div className={`${base} bg-orange-500 text-white`}>{initials}</div>;
  return <div className={`${base} bg-green-800 text-white`}>{initials}</div>;
}

export default function FeaturedPost({ post }: { post: Post }) {
  return (
    <div className="px-[5%] mb-12">
      <Link
        href={`/blog/${post.slug}`}
        className="group block rounded-[28px] overflow-hidden border border-cream-border bg-white shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-heavy)] transition-all duration-300 hover:-translate-y-1 no-underline">
        <div className="grid grid-cols-1 lg:grid-cols-2">
          {/* Left — visual */}
          <div
            className={`relative min-h-[280px] lg:min-h-[400px] bg-gradient-to-br ${post.gradientCls} flex flex-col justify-between p-8 lg:p-10 overflow-hidden`}>
            {/* Grid */}
            <div
              className="absolute inset-0 pointer-events-none opacity-20"
              style={{
                backgroundImage:
                  "linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px)",
                backgroundSize: "40px 40px",
              }}
            />
            {/* Glow */}
            <div
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full pointer-events-none opacity-30"
              style={{
                background: "radial-gradient(circle, rgba(245,200,66,0.3) 0%, transparent 70%)",
              }}
            />

            <div className="relative z-[1]">
              <span className="inline-flex items-center px-3 py-1.5 rounded-full bg-white/15 border border-white/20 text-white text-[11px] font-bold tracking-[0.08em] uppercase mb-6">
                ✦ Featured
              </span>
              <div className="inline-flex items-center px-3 py-1.5 rounded-full bg-gold/20 border border-gold/30 text-gold text-[11px] font-bold tracking-[0.06em] uppercase">
                {post.tag}
              </div>
            </div>

            {/* Large decorative number */}
            <div className="relative z-[1] mt-auto">
              <div className="font-serif text-[80px] text-white/8 leading-none select-none">
                300+
              </div>
            </div>
          </div>

          {/* Right — content */}
          <div className="p-8 lg:p-10 flex flex-col justify-between">
            <div>
              <h2
                className="font-serif text-green-900 leading-[1.15] tracking-tight mb-4 group-hover:text-green-700 transition-colors"
                style={{ fontSize: "clamp(22px, 2.5vw, 32px)" }}>
                {post.title}
              </h2>
              <p className="text-text-muted text-[15px] leading-[1.75] mb-6">{post.excerpt}</p>
            </div>

            <div>
              {/* Meta */}
              <div className="flex items-center gap-4 mb-6 text-xs text-text-light">
                <span className="flex items-center gap-1.5">
                  <Clock size={12} strokeWidth={1.8} />
                  {post.readTime}
                </span>
                <span className="w-1 h-1 rounded-full bg-cream-border" />
                <span>{post.date}</span>
              </div>

              {/* Author + CTA */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <AuthorAvatar initials={post.author.initials} />
                  <div>
                    <div className="text-sm font-bold text-green-900">{post.author.name}</div>
                    <div className="text-xs text-text-light">{post.author.role}</div>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 text-sm font-bold text-green-700 group-hover:gap-3 transition-all duration-200">
                  Read article
                  <ArrowRight size={14} strokeWidth={2.5} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
}

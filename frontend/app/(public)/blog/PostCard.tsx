import { ArrowRight, Clock } from "lucide-react";
import type { Post } from "./blogData";
import Link from "next/link";

/* ─── Avatar ─────────────────────────────────────────────────────────────────
   Explicit branches — all class strings are static literals.
──────────────────────────────────────────────────────────────────────────── */
function AuthorAvatar({ initials }: { initials: string }) {
  const base =
    "w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-extrabold shrink-0";
  if (initials === "TF") return <div className={`${base} bg-green-500 text-white`}>{initials}</div>;
  if (initials === "NE") return <div className={`${base} bg-green-700 text-white`}>{initials}</div>;
  if (initials === "EA") return <div className={`${base} bg-teal-600 text-white`}>{initials}</div>;
  if (initials === "FM") return <div className={`${base} bg-gold text-green-900`}>{initials}</div>;
  if (initials === "KA")
    return <div className={`${base} bg-orange-500 text-white`}>{initials}</div>;
  return <div className={`${base} bg-green-800 text-white`}>{initials}</div>;
}

/* ─── Tag chip ───────────────────────────────────────────────────────────────
   Each category colour is its own branch.
──────────────────────────────────────────────────────────────────────────── */
function TagChip({ tag }: { tag: string }) {
  const base =
    "inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-[0.06em] uppercase";

  if (tag === "JAMB Guide")
    return <span className={`${base} bg-gold/15 text-gold-dark`}>{tag}</span>;
  if (tag === "WAEC Guide")
    return <span className={`${base} bg-green-500/10 text-green-600`}>{tag}</span>;
  if (tag === "AI Learning")
    return <span className={`${base} bg-teal-500/10 text-teal-600`}>{tag}</span>;
  if (tag === "Study Tips")
    return <span className={`${base} bg-blue-500/10 text-blue-600`}>{tag}</span>;
  if (tag === "Success Story")
    return <span className={`${base} bg-purple-500/10 text-purple-600`}>{tag}</span>;
  if (tag === "For Parents")
    return <span className={`${base} bg-pink-400/10 text-pink-600`}>{tag}</span>;
  if (tag === "Post-UTME")
    return <span className={`${base} bg-green-400/10 text-green-700`}>{tag}</span>;
  return <span className={`${base} bg-green-500/10 text-green-600`}>{tag}</span>;
}

/* ─── Card ───────────────────────────────────────────────── */
export default function PostCard({ post, index }: { post: Post; index: number }) {
  return (
    <Link
      href={`/blog/${post.slug}`}
      className="group flex flex-col bg-white rounded-[20px] border border-cream-border overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-[var(--shadow-card)] hover:border-green-500/25 no-underline [animation:fadeUp_0.6s_ease_both]"
      style={{ animationDelay: `${index * 0.07}s` }}>
      {/* Colour band */}
      <div className={`h-[5px] w-full bg-gradient-to-r ${post.gradientCls}`} />

      <div className="flex flex-col flex-1 p-6">
        {/* Tag */}
        <div className="mb-3">
          <TagChip tag={post.tag} />
        </div>

        {/* Title */}
        <h3 className="font-serif text-[18px] text-green-900 leading-[1.3] tracking-tight mb-3 group-hover:text-green-700 transition-colors flex-1">
          {post.title}
        </h3>

        {/* Excerpt */}
        <p className="text-[13px] text-text-muted leading-[1.7] mb-5 line-clamp-3">
          {post.excerpt}
        </p>

        {/* Footer */}
        <div className="flex items-center justify-between mt-auto pt-4 border-t border-cream-border">
          <div className="flex items-center gap-2">
            <AuthorAvatar initials={post.author.initials} />
            <div>
              <div className="text-xs font-semibold text-green-900">{post.author.name}</div>
              <div className="flex items-center gap-1 text-[11px] text-text-light">
                <Clock size={10} strokeWidth={2} />
                {post.readTime}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1 text-xs font-bold text-green-700 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            Read
            <ArrowRight size={12} strokeWidth={2.5} />
          </div>
        </div>
      </div>
    </Link>
  );
}

import { ArrowRight } from "lucide-react";
import Link from "next/link";

/* ─────────────────────────────────────────────────────────
   CONTACT CARD
───────────────────────────────────────────────────────── */
export default function ContactCard({
  icon: IconComponent,
  title,
  desc,
  cta,
  href,
  primary,
}: {
  icon: React.ElementType;
  title: string;
  desc: string;
  cta: string;
  href: string;
  primary: boolean;
}) {
  return (
    <div
      className="flex flex-col gap-4 p-7 rounded-[20px] border transition-all duration-300"
      style={{
        background: primary ? "#1a4a2e" : "white",
        border: primary ? "1px solid #1f5c38" : "1px solid rgba(30,80,50,0.12)",
        boxShadow: primary ? "0 20px 60px rgba(13,43,26,0.2)" : "none",
      }}>
      <div
        className="w-11 h-11 rounded-xl flex items-center justify-center"
        style={{ background: primary ? "rgba(255,255,255,0.12)" : "rgba(46,139,87,0.1)" }}>
        <IconComponent
          size={22}
          strokeWidth={1.8}
          style={{ color: primary ? "#f5c842" : "#1a4a2e" }}
        />
      </div>
      <div>
        <h3
          style={{
            fontFamily: "'DM Serif Display', serif",
            fontSize: 20,
            color: primary ? "white" : "#0d2b1a",
            marginBottom: 6,
          }}>
          {title}
        </h3>
        <p
          style={{
            fontSize: 14,
            color: primary ? "rgba(255,255,255,0.6)" : "#4a6357",
            lineHeight: 1.65,
          }}>
          {desc}
        </p>
      </div>
      <Link
        href={href}
        className="inline-flex items-center gap-1.5 text-[14px] font-bold no-underline transition-all duration-200 mt-auto"
        style={{ color: primary ? "#f5c842" : "#1a4a2e" }}>
        {cta}
        <ArrowRight size={14} strokeWidth={2.5} />
      </Link>
    </div>
  );
}

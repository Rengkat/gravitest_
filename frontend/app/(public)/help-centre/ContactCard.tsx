import { ArrowRight } from "lucide-react";
import Link from "next/link";
import DynamicIcon from "@/Components/DynamicIcon";

export default function ContactCard({
  icon, title, desc, cta, href, primary,
}: { icon?: string; title: string; desc?: string; cta: string; href: string; primary: boolean }) {
  const external = /^(https?:|mailto:|tel:)/i.test(href);
  const linkStyle = { color: primary ? "#f5c842" : "#1a4a2e", fontWeight: 600, fontSize: 14 } as const;
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
        style={{ background: primary ? "rgba(255,255,255,0.12)" : "rgba(46,139,87,0.1)", color: primary ? "#f5c842" : "#1a4a2e" }}>
        <DynamicIcon name={icon} size={22} strokeWidth={1.8} />
      </div>
      <h3 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 20, color: primary ? "white" : "#0d2b1a" }}>{title}</h3>
      {desc && <p style={{ fontSize: 13, lineHeight: 1.6, color: primary ? "rgba(255,255,255,0.6)" : "#4a6357" }}>{desc}</p>}
      {external ? (
        <a href={href} className="inline-flex items-center gap-1.5 no-underline mt-auto" style={linkStyle}>
          {cta} <ArrowRight size={14} aria-hidden="true" />
        </a>
      ) : (
        <Link href={href} className="inline-flex items-center gap-1.5 no-underline mt-auto" style={linkStyle}>
          {cta} <ArrowRight size={14} aria-hidden="true" />
        </Link>
      )}
    </div>
  );
}

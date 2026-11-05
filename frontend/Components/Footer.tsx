"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Facebook, Globe, Instagram, Linkedin, MessageCircle, Send, Twitter, Youtube, type LucideIcon } from "lucide-react";
import { useBlocks } from "@/lib/hooks/useSiteContent";

const SOCIAL: Record<string, { icon: LucideIcon; label: string }> = {
  twitter: { icon: Twitter, label: "X / Twitter" },
  linkedin: { icon: Linkedin, label: "LinkedIn" },
  instagram: { icon: Instagram, label: "Instagram" },
  youtube: { icon: Youtube, label: "YouTube" },
  facebook: { icon: Facebook, label: "Facebook" },
  tiktok: { icon: Globe, label: "TikTok" },
  whatsapp: { icon: MessageCircle, label: "WhatsApp" },
  telegram: { icon: Send, label: "Telegram" },
};

const BLOCKS = ["site.footer", "site.social", "site.contact"] as const;

/** Site footer — every piece of text and every link is admin-managed (Website Content → Site-wide). */
const Footer = () => {
  const pathname = usePathname();
  const isDashboard = pathname?.startsWith("/dashboard");
  const { blocks } = useBlocks(BLOCKS);

  const footer = blocks?.["site.footer"] ?? {};
  const social = blocks?.["site.social"]?.links ?? [];
  const contact = blocks?.["site.contact"] ?? {};
  const columns = footer.columns ?? [];
  const legal = footer.legalLinks ?? [];

  return (
    <footer className="bg-dark pt-20 pb-10 px-[3%] mt-auto">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr] gap-16 mb-16">
        <div>
          <Link href={isDashboard ? "/dashboard" : "/"} className="flex items-center gap-2.5 no-underline mb-4">
            <div className="w-9 h-9 bg-green-700 rounded-[9px] flex items-center justify-center font-serif text-[20px] text-gold">G</div>
            <span className="font-serif text-[20px] text-white">Gravitest</span>
          </Link>
          {footer.tagline && <p className="text-[13.5px] text-white/35 leading-relaxed max-w-[280px] mb-6">{footer.tagline}</p>}

          {(contact.supportEmail || contact.phone) && (
            <p className="text-[13px] text-white/45 mb-6 space-y-1">
              {contact.supportEmail && (
                <a href={`mailto:${contact.supportEmail}`} className="block text-white/45 no-underline hover:text-white/85">{contact.supportEmail}</a>
              )}
              {contact.phone && <a href={`tel:${contact.phone.replace(/\s+/g, "")}`} className="block text-white/45 no-underline hover:text-white/85">{contact.phone}</a>}
            </p>
          )}

          {social.length > 0 && (
            <div className="flex gap-2.5">
              {social.map((s, i) => {
                const entry = SOCIAL[s.platform] ?? { icon: Globe, label: s.platform };
                const Icon = entry.icon;
                return (
                  <a
                    key={`${s.platform}-${i}`}
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-9 h-9 rounded-lg border border-white/10 bg-transparent text-white/40 flex items-center justify-center text-[15px] no-underline transition-all hover:bg-white/8 hover:text-white/80 hover:border-white/20"
                    aria-label={entry.label}>
                    <Icon size={16} aria-hidden="true" />
                  </a>
                );
              })}
            </div>
          )}
        </div>

        {columns.map((col, ci) => (
          <nav key={`${col.title}-${ci}`} aria-label={col.title}>
            <div className="text-[11px] font-bold tracking-[0.1em] uppercase text-white/40 mb-5">{col.title}</div>
            <div className="flex flex-col gap-3">
              {col.links.map((link, li) => (
                <Link key={`${link.label}-${li}`} href={link.href} className="text-[13.5px] text-white/45 no-underline transition-colors hover:text-white/85 flex items-center gap-1.5">
                  {link.label}
                </Link>
              ))}
            </div>
          </nav>
        ))}
      </div>

      <div className="pt-7 border-t border-white/7 flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
        <div className="text-[12px] text-white/25">{footer.copyright ? `© ${new Date().getFullYear()} ${footer.copyright}` : ""}</div>
        {legal.length > 0 && (
          <div className="flex gap-6 flex-wrap justify-center">
            {legal.map((l, i) => (
              <Link key={`${l.label}-${i}`} href={l.href} className="text-[12px] text-white/25 no-underline transition-colors hover:text-white/60">
                {l.label}
              </Link>
            ))}
          </div>
        )}
      </div>
    </footer>
  );
};

export default Footer;

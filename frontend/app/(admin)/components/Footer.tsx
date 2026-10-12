"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Twitter, Linkedin, Instagram, Youtube } from "lucide-react";

const FOOTER_LINKS = {
  Platform: [
    { label: "JAMB CBT Simulator", href: "/features/jamb" },
    { label: "WAEC / NECO Practice", href: "/features/waec" },
    { label: "Post-UTME Suite", href: "/features/post-utme" },
    { label: "ICAN & Nursing", href: "/features/professional" },
    { label: "Content Library", href: "/library" },
  ],
  Company: [
    { label: "About Gravitest", href: "/about" },
    { label: "Blog", href: "/blog" },
    { label: "Careers", href: "/careers" },
    { label: "Press Kit", href: "/press" },
    { label: "Contact Us", href: "/contact" },
    { label: "Help Centre", href: "/help-centre" },
  ],
};

const SOCIAL_ICONS = [
  { icon: Twitter, href: "https://twitter.com/Gravitest", label: "Twitter" },
  { icon: Linkedin, href: "https://linkedin.com/company/Gravitest", label: "LinkedIn" },
  { icon: Instagram, href: "https://instagram.com/Gravitest", label: "Instagram" },
  { icon: Youtube, href: "https://youtube.com/@Gravitest", label: "YouTube" },
];

const Footer = () => {
  const pathname = usePathname();
  const isDashboard = pathname?.startsWith("/dashboard");

  return (
    <footer className="bg-dark pt-20 pb-10 px-[3%] mt-auto">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr] gap-16 mb-16">
        {/* Brand */}
        <div>
          <Link
            href={isDashboard ? "/dashboard" : "/"}
            className="flex items-center gap-2.5 no-underline mb-4">
            <div className="w-9 h-9 bg-green-700 rounded-[9px] flex items-center justify-center font-serif text-[20px] text-gold">
              G
            </div>
            <span className="font-serif text-[20px] text-white">Gravitest</span>
          </Link>
          <p className="text-[13.5px] text-white/35 leading-relaxed max-w-[280px] mb-6">
            Nigeria&apos;s AI-powered exam preparation platform. Built for every student, from SS1
            to professional certifications.
          </p>
          <div className="flex gap-2.5">
            {SOCIAL_ICONS.map((social) => {
              const Icon = social.icon;
              return (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 rounded-lg border border-white/10 bg-transparent text-white/40 flex items-center justify-center text-[15px] no-underline transition-all hover:bg-white/8 hover:text-white/80 hover:border-white/20"
                  aria-label={social.label}>
                  <Icon size={16} />
                </a>
              );
            })}
          </div>
        </div>

        {/* Link columns */}
        {Object.entries(FOOTER_LINKS).map(([col, links]) => (
          <div key={col}>
            <div className="text-[11px] font-bold tracking-[0.1em] uppercase text-white/40 mb-5">
              {col}
            </div>
            <div className="flex flex-col gap-3">
              {links.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  className="text-[13.5px] text-white/45 no-underline transition-colors hover:text-white/85 flex items-center gap-1.5">
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="pt-7 border-t border-white/7 flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
        <div className="text-[12px] text-white/25">
          © 2026 Gravitest Technologies Ltd. Made with <span className="text-red-400">❤️</span> in
          Nigeria.
        </div>
        <div className="flex gap-6">
          <Link
            href="/legal/privacy"
            className="text-[12px] text-white/25 no-underline transition-colors hover:text-white/60">
            Privacy Policy
          </Link>
          <Link
            href="/legal/terms"
            className="text-[12px] text-white/25 no-underline transition-colors hover:text-white/60">
            Terms of Service
          </Link>
          <Link
            href="/legal/cookies"
            className="text-[12px] text-white/25 no-underline transition-colors hover:text-white/60">
            Cookie Policy
          </Link>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

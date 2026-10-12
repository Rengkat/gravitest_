"use client";
import { GravitasWordmark } from "@/lib/components/gravitas-logo";
import Link from "next/link";
import { useEffect, useState } from "react";
import NavItemWithDropdown from "./NavItemWithDropdown";
import MegaDropdown from "./MegaDropdown";
import NavBtn from "./NavBtn";
import MobileSectionTitle from "./MobileSectionTitle";
import MobileLink from "./MobileLink";
import { BookOpen, CreditCard, HelpCircle } from "lucide-react";
import {
  NAV_EXAMS,
  NAV_PRODUCTS,
  NAV_RESOURCES,
  PAST_QUESTIONS,
} from "@/lib/constants/NavConstants";
export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  const closeMobile = () => setMobileOpen(false);

  return (
    <>
      {/* ── Desktop Nav ── */}
      <nav
        data-testid="navbar"
        className={[
          "fixed top-0 left-0 right-0 z-[1000]",
          "h-[72px] flex items-center justify-between",
          "px-[5%]",
          "bg-cream/95 backdrop-blur-2xl",
          "border-b border-cream-border",
          "transition-shadow duration-300",
          scrolled ? "shadow-[0_2px_24px_rgba(13,43,26,0.10)]" : "shadow-none",
        ].join(" ")}>
        {/* Logo */}
        <Link
          href="/"
          aria-label="Gravitest home"
          className="flex items-center no-underline shrink-0 focus-visible:outline-2 focus-visible:outline-green-500 focus-visible:outline-offset-2 rounded-sm">
          <GravitasWordmark />
        </Link>

        {/* Desktop links */}
        <ul className="hidden lg:flex items-center gap-1 list-none m-0 p-0">
          <li>
            <NavItemWithDropdown label="Products">
              <MegaDropdown
                label="What you can do with Gravitest"
                items={NAV_PRODUCTS}
                width={620}
                footerCta="Explore all features"
                footerBadge="✦ New: WAEC 2026 Digital Mode"
                footerBadgeStyle="new"
              />
            </NavItemWithDropdown>
          </li>
          <li>
            <NavItemWithDropdown label="Exam Modules">
              <MegaDropdown
                label="Every Nigerian exam, one platform"
                items={NAV_EXAMS}
                width={640}
                footerCta="Browse all exam types"
                footerBadge="✓ Free to start"
                footerBadgeStyle="green"
              />
            </NavItemWithDropdown>
          </li>
          <li>
            <NavItemWithDropdown label="Past Questions">
              <MegaDropdown
                label="Past questions for every Nigerian exam level"
                items={PAST_QUESTIONS}
                width={540}
                footerCta="Browse all past questions"
                footerBadge="10+ years of papers"
                footerBadgeStyle="gold"
              />
            </NavItemWithDropdown>
          </li>
          <li>
            <Link
              href="/pricing"
              className="flex items-center px-3.5 py-2 rounded-sm no-underline text-sm font-medium font-sans whitespace-nowrap text-text-muted bg-transparent transition-all duration-200 hover:text-green-800 hover:bg-green-800/[0.06]">
              Pricing
            </Link>
          </li>
          <li>
            <NavItemWithDropdown label="Resources" alignRight>
              <MegaDropdown
                label="Learn & get help"
                items={NAV_RESOURCES}
                width={320}
                columns={1}
                alignRight
              />
            </NavItemWithDropdown>
          </li>
        </ul>

        {/* Right: CTAs + hamburger */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="hidden lg:flex items-center gap-3">
            <NavBtn href="/login" variant="ghost" testId="nav-login">
              Log In
            </NavBtn>
            <NavBtn href="/register" variant="primary" testId="nav-register">
              Start Free →
            </NavBtn>
          </div>

          {/* Hamburger */}
          <button
            data-testid="mobile-hamburger"
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            onClick={() => setMobileOpen(!mobileOpen)}
            className="lg:hidden flex flex-col gap-[5px] cursor-pointer p-1.5 border-none bg-transparent">
            <span
              className={`block w-[22px] h-px bg-green-800 rounded-full transition-all duration-300 ${mobileOpen ? "translate-y-[6.5px] rotate-45" : ""}`}
            />
            <span
              className={`block w-[22px] h-px bg-green-800 rounded-full transition-all duration-300 ${mobileOpen ? "opacity-0 scale-x-0" : ""}`}
            />
            <span
              className={`block w-[22px] h-px bg-green-800 rounded-full transition-all duration-300 ${mobileOpen ? "-translate-y-[6.5px] -rotate-45" : ""}`}
            />
          </button>
        </div>
      </nav>

      {/* ── Mobile Menu ── */}
      {mobileOpen && (
        <div
          data-testid="mobile-menu"
          className="lg:hidden fixed inset-x-0 top-[72px] bottom-0 z-[999] overflow-y-auto bg-cream/99 backdrop-blur-2xl border-t border-cream-border flex flex-col gap-1 px-[5%] pt-6 pb-10">
          <MobileSectionTitle first>Products</MobileSectionTitle>
          {NAV_PRODUCTS.slice(0, 5).map((p) => (
            <MobileLink key={p.title} icon={p.icon} onClick={closeMobile}>
              {p.title}
            </MobileLink>
          ))}

          <MobileSectionTitle>Exam Modules</MobileSectionTitle>
          {NAV_EXAMS.slice(0, 4).map((e) => (
            <MobileLink key={e.title} icon={e.icon} onClick={closeMobile}>
              {e.title}
            </MobileLink>
          ))}

          <MobileSectionTitle>Past Questions</MobileSectionTitle>
          {PAST_QUESTIONS.slice(0, 3).map((s) => (
            <MobileLink key={s.title} icon={s.icon} onClick={closeMobile}>
              {s.title}
            </MobileLink>
          ))}

          <MobileSectionTitle>More</MobileSectionTitle>
          <MobileLink icon={CreditCard} href="/pricing" onClick={closeMobile}>
            Pricing
          </MobileLink>
          <MobileLink icon={BookOpen} onClick={closeMobile}>
            Blog
          </MobileLink>
          <MobileLink icon={HelpCircle} onClick={closeMobile}>
            Help Centre
          </MobileLink>

          <div className="flex gap-2.5 mt-4 pt-4 border-t border-cream-border">
            <Link
              href="/login"
              onClick={closeMobile}
              className="flex-1 text-center py-3 text-sm font-semibold no-underline font-sans border border-green-800 rounded-md bg-transparent text-green-800 transition-all duration-200 hover:bg-green-800 hover:text-white">
              Log In
            </Link>
            <Link
              href="/register"
              onClick={closeMobile}
              className="flex-1 text-center py-3 text-sm font-semibold no-underline font-sans bg-green-800 text-white border-none rounded-md transition-all duration-200 hover:bg-green-700">
              Start Free →
            </Link>
          </div>
        </div>
      )}
    </>
  );
}

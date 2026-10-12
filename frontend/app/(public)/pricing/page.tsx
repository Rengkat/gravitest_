import type { Metadata } from "next";

import PricingPageClient from "./PricingClient";
import { JsonLd, breadcrumbJsonLd, faqJsonLd } from "@/lib/seo/jsonld";
import { absoluteUrl } from "@/lib/seo/site";
import { ADDITIONAL_FAQS, FAQS } from "@/lib/constants/pricing";

const PRICING_FAQ_CATEGORIES = ["Getting Started", "Billing & Subscription"];
const PRICING_FAQS = FAQS.filter((faq) => PRICING_FAQ_CATEGORIES.includes(faq.category));
const ALL_PRICING_FAQS = [...PRICING_FAQS, ...ADDITIONAL_FAQS];

export const metadata: Metadata = {
  title: "Pricing — Affordable JAMB & WAEC, ICAN, Nigeria Nursing Council Exam Prep Plans",

  // No prices in this copy on purpose: plans are managed by admins and change,
  // and search/social previews are cached for weeks.
  description:
    "Start free on Gravitest, then upgrade when you're ready. Simple plans for JAMB, WAEC, " +
    "ICAN and nursing exam prep. No hidden fees. Pay securely with Paystack or OPay.",

  keywords: [
    "Gravitest pricing",
    "JAMB prep cost Nigeria",
    "cheap exam prep Nigeria",
    "WAEC prep subscription",
    "exam prep free Nigeria",
  ],

  alternates: { canonical: absoluteUrl("/pricing") },

  openGraph: {
    type: "website",
    url: absoluteUrl("/pricing"),
    title: "Gravitest Pricing — Start free, upgrade when you're ready",
    description: "Start free. Upgrade when ready. No hidden fees.",
    images: [{ url: "/og/pricing.png", width: 1200, height: 630, alt: "Gravitest Pricing Plans" }],
  },

  twitter: {
    card: "summary_large_image",
    title: "Gravitest Pricing — Start free",
    description: "Start free. Upgrade when you're ready.",
    images: ["/og/pricing.png"],
  },
};

const Pricing = () => {
  return (
    <>
      <JsonLd data={breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "Pricing", path: "/pricing" }])} />
      <JsonLd
        data={faqJsonLd(ALL_PRICING_FAQS.map((f) => ({ question: f.question, answer: f.answer })))}
      />
      <PricingPageClient />
    </>
  );
};
export default Pricing;

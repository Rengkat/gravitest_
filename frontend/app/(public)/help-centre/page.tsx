import type { Metadata } from "next";
import HelpCenterClient from "./help-center-client";
import { absoluteUrl } from "@/lib/seo/site";

export const metadata: Metadata = {
  title: "Help Centre — Gravitest Support & Documentation",

  description:
    "Find answers to your questions about Gravitest. Browse guides on JAMB & WAEC " +
    "CBT practice, Sabi-Explain AI, offline mode, billing, " +
    "account security, and more. Live chat available Monday–Friday 8am–8pm WAT.",

  keywords: [
    "Gravitest help",
    "Gravitest support",
    "JAMB CBT help",
    "Gravitest documentation",
    "Sabi-Explain FAQ",
    "offline mode Gravitest",
    "Gravitest reset password",
    "Gravitest billing",
    "Gravitest contact",
  ],

  alternates: { canonical: absoluteUrl("/help-centre") },

  openGraph: {
    type: "website",
    url: absoluteUrl("/help-centre"),
    title: "Help Centre — Gravitest Support & Documentation",
    description:
      "Guides, FAQs, and live support for JAMB, WAEC & Post-UTME exam prep on Gravitest.",
    images: [
      {
        url: "/og/help.png",
        width: 1200,
        height: 630,
        alt: "Gravitest Help Centre",
      },
    ],
  },

  twitter: {
    card: "summary",
    title: "Gravitest Help Centre",
    description: "Guides, FAQs, and live support for Nigerian exam prep.",
  },
};

export default function HelpPage() {
  return <HelpCenterClient />;
}

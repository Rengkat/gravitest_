import type { Metadata } from "next";
import GravitasHomepageClient from "./Components/home/HomeClient";
import { absoluteUrl } from "@/lib/seo/site";

export const metadata: Metadata = {
  title:
    "Gravitest — Pass JAMB, WAEC, ICAN, Nigeri Nursing Council & Every Nigerian Exam. No Excuse.",

  description:
    "Nigeria's most powerful exam prep platform. Get pixel-perfect JAMB CBT " +
    "simulation, AI-powered Sabi-Explain after every wrong answer, past " +
    "questions from 10+ years, and deep performance analytics. Free to start. " +
    "Works offline on 2G. Used by 12,000+ students.",

  keywords: [
    "JAMB CBT simulator 2026",
    "WAEC past questions",
    "NECO practice",
    "Post-UTME preparation",
    "Nigeria exam app",
    "UTME prep",
    "CBT practice",
    "AI exam tutor Nigeria",
    "Sabi-Explain AI",
    "JAMB score improvement",
    "exam preparation Nigeria free",
    "WAEC 2026 digital mode",
  ],

  alternates: {
    canonical: absoluteUrl("/"),
  },

  openGraph: {
    type: "website",
    url: absoluteUrl("/"),
    title: "Gravitest — Pass JAMB, WAEC & Every Nigerian Exam. No Excuse.",
    description:
      "AI-powered CBT practice for JAMB, WAEC, NECO & Post-UTME. " +
      "Pixel-perfect exam interfaces, instant AI explanations, works offline.",
    images: [
      {
        url: "/og/homepage.png",
        width: 1200,
        height: 630,
        alt: "Gravitest — Nigeria's #1 Exam Prep Platform",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: "Gravitest — Pass JAMB, WAEC & Every Nigerian Exam",
    description: "AI CBT practice. Sabi-Explain AI. Works on 2G. Free to start.",
    images: ["/og/homepage.png"],
  },
};

export default function HomePage() {
  return <GravitasHomepageClient />;
}

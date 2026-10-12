import RegisterPage from "./RegisterClient";
import { Metadata } from "next";
import { absoluteUrl } from "@/lib/seo/site";
export const metadata: Metadata = {
  title: "Create Your Free Gravitest Account",

  description:
    "Join 12,000+ Nigerian students on Gravitest. Create your free account " +
    "in 30 seconds — no credit card needed. Get instant access to JAMB CBT " +
    "simulation, AI-powered Gravitest-Explain, past questions, and performance " +
    "analytics for WAEC, NECO, Post-UTME, ICAN and more.",

  robots: {
    index: false,
    follow: false,
  },

  alternates: {
    canonical: absoluteUrl("/register"),
  },

  openGraph: {
    type: "website",
    url: absoluteUrl("/register"),
    title: "Create Your Free Gravitest Account — Join 12,000+ Students",
    description:
      "Free JAMB, WAEC & Post-UTME exam prep. No credit card. " +
      "AI explanations, CBT simulation, works on 2G.",
    images: [
      {
        url: "/og/auth.png",
        width: 1200,
        height: 630,
        alt: "Join Gravitest — Free Nigerian Exam Prep",
      },
    ],
  },

  twitter: {
    card: "summary",
    title: "Create Your Free Gravitest Account",
    description: "Free JAMB, ICAN, NECO & WAEC prep. AI explanations. Works on 2G.",
  },
};
const page = () => {
  return (
    <div>
      <RegisterPage />
    </div>
  );
};

export default page;

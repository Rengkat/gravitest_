import type { Metadata } from "next";
import { Suspense } from "react";
import LoginPage from "./PageClient";
import { absoluteUrl } from "@/lib/seo/site";

export const metadata: Metadata = {
  title: "Log In to Gravitest",

  description:
    "Log in to your Gravitest account and continue your JAMB, WAEC, or " +
    "Post-UTME preparation. Your study streak, saved sessions, and AI " +
    "tutor history are waiting for you.",

  robots: {
    index: false,
    follow: false,
  },

  alternates: {
    canonical: absoluteUrl("/login"),
  },

  openGraph: {
    type: "website",
    url: absoluteUrl("/login"),
    title: "Log In to Gravitest",
    description: "Continue your JAMB & WAEC exam preparation on Gravitest.",
    images: [
      {
        url: "/og/auth.png",
        width: 1200,
        height: 630,
        alt: "Log in to Gravitest",
      },
    ],
  },

  twitter: {
    card: "summary",
    title: "Log In to Gravitest",
    description: "Continue your JAMB & WAEC exam preparation.",
  },
};

const page = () => {
  return (
    <div>
      <Suspense fallback={null}>
        <LoginPage />
      </Suspense>
    </div>
  );
};

export default page;

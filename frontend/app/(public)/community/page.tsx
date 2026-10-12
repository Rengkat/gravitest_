import type { Metadata } from "next";
import CommunityPageClient from "./CommunityPageClient";
import { JsonLd, breadcrumbJsonLd } from "@/lib/seo/jsonld";
import { absoluteUrl } from "@/lib/seo/site";

export const metadata: Metadata = {
  title: "Community — Join Fellow JAMB & WAEC Candidates",
  description:
    "Join thousands of Nigerian students preparing for JAMB, WAEC, and Post-UTME together. " +
    "Get study tips, ask questions, and stay motivated with the Gravitest community.",
  alternates: { canonical: absoluteUrl("/community") },
  openGraph: {
    type: "website",
    url: absoluteUrl("/community"),
    title: "Gravitest Community — Study Together, Pass Together",
    description: "Join thousands of Nigerian students preparing for JAMB, WAEC, and Post-UTME together.",
  },
};

export default function CommunityPage() {
  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "Community", path: "/community" }])}
      />
      <CommunityPageClient />
    </>
  );
}

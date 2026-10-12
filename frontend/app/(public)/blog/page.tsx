import type { Metadata } from "next";
import BlogPageClient from "./BlogPageClient";
import { JsonLd, breadcrumbJsonLd } from "@/lib/seo/jsonld";
import { absoluteUrl } from "@/lib/seo/site";

export const metadata: Metadata = {
  title: "Blog — JAMB, WAEC & Study Tips",
  description:
    "Free JAMB and WAEC prep guides, AI-learning tips, and success stories from Nigerian students. " +
    "Everything you need to boost your score, straight from the Gravitest team.",
  alternates: { canonical: absoluteUrl("/blog") },
  openGraph: {
    type: "website",
    url: absoluteUrl("/blog"),
    title: "Gravitest Blog — JAMB, WAEC & Study Tips",
    description: "Free exam prep guides and study tips for Nigerian students.",
  },
};

export default function BlogPage() {
  return (
    <>
      <JsonLd data={breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "Blog", path: "/blog" }])} />
      <BlogPageClient />
    </>
  );
}

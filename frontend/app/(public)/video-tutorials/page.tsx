import type { Metadata } from "next";
import VideoTutorialsPageClient from "./VideoTutorialsPageClient";
import { JsonLd, breadcrumbJsonLd } from "@/lib/seo/jsonld";
import { absoluteUrl } from "@/lib/seo/site";

export const metadata: Metadata = {
  title: "Video Tutorials — Learn JAMB & WAEC Topics Step by Step",
  description:
    "Watch free video lessons covering the toughest JAMB and WAEC topics, taught by expert Nigerian " +
    "tutors — from Mathematics and Physics to English and Chemistry.",
  alternates: { canonical: absoluteUrl("/video-tutorials") },
  openGraph: {
    type: "website",
    url: absoluteUrl("/video-tutorials"),
    title: "Gravitest Video Tutorials — Learn JAMB & WAEC Topics Step by Step",
    description: "Free video lessons covering the toughest JAMB and WAEC topics.",
  },
};

export default function VideoTutorialsPage() {
  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Video Tutorials", path: "/video-tutorials" },
        ])}
      />
      <VideoTutorialsPageClient />
    </>
  );
}

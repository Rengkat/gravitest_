"use client";

import { useEffect } from "react";
import Hero from "./Hero";
import StatsBar from "./StatsBar";
import Features from "./Features";
import ExamModules from "./ExamModules";
import HowItWorks from "./HowItWorks";
import AITutor from "./AITutor";
import Testimonials from "./Testimonials";
import CTA from "./CTA";
import { useBlocks, useCollection } from "@/lib/hooks/useSiteContent";

const HOME_BLOCKS = [
  "home.hero", "home.stats", "home.features", "home.exam-modules",
  "home.how-it-works", "home.ai-tutor", "home.testimonials", "home.cta",
] as const;

export default function GravitasHomepageClient() {
  const { blocks, isLoading, isError, refetch } = useBlocks(HOME_BLOCKS);
  const testimonials = useCollection("testimonials");
  const ready = !!blocks && !testimonials.isLoading;

  // Scroll-reveal must run AFTER the sections exist, i.e. once content has loaded.
  useEffect(() => {
    if (!ready) return;
    const observer = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("visible");
            observer.unobserve(e.target);
          }
        }),
      { threshold: 0.1, rootMargin: "0px 0px -40px 0px" },
    );
    document.querySelectorAll(".reveal").forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [ready]);

  if (isLoading || (!blocks && !isError)) {
    return <div role="status" aria-busy="true" className="min-h-screen bg-cream"><span className="sr-only">Loading…</span></div>;
  }

  if (isError || !blocks) {
    return (
      <div role="alert" className="min-h-screen bg-cream flex flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="text-green-900">We couldn&apos;t load this page right now.</p>
        <button type="button" onClick={() => void refetch()} className="rounded-full bg-green-800 px-6 py-2.5 text-sm font-semibold text-white">
          Try again
        </button>
      </div>
    );
  }

  return (
    <>
      <Hero content={blocks["home.hero"]} />
      <StatsBar content={blocks["home.stats"]} />
      <Features content={blocks["home.features"]} />
      <ExamModules content={blocks["home.exam-modules"]} />
      <HowItWorks content={blocks["home.how-it-works"]} />
      <AITutor content={blocks["home.ai-tutor"]} />
      <Testimonials content={blocks["home.testimonials"]} items={testimonials.data ?? []} />
      <CTA content={blocks["home.cta"]} />
    </>
  );
}

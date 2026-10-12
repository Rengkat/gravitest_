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

export default function GravitasHomepageClient() {
  useEffect(() => {
    const reveals = document.querySelectorAll(".reveal");
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
    reveals.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <>
      <Hero />
      <StatsBar />
      <Features />
      <ExamModules />
      <HowItWorks />
      <AITutor />
      <Testimonials />
      <CTA />
    </>
  );
}

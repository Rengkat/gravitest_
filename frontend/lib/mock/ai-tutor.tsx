import { Difficulty, ResponseStyle, Subject } from "@/types/ai-tutor";
import { Award, FileText, Lightbulb, Target } from "lucide-react";

export const QUICK_PROMPTS = [
  { icon: Lightbulb, label: "Explain Concept", prompt: "Explain the concept of " },
  { icon: Target, label: "Solve Problem", prompt: "Solve this step by step: " },
  { icon: Award, label: "Exam Tips", prompt: "Give me exam tips for " },
  { icon: FileText, label: "Summarise Topic", prompt: "Summarise this topic for JAMB/WAEC: " },
];

export const SUGGESTIONS = [
  "Explain Newton's laws of motion with Nigerian examples",
  "How do I solve quadratic equations step by step?",
  "What is the difference between DNA and RNA?",
  "Explain supply and demand using a Lagos market example",
  "How to write a strong essay introduction for WAEC?",
  "What caused World War I? Key points for exams",
  "Explain photosynthesis like I am 15 years old",
  "How do I balance chemical equations?",
];

/* ─────────────────────────────────────────────────────────
   SYSTEM PROMPT builder
───────────────────────────────────────────────────────── */
export function buildSystemPrompt(
  subject: Subject,
  difficulty: Difficulty,
  style: ResponseStyle,
  pidgin: boolean,
): string {
  const levelMap: Record<Difficulty, string> = {
    beginner: "a complete beginner who needs simple, clear language",
    intermediate: "a secondary school student (SS2/SS3 level)",
    advanced: "a student preparing for JAMB or WAEC at a high level",
    expert: "a student capable of university-level thinking",
  };
  const styleMap: Record<ResponseStyle, string> = {
    detailed: "Give thorough explanations with background context.",
    concise: "Be brief and direct — key points only.",
    "step-by-step": "Always break answers into numbered steps.",
    examples: "Lead with a practical example before explaining theory.",
  };
  const lang = pidgin
    ? "You may mix standard English with Nigerian Pidgin English to make explanations feel familiar and engaging."
    : "Always respond in clear, standard English.";

  return [
    `You are Sabi-Tutor, the AI learning assistant built into Gravitest — Nigeria's #1 exam prep platform.`,
    `You specialise in helping Nigerian secondary school students prepare for JAMB, WAEC, NECO, Post-UTME, and related exams.`,
    subject !== "general"
      ? `The student has selected ${subject.toUpperCase()} as their current subject. Prioritise that subject context.`
      : "",
    `Explain things as you would to ${levelMap[difficulty]}.`,
    styleMap[style],
    lang,
    `Use local Nigerian examples (Lagos traffic, garri, market prices, NEPA light) when they make concepts clearer.`,
    `Always tie explanations back to the Nigerian curriculum (WAEC/JAMB syllabus).`,
    `After each explanation, offer a short follow-up practice question.`,
    `Format your responses with **bold** for key terms, and use bullet points for lists.`,
    `Never make up facts. If you are unsure, say so and suggest the student verify in their textbook.`,
  ]
    .filter(Boolean)
    .join("\n");
}

import { BASE_QUESTIONS, Question } from "@/lib/constants/mcq";

export function buildQuestions(subjectId: string, count: number): Question[] {
  const pool = BASE_QUESTIONS[subjectId] ?? BASE_QUESTIONS.physics;
  return Array.from({ length: count }, (_, i) => {
    const template = pool[i % pool.length];
    return {
      ...template,
      id: i + 1,
      text:
        i >= pool.length
          ? `${template.text} (Variant ${Math.floor(i / pool.length) + 1})`
          : template.text,
    };
  });
}

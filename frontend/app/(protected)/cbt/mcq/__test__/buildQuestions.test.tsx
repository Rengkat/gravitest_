import { describe, test, expect } from "vitest";
import { buildQuestions } from "../buildQuestions";
import { BASE_QUESTIONS } from "@/lib/constants/mcq";

describe("buildQuestions", () => {
  // ── Count ────────────────────────────────────────────

  test("returns exactly the requested number of questions", () => {
    const questions = buildQuestions("physics", 100);
    expect(questions).toHaveLength(100);
  });

  test("works for any count", () => {
    expect(buildQuestions("physics", 10)).toHaveLength(10);
    expect(buildQuestions("physics", 1)).toHaveLength(1);
  });

  // ── IDs ──────────────────────────────────────────────

  test("assigns sequential IDs starting from 1", () => {
    const questions = buildQuestions("physics", 5);
    expect(questions.map((q) => q.id)).toEqual([1, 2, 3, 4, 5]);
  });

  // ── Subject fallback ─────────────────────────────────

  test("falls back to physics pool for unknown subjectId", () => {
    const unknown = buildQuestions("unknown_subject", 5);
    const physics = buildQuestions("physics", 5);

    unknown.forEach((q, i) => {
      // Same base text (before any variant suffix)
      expect(q.text.startsWith(physics[i].text.split(" (Variant")[0])).toBe(true);
    });
  });

  test("uses the correct pool for known subjects", () => {
    const physicsPool = BASE_QUESTIONS.physics;
    const questions = buildQuestions("physics", physicsPool.length);

    questions.forEach((q, i) => {
      expect(q.text).toBe(physicsPool[i].text);
    });
  });

  // ── Variant text ─────────────────────────────────────

  test("does not add variant suffix for questions within pool size", () => {
    const poolSize = BASE_QUESTIONS.physics.length;
    const questions = buildQuestions("physics", poolSize);

    questions.forEach((q) => {
      expect(q.text).not.toContain("Variant");
    });
  });

  test("adds Variant 2 suffix when questions exceed pool size", () => {
    const poolSize = BASE_QUESTIONS.physics.length;
    const questions = buildQuestions("physics", poolSize + 1);
    const overflowQuestion = questions[poolSize];

    expect(overflowQuestion.text).toContain("(Variant 2)");
  });

  test("increments variant number correctly for subsequent cycles", () => {
    const poolSize = BASE_QUESTIONS.physics.length;
    const questions = buildQuestions("physics", poolSize * 3);

    // First cycle — no variant
    expect(questions[0].text).not.toContain("Variant");
    // Second cycle — Variant 2
    expect(questions[poolSize].text).toContain("(Variant 2)");
    // Third cycle — Variant 3
    expect(questions[poolSize * 2].text).toContain("(Variant 3)");
  });

  // ── Template spreading ───────────────────────────────

  test("preserves all other question fields from the template", () => {
    const questions = buildQuestions("physics", 1);
    const template = BASE_QUESTIONS.physics[0];

    expect(questions[0].options).toEqual(template.options);
    expect(questions[0].correctAnswer).toBe(template.correctAnswer);
    expect(questions[0].subjectId).toBe(template.subjectId);
  });
});

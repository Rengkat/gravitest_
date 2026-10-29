import { describe, it, expect } from "vitest";
import { resolveSessionSettings, DEFAULT_EXAM_MINUTES } from "../sessionSettings";

describe("resolveSessionSettings", () => {
  it("Practice never gets a duration (untimed), even if the wizard has a time limit set", () => {
    const s = resolveSessionSettings({ numQuestions: 20, timeLimit: 90, questionType: "MCQ" } as never, "practice");
    expect(s.durationMinutes).toBeNull();
    expect(s.questionCount).toBe(20);
  });

  it("Exam uses the chosen time limit", () => {
    expect(resolveSessionSettings({ numQuestions: 20, timeLimit: 90 } as never, "exam").durationMinutes).toBe(90);
  });

  it("Exam with no explicit time limit resolves ONE default, shared by wizard + server", () => {
    const s = resolveSessionSettings({ numQuestions: 20 } as never, "exam");
    expect(s.durationMinutes).toBe(DEFAULT_EXAM_MINUTES);
  });

  it("only mixed sessions get a theory question count", () => {
    expect(resolveSessionSettings({ numQuestions: 20, questionType: "MCQ" } as never, "exam").theoryQuestionCount).toBeNull();
    expect(
      resolveSessionSettings({ numQuestions: 20, numTheoryQuestions: 3, questionType: "ALL" } as never, "exam")
        .theoryQuestionCount,
    ).toBe(3);
  });
});

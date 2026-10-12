import { describe, it, expect } from "vitest";
import {
  buildExamSummary,
  formatDuration,
  formatQuestionCount,
  getSessionDurationMinutes,
} from "../examSummary";

const q = (subject: string, type: "mcq" | "theory") => ({ subject, type }) as never;
const session = (config: object, questions: unknown[]) =>
  ({ config, questions }) as never;

describe("formatDuration", () => {
  it("formats hours and minutes", () => {
    expect(formatDuration(120)).toBe("2 Hours");
    expect(formatDuration(150)).toBe("2 Hours 30 Mins");
    expect(formatDuration(60)).toBe("1 Hour");
    expect(formatDuration(45)).toBe("45 Mins");
    expect(formatDuration(1)).toBe("1 Min");
  });
});

describe("formatQuestionCount", () => {
  it("pluralises", () => {
    expect(formatQuestionCount(1)).toBe("1 Question");
    expect(formatQuestionCount(40)).toBe("40 Questions");
  });
});

describe("getSessionDurationMinutes", () => {
  it("uses config.timeLimit and defaults to 120 like the timer", () => {
    expect(getSessionDurationMinutes(session({ timeLimit: 90 }, []))).toBe(90);
    expect(getSessionDurationMinutes(session({}, []))).toBe(120);
    expect(getSessionDurationMinutes(null)).toBe(120);
  });
});

describe("buildExamSummary", () => {
  it("secondary exam", () => {
    const s = buildExamSummary(
      session({ examType: "JAMB", timeLimit: 90 }, [q("physics", "mcq"), q("chemistry", "mcq"), q("english", "theory")]),
      "mcq",
      80,
    );
    expect(s).toEqual({
      categoryLabel: "Secondary School Exam",
      title: "JAMB UTME CBT Examination",
      subjectsLabel: "Physics, Chemistry",
      questionCount: 80,
      durationMinutes: 90,
    });
  });

  it("professional exam uses the professional body's name", () => {
    const s = buildExamSummary(
      session({ examType: "PROFESSIONAL", professionalExam: "ICAN", timeLimit: 60 }, [q("taxation", "mcq")]),
      "mcq",
      40,
    );
    expect(s.categoryLabel).toBe("Professional Exam");
    expect(s.title).toBe("ICAN CBT Examination");
  });

  it("falls back to config subjects when the part has no questions, and null for zero count", () => {
    const s = buildExamSummary(session({ examType: "WAEC", subject: "Further_Mathematics" }, []), "theory", 0);
    expect(s.subjectsLabel).toBe("Further Mathematics");
    expect(s.questionCount).toBeNull();
    expect(s.title).toBe("WAEC SSCE CBT Examination");
  });

  it("returns generic summary without a session", () => {
    const s = buildExamSummary(null, "mcq", 10);
    expect(s.title).toBe("CBT Examination");
    expect(s.questionCount).toBeNull();
    expect(s.durationMinutes).toBeNull();
  });
});

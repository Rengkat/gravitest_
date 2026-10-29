import { describe, it, expect } from "vitest";
import {
  buildExamSummary,
  buildInstructionLines,
  formatDuration,
  formatQuestionCount,
  getSessionDurationMinutes,
  validateSessionForPlay,
} from "../examSummary";

const q = (subject: string, type: "mcq" | "theory" | "practical") => ({ subject, type }) as never;
const session = (
  config: object,
  questions: unknown[],
  mode: "practice" | "exam" = "exam",
  backend: object = { status: "in_progress", allowedDurationSeconds: 5400 },
) => ({ config, questions, mode, backendSession: backend }) as never;

const text = (lines: ReturnType<typeof buildInstructionLines>) =>
  lines.map((l) => l.segments.map((s) => s.text).join("")).join("\n");

describe("formatDuration / formatQuestionCount", () => {
  it("formats hours and minutes", () => {
    expect(formatDuration(120)).toBe("2 Hours");
    expect(formatDuration(150)).toBe("2 Hours 30 Mins");
    expect(formatDuration(60)).toBe("1 Hour");
    expect(formatDuration(45)).toBe("45 Mins");
    expect(formatDuration(1)).toBe("1 Min");
  });
  it("pluralises", () => {
    expect(formatQuestionCount(1)).toBe("1 Question");
    expect(formatQuestionCount(40)).toBe("40 Questions");
  });
});

describe("getSessionDurationMinutes — the server session is the single source of truth", () => {
  it("returns the exam duration the server holds", () => {
    expect(getSessionDurationMinutes(session({}, [], "exam", { allowedDurationSeconds: 5400 }))).toBe(90);
  });
  it("has NO default: a missing duration is null, never a made-up 120", () => {
    expect(getSessionDurationMinutes(session({}, [], "exam", { allowedDurationSeconds: null }))).toBeNull();
    expect(getSessionDurationMinutes(null)).toBeNull();
  });
  it("is always null for Practice (untimed), even if a duration is present", () => {
    expect(getSessionDurationMinutes(session({}, [], "practice", { allowedDurationSeconds: 3600 }))).toBeNull();
  });
});

describe("buildExamSummary", () => {
  it("reflects the real configuration for an exam", () => {
    const s = buildExamSummary(
      session({ examType: "JAMB" }, [q("physics", "mcq"), q("chemistry", "mcq"), q("english", "theory")]),
      "mcq",
      80,
    );
    expect(s.title).toBe("JAMB UTME CBT Examination");
    expect(s.subjectsLabel).toBe("Physics, Chemistry");
    expect(s.questionCount).toBe(80);
    expect(s.durationMinutes).toBe(90);
    expect(s.mode).toBe("exam");
    expect(s.isTimed).toBe(true);
    expect(s.kind).toBe("mcq");
  });

  it("practice is untimed", () => {
    const s = buildExamSummary(session({ examType: "WAEC" }, [q("physics", "mcq")], "practice"), "mcq", 10);
    expect(s.mode).toBe("practice");
    expect(s.isTimed).toBe(false);
    expect(s.durationMinutes).toBeNull();
  });

  it("distinguishes theory from practical", () => {
    expect(buildExamSummary(session({}, [q("physics", "theory")]), "theory", 3).kind).toBe("theory");
    expect(buildExamSummary(session({}, [q("physics", "practical")]), "theory", 3).kind).toBe("practical");
  });

  it("professional exam uses the professional body's name", () => {
    const s = buildExamSummary(
      session({ examType: "PROFESSIONAL", professionalExam: "ICAN" }, [q("taxation", "mcq")]),
      "mcq",
      40,
    );
    expect(s.categoryLabel).toBe("Professional Exam");
    expect(s.title).toBe("ICAN CBT Examination");
  });

  it("falls back to config subjects when the part has no questions, and null for a zero count", () => {
    const s = buildExamSummary(session({ examType: "WAEC", subject: "Further_Mathematics" }, []), "theory", 0);
    expect(s.subjectsLabel).toBe("Further Mathematics");
    expect(s.questionCount).toBeNull();
  });

  it("returns a generic, untimed summary without a session", () => {
    const s = buildExamSummary(null, "mcq", 10);
    expect(s.title).toBe("CBT Examination");
    expect(s.questionCount).toBeNull();
    expect(s.durationMinutes).toBeNull();
  });
});

describe("buildInstructionLines", () => {
  it("Exam: shows the configured duration + count and says answers are revealed only after submission", () => {
    const t = text(buildInstructionLines(buildExamSummary(session({ examType: "JAMB" }, [q("physics", "mcq")]), "mcq", 60)));
    expect(t).toContain("60 questions");
    expect(t).toContain("1 Hour 30 Mins");
    expect(t).toContain("revealed only after you submit");
    expect(t).toContain("auto-submits when the timer reaches zero");
    // the old hardcoded values must be gone
    expect(t).not.toContain("100 multiple-choice");
    expect(t).not.toContain("2 hours");
  });

  it("Practice: says untimed + immediate feedback, and has no timer/auto-submit warning", () => {
    const t = text(
      buildInstructionLines(buildExamSummary(session({ examType: "JAMB" }, [q("physics", "mcq")], "practice"), "mcq", 12)),
    );
    expect(t).toContain("12 questions");
    expect(t).toContain("untimed");
    expect(t).toContain("Check Answer");
    expect(t).toContain("no formal score");
    expect(t).not.toContain("auto-submits");
    expect(t).not.toContain("Hour");
  });

  it("flags the auto-submit line as a warning for Exam only", () => {
    const exam = buildInstructionLines(buildExamSummary(session({}, [q("physics", "mcq")]), "mcq", 5));
    const practice = buildInstructionLines(buildExamSummary(session({}, [q("physics", "mcq")], "practice"), "mcq", 5));
    expect(exam.some((l) => l.warning)).toBe(true);
    expect(practice.some((l) => l.warning)).toBe(false);
  });

  it("theory instructions describe per-part Check Answer in Practice", () => {
    const t = text(
      buildInstructionLines(buildExamSummary(session({}, [q("physics", "theory")], "practice"), "theory", 4)),
    );
    expect(t).toContain("under that part");
  });
});

describe("validateSessionForPlay — invalid configuration is reported, not defaulted", () => {
  it("rejects a missing session", () => {
    expect(validateSessionForPlay(null, "mcq")).toMatch(/couldn't load/i);
  });
  it("rejects a session with no questions for the part", () => {
    expect(validateSessionForPlay(session({}, [q("physics", "theory")]), "mcq")).toMatch(/no questions/i);
  });
  it("rejects an already-submitted session", () => {
    expect(
      validateSessionForPlay(
        session({}, [q("physics", "mcq")], "exam", { status: "submitted", allowedDurationSeconds: 3600 }),
        "mcq",
      ),
    ).toMatch(/already been submitted/i);
  });
  it("rejects an exam with no valid duration", () => {
    expect(
      validateSessionForPlay(
        session({}, [q("physics", "mcq")], "exam", { status: "in_progress", allowedDurationSeconds: null }),
        "mcq",
      ),
    ).toMatch(/no valid duration/i);
  });
  it("accepts a valid exam and a valid practice session", () => {
    expect(validateSessionForPlay(session({}, [q("physics", "mcq")]), "mcq")).toBeNull();
    expect(
      validateSessionForPlay(
        session({}, [q("physics", "mcq")], "practice", { status: "in_progress", allowedDurationSeconds: null }),
        "mcq",
      ),
    ).toBeNull();
  });
});

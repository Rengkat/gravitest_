import { describe, it, expect } from "vitest";
import { buildTheoryResults, questionStatus } from "./buildTheoryResults";

const part = (path: string, score: number, max: number, extra: object = {}) => ({
  path, awardedScore: score, maxScore: max, confidence: 0.9, aiEssayScoreId: `score-${path}`,
  feedback: `fb ${path}`, strengths: ["s"], improvements: ["i"], ...extra,
});

const structured = (answer: object): never =>
  ({
    sessionQuestionId: "sq1",
    question: {
      id: "q1", questionText: "Q", type: "theory", maxScore: 6,
      structure: [{ label: "(a)", text: "part a", maxScore: 2 }, { label: "(b)", text: "part b", maxScore: 4 }],
      explanations: [{ text: "stored explanation" }], modelAnswer: "mark scheme",
    },
    yourAnswer: {
      selectedLabel: null, essayText: "", essayImageUrls: [], isCorrect: false, awardedScore: 3, maxScore: 6,
      scoringStatus: "scored", aiEssayScoreId: null,
      partAnswers: [{ path: "(a)", essayText: "ans a", essayImageUrls: [] }, { path: "(b)", essayText: "", essayImageUrls: ["http://img"] }],
      ...answer,
    },
  }) as never;

describe("buildTheoryResults", () => {
  it("keeps every part's grade independent, keyed by stable ids", () => {
    const [q] = buildTheoryResults([structured({ partScores: [part("(a)", 1, 2), part("(b)", 2, 4)] })]);
    expect(q.parts.map((p) => p.sub.id)).toEqual(["sq1__(a)", "sq1__(b)"]);
    expect(q.parts[0].result?.score).toBe(1);
    expect(q.parts[1].result?.score).toBe(2);
    expect(q.parts[0].result?.feedback).toBe("fb (a)");
    expect(q.parts[1].result?.feedback).toBe("fb (b)");
  });

  it("carries the student's own text and images per part", () => {
    const [q] = buildTheoryResults([structured({ partScores: [part("(a)", 1, 2), part("(b)", 2, 4)] })]);
    expect(q.parts[0].studentText).toBe("ans a");
    expect(q.parts[1].studentImageUrls).toEqual(["http://img"]);
  });

  it("exposes the stored explanation and model answer for the question", () => {
    const [q] = buildTheoryResults([structured({ partScores: [part("(a)", 1, 2), part("(b)", 2, 4)] })]);
    expect(q.explanation).toBe("stored explanation");
    expect(q.modelAnswer).toBe("mark scheme");
  });

  it("a failed part is marked failed with NO invented grade, while other parts keep theirs", () => {
    const [q] = buildTheoryResults([
      structured({
        scoringStatus: "pending",
        partScores: [part("(a)", 2, 2), part("(b)", 0, 4, { status: "failed", aiEssayScoreId: null })],
      }),
    ]);
    expect(q.status).toBe("ungraded");
    expect(q.parts[0].result?.score).toBe(2);
    expect(q.parts[0].failed).toBe(false);
    expect(q.parts[1].failed).toBe(true);
    expect(q.parts[1].result).toBeUndefined();
  });

  it("includes practical questions (they used to be dropped from results)", () => {
    const item = structured({ partScores: [part("(a)", 1, 2), part("(b)", 1, 4)] }) as { question: { type: string } };
    item.question.type = "practical";
    expect(buildTheoryResults([item as never])).toHaveLength(1);
  });

  it("plain (non-structured) question reads the grade from the answer itself", () => {
    const plain = {
      sessionQuestionId: "sq2",
      question: { id: "q2", questionText: "Explain", type: "theory", maxScore: 10, structure: null },
      yourAnswer: {
        selectedLabel: null, essayText: "my essay", essayImageUrls: [], isCorrect: false, awardedScore: 7, maxScore: 10,
        scoringStatus: "scored", aiEssayScoreId: "score-x", aiFeedback: "nice", aiStrengths: ["a"], aiImprovements: ["b"],
      },
    } as never;
    const [q] = buildTheoryResults([plain]);
    expect(q.parts).toHaveLength(1);
    expect(q.parts[0].result).toMatchObject({ score: 7, maxScore: 10, feedback: "nice", id: "score-x" });
  });

  it("question status", () => {
    expect(questionStatus({ sessionQuestionId: "x", question: {}, yourAnswer: null } as never)).toBe("not_attempted");
    expect(
      questionStatus({
        sessionQuestionId: "x", question: {},
        yourAnswer: { essayText: "hi", essayImageUrls: [], scoringStatus: "needs_review" },
      } as never),
    ).toBe("needs_review");
  });
});

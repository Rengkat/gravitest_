import { describe, test, expect } from "vitest";
import { buildInitialAnswers } from "@/lib/mcq/buildInitialAnswers";
import type { Question } from "@/lib/constants/mcq";

const mockQuestions: Question[] = [
  {
    id: 1,
    subjectId: "physics",
    text: "Question 1",
    options: [
      { label: "A", text: "A" },
      { label: "B", text: "B" },
      { label: "C", text: "C" },
      { label: "D", text: "D" },
    ],
    correctAnswer: "A",
  },
  {
    id: 2,
    subjectId: "physics",
    text: "Question 2",
    options: [
      { label: "A", text: "A" },
      { label: "B", text: "B" },
      { label: "C", text: "C" },
      { label: "D", text: "D" },
    ],
    correctAnswer: "B",
  },
  {
    id: 3,
    subjectId: "physics",
    text: "Question 3",
    options: [
      { label: "A", text: "A" },
      { label: "B", text: "B" },
      { label: "C", text: "C" },
      { label: "D", text: "D" },
    ],
    correctAnswer: "C",
  },
];

describe("buildInitialAnswers", () => {
  test("returns same length as questions array", () => {
    expect(buildInitialAnswers(mockQuestions)).toHaveLength(3);
  });

  test("sets selectedOption to null for all questions", () => {
    const answers = buildInitialAnswers(mockQuestions);
    answers.forEach((a) => expect(a.selectedOption).toBeNull());
  });

  test("sets isFlagged to false for all questions", () => {
    const answers = buildInitialAnswers(mockQuestions);
    answers.forEach((a) => expect(a.isFlagged).toBe(false));
  });

  test("marks only the first question as visited", () => {
    const answers = buildInitialAnswers(mockQuestions);
    expect(answers[0].isVisited).toBe(true);
    expect(answers[1].isVisited).toBe(false);
    expect(answers[2].isVisited).toBe(false);
  });

  test("returns empty array for empty questions", () => {
    expect(buildInitialAnswers([])).toEqual([]);
  });

  test("works correctly for a single question", () => {
    const answers = buildInitialAnswers([mockQuestions[0]]);
    expect(answers).toHaveLength(1);
    expect(answers[0].isVisited).toBe(true); // first and only
    expect(answers[0].selectedOption).toBeNull();
    expect(answers[0].isFlagged).toBe(false);
  });
});

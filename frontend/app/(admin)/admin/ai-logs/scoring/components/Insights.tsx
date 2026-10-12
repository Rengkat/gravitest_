// Shared strength/weakness/recommendation logic used by both
// Practice Scoring and Exam Scoring insights tabs, and by
// individual student detail panels.
//
// This is pure derivation on top of existing data shapes
// (subjectPerformance / SubjectBreakdown) — no new backend fields needed.

export interface SubjectPoint {
  subject: string;
  avgScore: number;
  questionCount: number;
}

export type StrengthLevel = "strength" | "developing" | "weakness";

export interface SubjectInsight {
  subject: string;
  avgScore: number;
  questionCount: number;
  level: StrengthLevel;
}

export interface StudentInsight {
  studentId: string;
  studentName: string;
  topStrength: SubjectInsight | null;
  topWeakness: SubjectInsight | null;
  subjects: SubjectInsight[];
  recommendation: string;
}

// Thresholds — tune these without touching call sites.
const STRENGTH_THRESHOLD = 75;
const WEAKNESS_THRESHOLD = 55;

export function classifySubject(avgScore: number): StrengthLevel {
  if (avgScore >= STRENGTH_THRESHOLD) return "strength";
  if (avgScore < WEAKNESS_THRESHOLD) return "weakness";
  return "developing";
}

export function levelColor(level: StrengthLevel): { color: string; bg: string; label: string } {
  switch (level) {
    case "strength":
      return { color: "#10b981", bg: "#10b98115", label: "Strength" };
    case "weakness":
      return { color: "#ef4444", bg: "#ef444415", label: "Needs Attention" };
    default:
      return { color: "#f59e0b", bg: "#f59e0b15", label: "Developing" };
  }
}

export function buildSubjectInsights(points: SubjectPoint[]): SubjectInsight[] {
  return points
    .map((p) => ({ ...p, level: classifySubject(p.avgScore) }))
    .sort((a, b) => b.avgScore - a.avgScore);
}

// Plain-language recommendation built from the weakest subject(s).
export function buildRecommendation(insights: SubjectInsight[]): string {
  const weaknesses = insights.filter((i) => i.level === "weakness");
  const strengths = insights.filter((i) => i.level === "strength");

  if (weaknesses.length === 0 && strengths.length > 0) {
    return `Performing well across all subjects. Consider advanced practice in ${strengths[0].subject} to maintain momentum.`;
  }
  if (weaknesses.length === 1) {
    return `Focus additional practice time on ${weaknesses[0].subject} (avg ${weaknesses[0].avgScore.toFixed(0)}%). ${
      strengths.length > 0
        ? `Strong performance in ${strengths[0].subject} can be used as a confidence anchor.`
        : ""
    }`.trim();
  }
  if (weaknesses.length > 1) {
    const names = weaknesses.map((w) => w.subject).join(" and ");
    return `Multiple weak areas detected: ${names}. Recommend a structured revision plan prioritizing these subjects before the next assessment.`;
  }
  return "Not enough graded data yet to generate a recommendation.";
}

export function buildStudentInsight(
  studentId: string,
  studentName: string,
  points: SubjectPoint[],
): StudentInsight {
  const subjects = buildSubjectInsights(points);
  const topStrength = subjects.find((s) => s.level === "strength") ?? subjects[0] ?? null;
  const topWeakness = [...subjects].reverse().find((s) => s.level === "weakness") ?? null;

  return {
    studentId,
    studentName,
    topStrength,
    topWeakness,
    subjects,
    recommendation: buildRecommendation(subjects),
  };
}

// Aggregate insight across many students/submissions — used by the
// platform-wide "Insights" tab (cohort-level strengths/weaknesses).
export interface CohortInsight {
  subject: string;
  avgScore: number;
  studentCount: number;
  level: StrengthLevel;
}

export function buildCohortInsights(allPoints: SubjectPoint[][]): CohortInsight[] {
  const bySubject = new Map<string, { total: number; weightedCount: number; students: number }>();

  for (const points of allPoints) {
    for (const p of points) {
      const entry = bySubject.get(p.subject) ?? { total: 0, weightedCount: 0, students: 0 };
      entry.total += p.avgScore * p.questionCount;
      entry.weightedCount += p.questionCount;
      entry.students += 1;
      bySubject.set(p.subject, entry);
    }
  }

  return Array.from(bySubject.entries())
    .map(([subject, { total, weightedCount, students }]) => {
      const avgScore = weightedCount > 0 ? total / weightedCount : 0;
      return {
        subject,
        avgScore,
        studentCount: students,
        level: classifySubject(avgScore),
      };
    })
    .sort((a, b) => a.avgScore - b.avgScore); // weakest first — most actionable
}

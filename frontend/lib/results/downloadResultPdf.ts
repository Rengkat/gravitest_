export interface McqBreakdownRow {
  subjectName: string;
  questionNumber: number;
  questionText: string;
  selected: string | null;
  correctAnswer: string;
  isCorrect: boolean;
  explanation?: string;
}

export interface TheoryBreakdownRow {
  questionNumber: number | string;
  marksGot: number;
  marksTotal: number;
  subQuestions: {
    label: string;
    text: string;
    marksGot: number;
    marksTotal: number;
    feedback?: string;
  }[];
}

export interface ResultPdfInput {
  studentName: string;
  sessionId: string;
  examLabel: string; // e.g. "WAEC · Physics" or "JAMB · Use of English, Mathematics"
  modeLabel: string; // "Practice Mode" | "Exam Mode"
  dateLabel: string;
  mcq?: {
    correct: number;
    total: number;
    percentage: number;
    rows: McqBreakdownRow[];
  };
  theory?: {
    totalScore: number;
    maxScore: number;
    percentage: number;
    rows: TheoryBreakdownRow[];
  };
  overallPercentage?: number;
}

// ── Classic palette ──
const INK: [number, number, number] = [33, 33, 33];
const MUTED: [number, number, number] = [110, 110, 110];
const RULE: [number, number, number] = [180, 170, 150];
const GOLD: [number, number, number] = [122, 94, 36]; // deep brass/gold for the letterhead
const GREEN_OK: [number, number, number] = [27, 94, 58];
const RED_BAD: [number, number, number] = [150, 35, 35];
const PANEL_BG: [number, number, number] = [248, 246, 240];
const EXPLAIN_BG: [number, number, number] = [250, 247, 238]; // slightly warmer than PANEL_BG
const EXPLAIN_INK: [number, number, number] = [96, 84, 64]; // warm brown-grey, distinct from question black
const PAGE_W = 595.28; // A4 pt
const PAGE_H = 841.89;
const MARGIN_X = 54;
const CONTENT_W = PAGE_W - MARGIN_X * 2;
const BOTTOM_LIMIT = 770;

// Swap Unicode symbols that the base14 "times" font (WinAnsi only) can't
// render for ASCII-safe equivalents.
const sanitizeText = (text: string): string =>
  text
    .replace(/Ω/g, "ohm")
    .replace(/[→⇒]/g, "->")
    .replace(/≈/g, "approx. ")
    .replace(/−/g, "-")
    .replace(/[’‘]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/…/g, "...");

export async function downloadResultPdf(input: ResultPdfInput) {
  const { default: jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "pt", format: "a4" });

  let y = 0;
  let pageNum = 1;

  const setColor = (c: [number, number, number]) => doc.setTextColor(...c);
  const setDraw = (c: [number, number, number]) => doc.setDrawColor(...c);
  const setFill = (c: [number, number, number]) => doc.setFillColor(...c);

  const footer = () => {
    setDraw(RULE);
    doc.setLineWidth(0.5);
    doc.line(MARGIN_X, 812, PAGE_W - MARGIN_X, 812);
    doc.setFont("times", "italic");
    doc.setFontSize(8.5);
    setColor(MUTED);
    doc.text(sanitizeText(input.examLabel), MARGIN_X, 826);
    doc.text(`Page ${pageNum}`, PAGE_W - MARGIN_X, 826, { align: "right" });
  };

  const newPage = () => {
    footer();
    doc.addPage();
    pageNum += 1;
    y = 56;
    drawRunningHeader();
  };

  const ensureSpace = (needed: number) => {
    if (y + needed > BOTTOM_LIMIT) newPage();
  };

  const drawRunningHeader = () => {
    doc.setFont("times", "bold");
    doc.setFontSize(9.5);
    setColor(GOLD);
    doc.text(sanitizeText(input.studentName), MARGIN_X, y);
    doc.setFont("times", "normal");
    setColor(MUTED);
    doc.text(sanitizeText(input.examLabel), PAGE_W - MARGIN_X, y, { align: "right" });
    y += 8;
    setDraw(RULE);
    doc.setLineWidth(0.75);
    doc.line(MARGIN_X, y, PAGE_W - MARGIN_X, y);
    y += 22;
  };

  const heading = (text: string) => {
    ensureSpace(34);
    doc.setFont("times", "bold");
    doc.setFontSize(13.5);
    setColor(GOLD);
    doc.text(text.toUpperCase(), MARGIN_X, y);
    y += 6;
    setDraw(GOLD);
    doc.setLineWidth(1);
    doc.line(MARGIN_X, y, MARGIN_X + 36, y);
    y += 18;
  };

  const wrapped = (text: string, size: number, width = CONTENT_W) => {
    doc.setFont("times", "normal");
    doc.setFontSize(size);
    return doc.splitTextToSize(sanitizeText(text), width) as string[];
  };

  const paragraph = (
    text: string,
    size = 9.5,
    color: [number, number, number] = [70, 70, 70],
    indent = 14,
  ) => {
    const lines = wrapped(text, size, CONTENT_W - indent);
    doc.setFont("times", "normal");
    doc.setFontSize(size);
    setColor(color);
    lines.forEach((l) => {
      ensureSpace(size + 5);
      doc.text(l, MARGIN_X + indent, y);
      y += size + 4.5;
    });
  };

  // Compact, clearly-differentiated callout for explanations / feedback.
  // Tinted panel + left accent bar + small-caps label, sized exactly to its
  // content so it never runs past the right margin or leaves dead space.
  const calloutBox = (label: string, text: string, indent = 14) => {
    const boxX = MARGIN_X + indent;
    const boxW = CONTENT_W - indent; // right edge lands exactly on PAGE_W - MARGIN_X
    const padX = 10;
    const padTop = 15;
    const padBottom = 7;
    const size = 8.5;
    const lineH = size + 3;

    doc.setFont("times", "normal");
    doc.setFontSize(size);
    const lines = doc.splitTextToSize(sanitizeText(text), boxW - padX * 2) as string[];
    const boxH = padTop + lines.length * lineH + padBottom;

    ensureSpace(boxH + 8);

    setFill(EXPLAIN_BG);
    setDraw(RULE);
    doc.setLineWidth(0.5);
    doc.roundedRect(boxX, y, boxW, boxH, 2, 2, "FD");

    setFill(GOLD);
    doc.rect(boxX, y, 2.25, boxH, "F");

    doc.setFont("times", "bold");
    doc.setFontSize(7);
    setColor(GOLD);
    doc.text(label.toUpperCase(), boxX + padX, y + 10, { charSpace: 0.6 } as any);

    doc.setFont("times", "normal");
    doc.setFontSize(size);
    setColor(EXPLAIN_INK);
    let ty = y + padTop + size * 0.35;
    lines.forEach((l) => {
      doc.text(l, boxX + padX, ty);
      ty += lineH;
    });

    y += boxH + 8;
  };

  // ── Letterhead (first page only) ──
  doc.setFont("times", "bold");
  doc.setFontSize(20);
  setColor(GOLD);
  doc.text("Practice Result Report", PAGE_W / 2, 64, { align: "center" });

  doc.setFont("times", "italic");
  doc.setFontSize(11);
  setColor(MUTED);
  doc.text(sanitizeText(input.examLabel), PAGE_W / 2, 84, { align: "center" });

  setDraw(GOLD);
  doc.setLineWidth(1.5);
  doc.line(MARGIN_X, 98, PAGE_W - MARGIN_X, 98);
  setDraw(RULE);
  doc.setLineWidth(0.5);
  doc.line(MARGIN_X, 101, PAGE_W - MARGIN_X, 101);

  y = 124;

  // ── Candidate info block ──
  doc.setFont("times", "normal");
  doc.setFontSize(10.5);
  setColor(INK);
  const infoLeftX = MARGIN_X;
  const infoRightX = PAGE_W / 2 + 10;
  const labelColor: [number, number, number] = [120, 110, 90];

  const infoRow = (label: string, value: string, x: number, yPos: number) => {
    doc.setFont("times", "bold");
    setColor(labelColor);
    doc.text(label.toUpperCase(), x, yPos);
    doc.setFont("times", "normal");
    setColor(INK);
    doc.text(sanitizeText(value), x, yPos + 14);
  };

  infoRow("Candidate", input.studentName, infoLeftX, y);
  infoRow("Mode", input.modeLabel, infoRightX, y);
  y += 32;
  infoRow("Date", input.dateLabel, infoLeftX, y);
  infoRow("Session ID", input.sessionId, infoRightX, y);
  y += 34;

  // ── Overall score panel ──
  if (input.overallPercentage !== undefined) {
    const panelH = 46;
    doc.setFillColor(...PANEL_BG);
    setDraw(GOLD);
    doc.setLineWidth(1);
    doc.roundedRect(MARGIN_X, y, CONTENT_W, panelH, 3, 3, "FD");
    doc.setFont("times", "bold");
    doc.setFontSize(11);
    setColor(INK);
    doc.text("OVERALL SCORE", MARGIN_X + 16, y + 28);
    doc.setFontSize(20);
    setColor(GOLD);
    doc.text(`${input.overallPercentage}%`, PAGE_W - MARGIN_X - 16, y + 31, { align: "right" });
    y += panelH + 26;
  }

  // ── MCQ section ──
  if (input.mcq) {
    ensureSpace(60);
    heading("Objective (MCQ)");
    doc.setFont("times", "bold");
    doc.setFontSize(10.5);
    setColor(INK);
    doc.text(
      `Score: ${input.mcq.correct} / ${input.mcq.total}   (${input.mcq.percentage}%)`,
      MARGIN_X,
      y,
    );
    y += 20;

    input.mcq.rows.forEach((row) => {
      ensureSpace(34);

      const status = row.isCorrect ? "Correct" : "Wrong";
      const statusColor = row.isCorrect ? GREEN_OK : RED_BAD;

      doc.setFont("times", "bold");
      doc.setFontSize(10);
      setColor(INK);
      doc.text(sanitizeText(`${row.subjectName} — Question ${row.questionNumber}`), MARGIN_X, y);

      doc.setFont("times", "bolditalic");
      setColor(statusColor);
      doc.text(status, PAGE_W - MARGIN_X, y, { align: "right" });
      y += 15;

      doc.setFont("times", "normal");
      doc.setFontSize(9);
      setColor(MUTED);
      doc.text(
        sanitizeText(`Selected: ${row.selected ?? "—"}    Correct: ${row.correctAnswer}`),
        MARGIN_X + 14,
        y,
      );
      y += 13;

      paragraph(row.questionText, 9.5, [55, 55, 55]);
      if (row.explanation) {
        calloutBox("Explanation", row.explanation);
      }

      y += 4;
      setDraw(RULE);
      doc.setLineWidth(0.4);
      ensureSpace(10);
      doc.line(MARGIN_X, y, PAGE_W - MARGIN_X, y);
      y += 14;
    });
  }

  // ── Theory section ──
  if (input.theory) {
    ensureSpace(60);
    heading("Theory / Practical");
    doc.setFont("times", "bold");
    doc.setFontSize(10.5);
    setColor(INK);
    doc.text(
      `Score: ${input.theory.totalScore} / ${input.theory.maxScore}   (${input.theory.percentage}%)`,
      MARGIN_X,
      y,
    );
    y += 20;

    input.theory.rows.forEach((row) => {
      ensureSpace(30);
      const qPct = row.marksTotal ? Math.round((row.marksGot / row.marksTotal) * 100) : 0;

      doc.setFont("times", "bold");
      doc.setFontSize(10.5);
      setColor(INK);
      doc.text(`Question ${row.questionNumber}`, MARGIN_X, y);
      setColor(GOLD);
      doc.text(`${row.marksGot} / ${row.marksTotal}  (${qPct}%)`, PAGE_W - MARGIN_X, y, {
        align: "right",
      });
      y += 16;

      row.subQuestions.forEach((sub) => {
        ensureSpace(28);
        doc.setFont("times", "bold");
        doc.setFontSize(9.25);
        setColor([80, 70, 50]);
        doc.text(`(${sub.label})  ${sub.marksGot} / ${sub.marksTotal}`, MARGIN_X + 14, y);
        y += 13;
        paragraph(sub.text, 9, [60, 60, 60], 28);
        if (sub.feedback) {
          calloutBox("Feedback", sub.feedback, 28);
        }
        y += 3;
      });

      y += 6;
      setDraw(RULE);
      doc.setLineWidth(0.4);
      ensureSpace(10);
      doc.line(MARGIN_X, y, PAGE_W - MARGIN_X, y);
      y += 14;
    });
  }

  footer();
  doc.save(`practice-result-${input.sessionId}.pdf`);
}

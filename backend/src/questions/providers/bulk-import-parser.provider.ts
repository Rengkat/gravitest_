import { BadRequestException, Injectable } from '@nestjs/common';
import {
  CandidateType,
  DifficultyLevel,
  ExamType,
  QuestionType,
  Subject,
} from 'src/common/enums/enums';
import { CreateQuestionDto } from '../dto/create-question.dto';

export interface BulkImportDefaults {
  examType?: ExamType;
  candidateType?: CandidateType;
  subject?: Subject;
  year?: number;
  difficulty?: DifficultyLevel;
  type?: QuestionType;
}

export interface ParsedQuestionRow {
  rowNumber: number; // 1-indexed, matches what an admin sees in Excel (header = row 1)
  dto: CreateQuestionDto;
  passageKey: string | null; // null = standalone question
}

export interface ParsedPassageGroup {
  key: string;
  examType: ExamType;
  subject: Subject;
  year: number;
  title: string | null;
  instructions: string | null;
  passageText: string | null;
  passageImageUrl: string | null;
}

export interface ParseOutcome {
  passages: ParsedPassageGroup[];
  rows: ParsedQuestionRow[];
  rowErrors: { row: number; reason: string }[];
}

// Recognized CSV columns (case-insensitive, spaces/underscores ignored).
// Every column is optional except questionText — anything else missing
// falls back to `defaults` (the shared examType/subject/year/etc. an
// admin picks once for the whole file, mirroring the single "Add
// Question" form's fields) and finally a sensible built-in default.
const COLUMN_ALIASES: Record<string, string> = {
  questionnumber: 'questionNumber',
  examtype: 'examType',
  exam: 'examType',
  candidatetype: 'candidateType',
  candidate: 'candidateType',
  // Common real-world spellings admins are likely to actually type in a
  // spreadsheet header — all normalize to the same 'candidateType' key.
  internalexternal: 'candidateType',
  schoolprivate: 'candidateType',
  subject: 'subject',
  year: 'year',
  questiontext: 'questionText',
  question: 'questionText',
  questionimageurl: 'questionImageUrl',
  difficulty: 'difficulty',
  type: 'type',
  questiontype: 'type',
  topic: 'topic',
  maxscore: 'maxScore',
  marks: 'maxScore',
  modelanswer: 'modelAnswer',
  optiona: 'optionA',
  optionb: 'optionB',
  optionc: 'optionC',
  optiond: 'optionD',
  optionaimage: 'optionAImage',
  optionaimageurl: 'optionAImage',
  optionbimage: 'optionBImage',
  optionbimageurl: 'optionBImage',
  optioncimage: 'optionCImage',
  optioncimageurl: 'optionCImage',
  optiondimage: 'optionDImage',
  optiondimageurl: 'optionDImage',
  correctlabel: 'correctLabel',
  correctanswer: 'correctLabel',
  answer: 'correctLabel',
  explanation: 'explanation',
  explanationimageurl: 'explanationImageUrl',
  passagetitle: 'passageTitle',
  passagetext: 'passageText',
  passage: 'passageText',
  passageinstructions: 'passageInstructions',
  passageimageurl: 'passageImageUrl',
  // Essay/theory only — a JSON-stringified EssayPart[] tree. Realistically
  // only used via the JSON bulk-import format (a spreadsheet cell is a
  // clumsy place to hand-author nested numbering), but accepted here too
  // so both formats funnel through one builder.
  structure: 'structure',
};

const MCQ_TYPES = new Set([
  QuestionType.MCQ,
  QuestionType.TRUE_FALSE,
  QuestionType.OBJECTIVE,
]);

@Injectable()
export class BulkImportParserProvider {
  // ── CSV → array of plain row objects ───────────────────────────────────

  parseCsv(text: string): Record<string, string>[] {
    const rows = this.tokenizeCsv(text);
    if (rows.length === 0) return [];

    const header = rows[0].map((h) => this.normalizeHeader(h));
    return rows
      .slice(1)
      .filter((r) => r.some((cell) => cell.trim() !== ''))
      .map((row) => {
        const obj: Record<string, string> = {};
        header.forEach((key, i) => {
          if (key) obj[key] = (row[i] ?? '').trim();
        });
        return obj;
      });
  }

  private normalizeHeader(raw: string): string | null {
    const cleaned = raw
      .trim()
      .toLowerCase()
      .replace(/[\s_-]+/g, '');
    return COLUMN_ALIASES[cleaned] ?? null;
  }

  // Accepts the enum values directly ("school"/"private") as well as the
  // common plain-English synonyms an admin is likely to type into a
  // spreadsheet cell ("internal"/"external", "school candidate", etc.).
  // Returns undefined (not null) for empty/unrecognized input so the
  // caller can fall back to defaults.candidateType.
  private parseCandidateType(raw?: string): CandidateType | undefined {
    if (!raw) return undefined;
    const cleaned = raw.trim().toLowerCase();
    if (['school', 'internal', 'schoolcandidate', 'internalcandidate'].includes(cleaned)) {
      return CandidateType.SCHOOL;
    }
    if (['private', 'external', 'privatecandidate', 'externalcandidate'].includes(cleaned)) {
      return CandidateType.PRIVATE;
    }
    return undefined;
  }

  // RFC4180-ish tokenizer: handles quoted fields, embedded commas,
  // embedded newlines inside quotes, and "" as an escaped quote.
  private tokenizeCsv(text: string): string[][] {
    const rows: string[][] = [];
    let row: string[] = [];
    let field = '';
    let inQuotes = false;
    const clean = text.replace(/^\uFEFF/, ''); // strip BOM from Excel exports

    for (let i = 0; i < clean.length; i++) {
      const char = clean[i];
      const next = clean[i + 1];

      if (inQuotes) {
        if (char === '"' && next === '"') {
          field += '"';
          i++;
        } else if (char === '"') {
          inQuotes = false;
        } else {
          field += char;
        }
        continue;
      }

      if (char === '"') {
        inQuotes = true;
      } else if (char === ',') {
        row.push(field);
        field = '';
      } else if (char === '\n' || char === '\r') {
        if (char === '\r' && next === '\n') i++;
        row.push(field);
        rows.push(row);
        row = [];
        field = '';
      } else {
        field += char;
      }
    }
    if (field.length > 0 || row.length > 0) {
      row.push(field);
      rows.push(row);
    }
    return rows;
  }

  // ── Plain row objects → validated DTOs + grouped passages ──────────────

  buildQuestionInput(
    rawRows: Record<string, string>[],
    defaults: BulkImportDefaults,
  ): ParseOutcome {
    const passages = new Map<string, ParsedPassageGroup>();
    const rows: ParsedQuestionRow[] = [];
    const rowErrors: { row: number; reason: string }[] = [];

    rawRows.forEach((raw, idx) => {
      const rowNumber = idx + 2; // +1 for 0-index, +1 for the header row
      try {
        const examType = (raw.examType as ExamType) || defaults.examType;
        const candidateType =
          this.parseCandidateType(raw.candidateType) ?? defaults.candidateType ?? null;
        const subject = (raw.subject as Subject) || defaults.subject;
        const year = raw.year ? parseInt(raw.year, 10) : defaults.year;
        const difficulty =
          (raw.difficulty?.toLowerCase() as DifficultyLevel) ||
          defaults.difficulty ||
          DifficultyLevel.MEDIUM;
        const type =
          (raw.type?.toLowerCase() as QuestionType) ||
          defaults.type ||
          QuestionType.MCQ;

        if (!examType)
          throw new Error('Missing examType (row and no default set)');
        if (!subject)
          throw new Error('Missing subject (row and no default set)');
        if (!year || Number.isNaN(year))
          throw new Error('Missing/invalid year');
        if (!raw.questionText) throw new Error('Missing questionText');

        // ── Group into a passage if passage text/image is present ──
        let passageKey: string | null = null;
        if (raw.passageText || raw.passageImageUrl) {
          const dedupeKey = [
            examType,
            subject,
            raw.passageText?.trim() ?? '',
            raw.passageImageUrl?.trim() ?? '',
          ].join('|');

          if (!passages.has(dedupeKey)) {
            passages.set(dedupeKey, {
              key: dedupeKey,
              examType,
              subject,
              year,
              title: raw.passageTitle || `Passage ${passages.size + 1}`,
              instructions: raw.passageInstructions || null,
              passageText: raw.passageText || null,
              passageImageUrl: raw.passageImageUrl || null,
            });
          }
          passageKey = dedupeKey;
        }

        const dto = new CreateQuestionDto();
        dto.questionNumber = raw.questionNumber || undefined;
        dto.examType = examType;
        dto.candidateType = candidateType;
        dto.subject = subject;
        dto.year = year;
        dto.questionText = raw.questionText;
        dto.questionImageUrl = raw.questionImageUrl || null;
        dto.difficulty = difficulty;
        dto.type = type;
        dto.topic = raw.topic || null;
        dto.isActive = false; // imported questions land as drafts for review

        if (raw.maxScore) dto.maxScore = parseInt(raw.maxScore, 10);
        if (raw.modelAnswer) dto.modelAnswer = raw.modelAnswer;

        // Essay/theory structure (custom numbering, sub-questions, marks,
        // tables, images). Harmless if present on an MCQ row — it just
        // won't be read anywhere.
        if (raw.structure) {
          try {
            dto.structure = JSON.parse(raw.structure);
          } catch {
            throw new Error(
              'Invalid "structure" column — must be JSON (an EssayPart[] array). Use the essay JSON template instead of hand-editing this in a spreadsheet.',
            );
          }
        }

        if (MCQ_TYPES.has(type)) {
          const optionEntries: [
            string,
            string | undefined,
            string | undefined,
          ][] = [
            ['A', raw.optionA, raw.optionAImage],
            ['B', raw.optionB, raw.optionBImage],
            ['C', raw.optionC, raw.optionCImage],
            ['D', raw.optionD, raw.optionDImage],
          ];
          const options = optionEntries
            .filter(([, text]) => !!text)
            .map(([label, text, imageUrl], order) => ({
              label,
              text: text as string,
              imageUrl: imageUrl || null,
              order,
            }));

          if (options.length < 2) {
            throw new Error(
              'MCQ rows need at least optionA and optionB filled in',
            );
          }
          dto.options = options;

          if (!raw.correctLabel) {
            throw new Error('MCQ rows need correctLabel (A/B/C/D)');
          }
          const label = raw.correctLabel.trim().toUpperCase();
          if (!options.some((o) => o.label === label)) {
            throw new Error(
              `correctLabel "${label}" doesn't match any filled option column`,
            );
          }
          dto.answer = { correctLabel: label };
        }

        if (raw.explanation) {
          dto.explanations = [
            {
              text: raw.explanation,
              imageUrl: raw.explanationImageUrl || null,
              videoUrl: null,
            },
          ];
        }

        rows.push({ rowNumber, dto, passageKey });
      } catch (err: any) {
        rowErrors.push({
          row: rowNumber,
          reason: err?.message ?? 'Invalid row',
        });
      }
    });

    return { passages: Array.from(passages.values()), rows, rowErrors };
  }

  // ── JSON alternative — full-fidelity, no column-mapping guesswork ──────

  parseJson(text: string): {
    defaults?: BulkImportDefaults;
    passages?: Record<string, any>[];
    questions?: (Record<string, any> & { passageKey?: string })[];
  } {
    try {
      const parsed = JSON.parse(text);
      if (!parsed || typeof parsed !== 'object') {
        throw new Error('Root must be a JSON object');
      }
      return parsed;
    } catch (err: any) {
      throw new BadRequestException(`Invalid JSON file: ${err.message}`);
    }
  }
}

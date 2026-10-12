import { IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateQuestionDto } from './create-question.dto';

export class BulkImportDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateQuestionDto)
  questions!: CreateQuestionDto[];
}

export interface BulkImportResult {
  imported: number;
  failed: number;
  errors: { row: number; reason: string }[];
  passagesCreated?: number;
  dryRun?: boolean;
  // Total rows that passed validation and would be imported on a real
  // commit — NOT the same as preview.length, which is capped to 10 rows
  // for display. `imported` stays 0 on a dry run (nothing was actually
  // written), so the frontend needs this separate count to tell "clean
  // file, nothing to show yet" apart from "nothing would import at all".
  wouldImport?: number;
  preview?: unknown[];
}

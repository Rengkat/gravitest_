import { Type } from 'class-transformer';
import {
  IsArray,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  Min,
  ValidateNested,
} from 'class-validator';

// Self-referencing DTO — class-validator/class-transformer handle this
// fine as long as @Type(() => EssayPartDto) points back at the class
// itself, same trick used for recursive comment trees etc.
export class EssayPartDto {
  @IsString()
  @IsNotEmpty()
  label!: string; // "1", "(a)", "(i)", "Section A" — free text, admin-authored

  @IsOptional()
  @IsString()
  text?: string | null;

  @IsOptional()
  @IsUrl()
  imageUrl?: string | null;

  // Array of rows, each row an array of cell strings. Validated loosely
  // (just "is an array") — this is admin-authored content going into a
  // fixed-shape renderer, not user input that needs strict shape checks.
  @IsOptional()
  @IsArray()
  table?: string[][] | null;

  @IsOptional()
  @IsInt()
  @Min(0)
  maxScore?: number | null;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EssayPartDto)
  children?: EssayPartDto[];
}

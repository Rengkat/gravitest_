import { PartialType } from '@nestjs/mapped-types';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { KarmenZone } from '../entities/karmen-case.entity';

export class CreateKarmenCaseDto {
  @IsString()
  name!: string;

  @IsString()
  capital!: string;

  @IsEnum(KarmenZone)
  zone!: KarmenZone;

  @IsString()
  slogan!: string;

  @IsString()
  minerals!: string;

  @IsString()
  notable!: string;

  @IsString()
  clueCulture!: string;

  @IsString()
  clueFood!: string;

  @IsString()
  clueLandmark!: string;

  @IsString()
  clueLanguage!: string;

  @IsString()
  clueMineral!: string;

  @IsString()
  extraHint!: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateKarmenCaseDto extends PartialType(CreateKarmenCaseDto) {}

export class CreateKarmenInterrogationDto {
  @IsString()
  question!: string;

  @ArrayMinSize(4)
  @ArrayMaxSize(4)
  @IsString({ each: true })
  options!: string[];

  @IsInt()
  @Min(0)
  @Max(3)
  correctIndex!: number;

  @IsString()
  witnessName!: string;

  @IsString()
  witnessRole!: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateKarmenInterrogationDto extends PartialType(CreateKarmenInterrogationDto) {}

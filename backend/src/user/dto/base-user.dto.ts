import {
  IsEmail,
  IsString,
  IsOptional,
  IsEnum,
  IsDate,
  IsUrl,
  IsNotEmpty,
  MaxLength,
  Matches,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { Gender, NigerianState, UserRole } from 'src/common/enums/enums';
import { normalizeEmail, trimString } from 'src/common/transforms/transforms';

/**
 * BaseUserDto — shared fields across all user creation DTOs.
 * Never used directly — only extended by role-specific DTOs.
 *
 * Rule: Only put fields here that are common to ALL roles.
 *       Role-specific fields go in student.dto.ts etc.
 */
export abstract class BaseUserDto {
  @ApiProperty({ example: 'Adaeze' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  @Transform(trimString)
  firstName!: string;

  @ApiProperty({ example: 'Okonkwo' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  @Transform(trimString)
  lastName!: string;

  @ApiPropertyOptional({ example: 'Chiamaka' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  @Transform(trimString)
  middleName?: string;

  @ApiProperty({ example: 'adaeze@example.com' })
  @IsEmail({}, { message: 'Provide a valid email address' })
  @Transform(normalizeEmail)
  email!: string;

  @ApiPropertyOptional({ example: '+2348012345678' })
  @IsOptional()
  @Matches(/^\+234[0-9]{10}$/, {
    message: 'Phone must be a valid Nigerian number: +234XXXXXXXXXX',
  })
  phoneNumber?: string;

  @ApiPropertyOptional({
    example: 'https://res.cloudinary.com/gravitest/avatar.jpg',
  })
  @IsOptional()
  @IsUrl({}, { message: 'Avatar must be a valid URL' })
  avatar?: string;

  @ApiPropertyOptional({
    type: String,
    format: 'date',
    example: '2000-08-14',
    description: 'ISO 8601 date string — transformed to Date object',
  })
  @IsOptional()
  @IsDate({ message: 'dateOfBirth must be a valid date' })
  @Type(() => Date)
  dateOfBirth?: Date;

  @ApiPropertyOptional({ enum: Gender })
  @IsOptional()
  @IsEnum(Gender)
  gender?: Gender;

  @ApiPropertyOptional({
    enum: NigerianState,
    description: 'Current state of residence',
  })
  @IsOptional()
  @IsEnum(NigerianState)
  stateOfResidence?: NigerianState;

  @ApiPropertyOptional({ example: 'Surulere' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  lga?: string;
}

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Exclude } from 'class-transformer';
import {
  Gender,
  NigerianState,
  SubscriptionTier,
  UserRole,
} from 'src/common/enums/enums';

/**
 * UserResponseDto — the shape returned in every API response.
 *
 * Rules:
 *  - Never include passwordHash, otpCode, refreshToken, or resetToken
 *  - Use @Expose() + ClassSerializerInterceptor to strip @Exclude() fields
 *  - Extend this for role-specific responses (StudentResponseDto etc.)
 */
@Exclude()
export class UserResponseDto {
  @Expose()
  @ApiProperty({ example: 'uuid-v4' })
  id!: string;

  @Expose()
  @ApiProperty({ example: 'Adaeze' })
  firstName!: string;

  @Expose()
  @ApiProperty({ example: 'Okonkwo' })
  lastName!: string;

  @Expose()
  @ApiPropertyOptional({ example: 'Chiamaka' })
  middleName?: string | null;

  /** Computed from firstName + middleName + lastName */
  @Expose()
  @ApiProperty({ example: 'Adaeze Chiamaka Okonkwo' })
  get fullName(): string {
    return [this.firstName, this.middleName, this.lastName]
      .filter(Boolean)
      .join(' ');
  }

  @Expose()
  @ApiProperty({ example: 'adaeze@example.com' })
  email!: string;

  @Expose()
  @ApiPropertyOptional({ example: '+2348012345678' })
  phoneNumber?: string;

  @Expose()
  @ApiProperty({ enum: UserRole })
  role!: UserRole;

  @Expose()
  @ApiProperty({
    example: 'local',
    description: 'How this account authenticates — local, google, or facebook',
  })
  authProvider!: string;

  @Expose()
  @ApiProperty({ example: true })
  isActive!: boolean;

  @Expose()
  @ApiProperty({ example: true })
  isEmailVerified!: boolean;

  @Expose()
  @ApiProperty({ example: false })
  isPhoneVerified!: boolean;

  @Expose()
  @ApiProperty({
    example: false,
    description:
      'Whether the student has finished the post-verification profile ' +
      'wizard (personal/academic/exam details). Frontend should route to ' +
      '/complete-registration while this is false.',
  })
  isOnboarded!: boolean;

  @Expose()
  @ApiPropertyOptional({
    example: 'https://res.cloudinary.com/gravitest/avatar.jpg',
  })
  avatarUrl?: string;

  @Expose()
  @ApiPropertyOptional({ example: '2000-08-14T00:00:00.000Z' })
  dateOfBirth?: Date;

  @Expose()
  @ApiPropertyOptional({ enum: Gender })
  gender?: Gender;

  @Expose()
  @ApiPropertyOptional({ enum: NigerianState })
  stateOfResidence?: NigerianState;

  @Expose()
  @ApiPropertyOptional({ example: 'Surulere' })
  lga?: string;

  @Expose()
  @ApiPropertyOptional({
    example: 'Aspiring Computer Scientist preparing for JAMB and WAEC.',
  })
  bio?: string | null;

  @Expose()
  @ApiPropertyOptional()
  lastLoginAt?: Date;

  @Expose()
  @ApiProperty()
  createdAt!: Date;

  @Expose()
  @ApiProperty()
  updatedAt!: Date;
}

/**
 * UserSummaryDto — lightweight version for lists and dropdowns.
 * Use this instead of UserResponseDto wherever you don't need all fields.
 */
export class UserSummaryDto {
  @ApiProperty() id!: string;
  @ApiProperty() firstName!: string;
  @ApiProperty() lastName!: string;
  @ApiProperty() email!: string;
  @ApiPropertyOptional() avatarUrl?: string;
  @ApiProperty({ enum: UserRole }) role!: UserRole;
  @ApiProperty() isActive!: boolean;
}

export class CreateUserResponseDto {
  @ApiProperty({ type: () => UserResponseDto })
  user!: UserResponseDto;

  @ApiPropertyOptional({
    example: 'Gravitest@2026xR3!mQ',
    description:
      'Only returned when no password was supplied at creation. ' +
      'Share this with the student — it is never stored in plaintext.',
  })
  temporaryPassword?: string;

  @ApiPropertyOptional({
    example:
      'User created. A verification code has been emailed to them — they must verify before they can log in.',
    description: 'What happened re: email verification / notification for this user.',
  })
  message?: string;
}

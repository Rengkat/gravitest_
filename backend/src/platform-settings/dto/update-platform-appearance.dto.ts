import { IsString, Matches } from 'class-validator';

export class UpdatePlatformAppearanceDto {
  // Exactly six hex digits — the client generates the full shade scale
  // (50–900) from this one value, so shorthand (#fff) and alpha (#rrggbbaa)
  // forms are rejected instead of guessed at.
  @IsString()
  @Matches(/^#[0-9A-Fa-f]{6}$/, {
    message: 'accentColor must be a 6-digit hex colour such as #2E8B57',
  })
  accentColor!: string;
}

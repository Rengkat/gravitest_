import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsInt, IsPositive, IsString, MinLength } from 'class-validator';
import type { LibraryStorageFolder } from '../storage.service';

const FOLDERS: LibraryStorageFolder[] = [
  'thumbnails',
  'ebooks',
  'documents',
  'videos',
  'reports',
  'question-images',
];

export class PresignUploadDto {
  @ApiProperty({ example: 'waec-physics-mechanics.mp4' })
  @IsString()
  @MinLength(1)
  fileName: string;

  @ApiProperty({ example: 'video/mp4' })
  @IsString()
  @MinLength(1)
  contentType: string;

  @ApiProperty({ enum: FOLDERS, example: 'videos' })
  @IsIn(FOLDERS)
  folder: LibraryStorageFolder;

  @ApiProperty({
    example: 52428800,
    description:
      'Exact file size in bytes. Required — it is baked into the signed PUT request (Content-Length) so R2 rejects any upload that does not match, and is checked server-side against the per-folder size cap before a URL is even issued.',
  })
  @IsInt()
  @IsPositive()
  sizeBytes: number;
}

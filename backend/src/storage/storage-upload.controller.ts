import {
  Controller,
  Post,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  Delete,
  Query,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { UserRole } from 'src/common/enums/enums';
import { StorageService } from './storage.service';
import type { LibraryStorageFolder } from './storage.service';
import { InvalidUploadError } from './storage.service';
import { PresignUploadDto } from './dto/presign-upload.dto';

// Small files (thumbnails, cover images, PDFs under ~10MB) go through this
// server; large videos should use POST /storage/presign-upload and PUT
// directly to R2 from the admin dashboard so we don't proxy gigabytes
// through Node.
const DIRECT_UPLOAD_MAX_BYTES = 15 * 1024 * 1024; // 15MB

@ApiTags('Storage')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('storage')
export class StorageUploadController {
  constructor(private readonly storageService: StorageService) {}

  @Post('upload')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @UseInterceptors(
    FileInterceptor('file', { limits: { fileSize: DIRECT_UPLOAD_MAX_BYTES } }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
        folder: {
          type: 'string',
          enum: [
            'thumbnails',
            'ebooks',
            'documents',
            'videos',
            'reports',
            'question-images',
          ],
        },
      },
    },
  })
  @ApiOperation({
    summary: '[Admin] Direct upload (thumbnails/ebooks/documents ≤ 15MB)',
    description:
      'For videos or anything larger, use POST /storage/presign-upload instead and PUT the file straight to R2 from the browser.',
  })
  async upload(
    @UploadedFile() file: Express.Multer.File,
    @Body('folder') folder: LibraryStorageFolder,
  ) {
    if (!file) throw new BadRequestException('No file provided');
    const allowed: LibraryStorageFolder[] = [
      'thumbnails',
      'ebooks',
      'documents',
      'videos',
      'reports',
      'question-images',
    ];
    if (!allowed.includes(folder)) {
      throw new BadRequestException(
        `folder must be one of: ${allowed.join(', ')}`,
      );
    }

    try {
      return await this.storageService.uploadBuffer({
        folder,
        originalName: file.originalname,
        buffer: file.buffer,
        contentType: file.mimetype,
      });
    } catch (err) {
      if (err instanceof InvalidUploadError)
        throw new BadRequestException(err.message);
      throw err;
    }
  }

  @Post('presign-upload')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({
    summary: '[Admin] Get a presigned R2 upload URL for large files',
    description:
      'Client PUTs the raw file bytes to `uploadUrl` with header Content-Type matching what was requested, ' +
      'and a Content-Length header matching sizeBytes exactly (R2 rejects a mismatch). ' +
      'Once the PUT succeeds, save `publicUrl` (or `key`, for gated content) on the LibraryContent record.',
  })
  async presignUpload(@Body() dto: PresignUploadDto) {
    try {
      return await this.storageService.getPresignedUploadUrl({
        folder: dto.folder,
        originalName: dto.fileName,
        contentType: dto.contentType,
        sizeBytes: dto.sizeBytes,
      });
    } catch (err) {
      if (err instanceof InvalidUploadError)
        throw new BadRequestException(err.message);
      throw err;
    }
  }

  @Delete('object')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: '[Admin] Delete an object from R2 by key' })
  async deleteObject(@Query('key') key: string) {
    if (!key) throw new BadRequestException('key query param is required');
    await this.storageService.deleteObject(key);
    return { deleted: true, key };
  }
}

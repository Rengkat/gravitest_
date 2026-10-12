import { Inject, Injectable, Logger } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { nanoid } from 'nanoid';
import storageConfig from 'src/config/storageConfig';

export type LibraryStorageFolder =
  | 'videos'
  | 'ebooks'
  | 'documents'
  | 'thumbnails'
  | 'reports'
  | 'avatars'
  | 'question-images'
  | 'previews';

export interface UploadResult {
  key: string;
  url: string; // public URL if bucket/prefix is public, otherwise same as key path
  sizeBytes: number;
  contentType: string;
}

// Server-side allowlist — this is the actual security boundary. Never trust
// the client-declared contentType/folder pairing without checking it here,
// since both the direct multipart upload and the presigned-URL request are
// otherwise just "admin says trust me". A compromised/malicious admin
// session (or a bug in the frontend picker) could otherwise stash an
// .html/.svg/.exe behind a "videos" or "thumbnails" key and have it served
// from your public R2 domain.
const ALLOWED_MIME_TYPES: Record<LibraryStorageFolder, string[]> = {
  videos: ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-matroska'],
  ebooks: ['application/pdf', 'application/epub+zip'],
  documents: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ],
  thumbnails: ['image/jpeg', 'image/png', 'image/webp'],
  reports: ['application/pdf'],
  avatars: ['image/jpeg', 'image/png', 'image/webp'],
  // Question/option/explanation/passage images from the admin question
  // editor. Same allowlist as thumbnails/avatars — this is the folder
  // the "Required Fixes" doc's image-upload items (3 & 4) post to.
  'question-images': ['image/jpeg', 'image/png', 'image/webp'],
  // Server-generated free previews (LibraryPreviewProcessor) — a short
  // re-encoded clip for video/audio, or a page-truncated copy for PDFs.
  // Never client-uploaded, but validated the same way everything else
  // going through uploadBuffer() is.
  previews: ['video/mp4', 'audio/mp4', 'application/pdf'],
};

const MAX_BYTES_PER_FOLDER: Record<LibraryStorageFolder, number> = {
  videos: 2 * 1024 * 1024 * 1024, // 2GB
  ebooks: 100 * 1024 * 1024, // 100MB
  documents: 50 * 1024 * 1024, // 50MB
  thumbnails: 10 * 1024 * 1024, // 10MB
  reports: 50 * 1024 * 1024, // 50MB
  avatars: 5 * 1024 * 1024, // 5MB — any authenticated user can hit this endpoint, keep it tight
  'question-images': 5 * 1024 * 1024, // 5MB — diagrams/photos in questions, options, explanations, passages
  // A ~90s re-encoded clip at a modest bitrate, or a 2-5 page PDF excerpt,
  // should never legitimately be this big — a generous ceiling that still
  // catches a runaway/misconfigured preview job before it lands in R2.
  previews: 150 * 1024 * 1024, // 150MB
};

export class InvalidUploadError extends Error {}

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly client: S3Client;

  constructor(
    @Inject(storageConfig.KEY)
    private readonly conf: ConfigType<typeof storageConfig>,
  ) {
    // credentials can be blank in local/dev before R2 is provisioned —
    // the client still constructs fine, calls will just fail loudly,
    // which is preferable to crashing app bootstrap.
    this.client = new S3Client({
      region: 'auto',
      endpoint: this.conf.endpoint || undefined,
      credentials: {
        accessKeyId: this.conf.accessKeyId,
        secretAccessKey: this.conf.secretAccessKey,
      },
      // R2 is S3-*compatible*, not S3 itself — recent AWS SDK v3 versions
      // (this project is on 3.1108, well past the change) default to
      // adding an x-amz-checksum-crc32 header/trailer to every upload,
      // which R2 doesn't handle the same way S3 does and rejects with a
      // checksum-mismatch error. This is a widely-hit, well-documented
      // R2 gotcha (see Cloudflare's own R2 + AWS SDK docs) that would
      // otherwise break every upload through this service — both the
      // direct PutObjectCommand path and presigned PUT URLs, since the
      // checksum requirement is baked into the client config the
      // presigned URL is generated from, not just direct calls.
      requestChecksumCalculation: 'WHEN_REQUIRED',
      responseChecksumValidation: 'WHEN_REQUIRED',
    });
  }

  /**
   * Throws InvalidUploadError if the folder/contentType/size combination
   * isn't allowed. Callers (controller) should catch and translate to a
   * BadRequestException.
   */
  validateUpload(params: {
    folder: LibraryStorageFolder;
    contentType: string;
    sizeBytes?: number;
  }): void {
    const allowed = ALLOWED_MIME_TYPES[params.folder];
    if (!allowed) {
      throw new InvalidUploadError(`Unknown folder "${params.folder}"`);
    }
    if (!allowed.includes(params.contentType.toLowerCase())) {
      throw new InvalidUploadError(
        `Content-Type "${params.contentType}" is not allowed for folder "${params.folder}". Allowed: ${allowed.join(', ')}`,
      );
    }
    const maxBytes = MAX_BYTES_PER_FOLDER[params.folder];
    if (params.sizeBytes != null && params.sizeBytes > maxBytes) {
      throw new InvalidUploadError(
        `File is ${(params.sizeBytes / 1024 / 1024).toFixed(1)}MB, which exceeds the ${(maxBytes / 1024 / 1024).toFixed(0)}MB limit for folder "${params.folder}"`,
      );
    }
    if (params.sizeBytes != null && params.sizeBytes <= 0) {
      throw new InvalidUploadError('File size must be greater than 0 bytes');
    }
  }

  private buildKey(folder: LibraryStorageFolder, originalName: string): string {
    // Strip any path components and reject traversal — originalName is
    // client-controlled input.
    const baseName = originalName.replace(/^.*[\\/]/, '');
    const ext = baseName.includes('.') ? baseName.split('.').pop() : undefined;
    const safeExt = ext
      ? `.${ext.toLowerCase().replace(/[^a-z0-9]/g, '')}`
      : '';
    return `${folder}/${new Date().getUTCFullYear()}/${nanoid(16)}${safeExt}`;
  }

  private publicUrlFor(key: string): string {
    if (!this.conf.publicBaseUrl) return key;
    return `${this.conf.publicBaseUrl.replace(/\/$/, '')}/${key}`;
  }

  async uploadBuffer(params: {
    folder: LibraryStorageFolder;
    originalName: string;
    buffer: Buffer;
    contentType: string;
  }): Promise<UploadResult> {
    this.validateUpload({
      folder: params.folder,
      contentType: params.contentType,
      sizeBytes: params.buffer.length,
    });

    const key = this.buildKey(params.folder, params.originalName);

    await this.client.send(
      new PutObjectCommand({
        Bucket: this.conf.bucket,
        Key: key,
        Body: params.buffer,
        ContentType: params.contentType,
      }),
    );

    this.logger.log(
      `Uploaded ${key} (${params.buffer.length} bytes) to R2 bucket ${this.conf.bucket}`,
    );

    return {
      key,
      url: this.publicUrlFor(key),
      sizeBytes: params.buffer.length,
      contentType: params.contentType,
    };
  }

  /**
   * Signed PUT URL so the client (admin dashboard) can upload large
   * files (videos) directly to R2 without proxying bytes through the
   * NestJS server — avoids body-size limits and doubles upload speed.
   *
   * Content-Length is baked into the signed request: R2/S3 will reject the
   * PUT if the client sends a different Content-Length header than what
   * was signed here, which is what actually enforces the size cap for a
   * presigned URL (we can't inspect bytes we never receive).
   */
  async getPresignedUploadUrl(params: {
    folder: LibraryStorageFolder;
    originalName: string;
    contentType: string;
    sizeBytes: number;
  }): Promise<{
    key: string;
    uploadUrl: string;
    publicUrl: string;
    expiresIn: number;
  }> {
    this.validateUpload({
      folder: params.folder,
      contentType: params.contentType,
      sizeBytes: params.sizeBytes,
    });

    const key = this.buildKey(params.folder, params.originalName);
    const command = new PutObjectCommand({
      Bucket: this.conf.bucket,
      Key: key,
      ContentType: params.contentType,
      ContentLength: params.sizeBytes,
    });
    const uploadUrl = await getSignedUrl(this.client, command, {
      expiresIn: this.conf.signedUrlTtlSeconds,
    });

    return {
      key,
      uploadUrl,
      publicUrl: this.publicUrlFor(key),
      expiresIn: this.conf.signedUrlTtlSeconds,
    };
  }

  /**
   * Signed GET URL for gated content (tier/purchase-locked) so we never
   * expose a permanently-public link for paid material.
   */
  async getPresignedDownloadUrl(key: string): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.conf.bucket,
      Key: key,
    });
    return getSignedUrl(this.client, command, {
      expiresIn: this.conf.signedUrlTtlSeconds,
    });
  }

  async exists(key: string): Promise<boolean> {
    try {
      await this.client.send(
        new HeadObjectCommand({ Bucket: this.conf.bucket, Key: key }),
      );
      return true;
    } catch {
      return false;
    }
  }

  async deleteObject(key: string): Promise<void> {
    await this.client.send(
      new DeleteObjectCommand({ Bucket: this.conf.bucket, Key: key }),
    );
  }

  /** Extracts the R2 object key back out of a stored public URL, if applicable. */
  keyFromPublicUrl(url: string): string | null {
    if (!this.conf.publicBaseUrl || !url.startsWith(this.conf.publicBaseUrl))
      return null;
    return url.slice(this.conf.publicBaseUrl.replace(/\/$/, '').length + 1);
  }
}

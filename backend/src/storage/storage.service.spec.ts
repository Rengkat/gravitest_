import { Test, TestingModule } from '@nestjs/testing';
import { StorageService, InvalidUploadError } from './storage.service';
import storageConfig from 'src/config/storageConfig';

describe('StorageService.validateUpload', () => {
  let service: StorageService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StorageService,
        {
          provide: storageConfig.KEY,
          useValue: {
            endpoint: 'https://example.r2.cloudflarestorage.com',
            accessKeyId: 'test-key',
            secretAccessKey: 'test-secret',
            bucket: 'test-bucket',
            publicBaseUrl: 'https://cdn.example.com',
            signedUrlTtlSeconds: 900,
          },
        },
      ],
    }).compile();

    service = module.get(StorageService);
  });

  it('accepts a valid contentType/folder/size combination', () => {
    expect(() =>
      service.validateUpload({ folder: 'thumbnails', contentType: 'image/png', sizeBytes: 1024 }),
    ).not.toThrow();
  });

  it('rejects an unknown folder', () => {
    expect(() =>
      service.validateUpload({ folder: 'not-a-real-folder' as any, contentType: 'image/png' }),
    ).toThrow(InvalidUploadError);
  });

  it('rejects a contentType not allowed for the given folder — the actual security boundary', () => {
    // An .html/.svg-as-image trick: this is exactly the bypass attempt the
    // allowlist exists to stop (see the comment on ALLOWED_MIME_TYPES).
    expect(() =>
      service.validateUpload({ folder: 'thumbnails', contentType: 'text/html', sizeBytes: 100 }),
    ).toThrow(InvalidUploadError);
  });

  it('rejects a video MIME type for the avatars folder even though both accept images-ish content', () => {
    expect(() =>
      service.validateUpload({ folder: 'avatars', contentType: 'video/mp4', sizeBytes: 1024 }),
    ).toThrow(InvalidUploadError);
  });

  it('rejects a file over the per-folder size cap', () => {
    const oneByteOverLimit = 5 * 1024 * 1024 + 1; // avatars cap is exactly 5MB
    expect(() =>
      service.validateUpload({ folder: 'avatars', contentType: 'image/jpeg', sizeBytes: oneByteOverLimit }),
    ).toThrow(InvalidUploadError);
  });

  it('accepts a file exactly at the size cap (boundary is inclusive)', () => {
    const exactlyAtLimit = 5 * 1024 * 1024;
    expect(() =>
      service.validateUpload({ folder: 'avatars', contentType: 'image/jpeg', sizeBytes: exactlyAtLimit }),
    ).not.toThrow();
  });

  it('rejects zero and negative sizes', () => {
    expect(() =>
      service.validateUpload({ folder: 'avatars', contentType: 'image/jpeg', sizeBytes: 0 }),
    ).toThrow(InvalidUploadError);
    expect(() =>
      service.validateUpload({ folder: 'avatars', contentType: 'image/jpeg', sizeBytes: -5 }),
    ).toThrow(InvalidUploadError);
  });

  it('skips the size check entirely when sizeBytes is omitted (used for the direct-upload buffer path, checked separately)', () => {
    expect(() =>
      service.validateUpload({ folder: 'thumbnails', contentType: 'image/png' }),
    ).not.toThrow();
  });

  it('is case-insensitive on the content type', () => {
    expect(() =>
      service.validateUpload({ folder: 'thumbnails', contentType: 'IMAGE/PNG', sizeBytes: 100 }),
    ).not.toThrow();
  });

  it('allows a video within the 2GB videos cap', () => {
    expect(() =>
      service.validateUpload({
        folder: 'videos',
        contentType: 'video/mp4',
        sizeBytes: 1.5 * 1024 * 1024 * 1024,
      }),
    ).not.toThrow();
  });

  it('rejects a video over the 2GB videos cap', () => {
    expect(() =>
      service.validateUpload({
        folder: 'videos',
        contentType: 'video/mp4',
        sizeBytes: 2.5 * 1024 * 1024 * 1024,
      }),
    ).toThrow(InvalidUploadError);
  });
});

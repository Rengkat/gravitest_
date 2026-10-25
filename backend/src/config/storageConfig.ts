import { registerAs } from '@nestjs/config';

export default registerAs('storage', () => {
  const accountId = process.env.R2_ACCOUNT_ID || '';
  return {
    accountId,
    accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
    bucket: process.env.R2_BUCKET || 'gravitest-library',
    // Custom domain (recommended) or the bucket's r2.dev public URL, no
    // trailing slash. Used to build the fileUrl/thumbnailUrl saved on
    // LibraryContent when content is public/free.
    publicBaseUrl: process.env.R2_PUBLIC_BASE_URL || '',
    // Signed URLs for gated (tier/purchase-locked) content expire after
    // this many seconds — long enough to stream a video, short enough
    // that a leaked link goes stale.
    signedUrlTtlSeconds: parseInt(process.env.R2_SIGNED_URL_TTL || '3600', 10),
    endpoint: accountId ? `https://${accountId}.r2.cloudflarestorage.com` : '',
  };
});

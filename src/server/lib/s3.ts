// S3 presigned URL helpers
// For MVP: mock presigned URLs when no S3 credentials are configured

const S3_CONFIGURED = !!(
  process.env.S3_REGION &&
  process.env.S3_ACCESS_KEY_ID &&
  process.env.S3_SECRET_ACCESS_KEY &&
  process.env.S3_BUCKET
);

export function buildS3Key(
  tenantId: string,
  artworkId: string,
  versionNumber: number,
  fileName: string
): string {
  return `artwork/${tenantId}/${artworkId}/v${versionNumber}/${fileName}`;
}

export function buildThumbnailKey(
  tenantId: string,
  artworkId: string,
  versionNumber: number
): string {
  return `artwork/${tenantId}/${artworkId}/v${versionNumber}/thumb.jpg`;
}

export async function getPresignedUploadUrl(
  key: string,
  contentType: string
): Promise<string> {
  if (!S3_CONFIGURED) {
    // Mock presigned URL for development
    return `https://mock-s3.example.com/upload?key=${encodeURIComponent(key)}&contentType=${encodeURIComponent(contentType)}`;
  }

  // Real S3 implementation would go here
  // const { S3Client, PutObjectCommand } = await import("@aws-sdk/client-s3");
  // const { getSignedUrl } = await import("@aws-sdk/s3-request-presigner");
  return `https://${process.env.S3_BUCKET}.s3.${process.env.S3_REGION}.amazonaws.com/${key}`;
}

export function getPublicUrl(key: string): string {
  if (process.env.CDN_URL) {
    return `${process.env.CDN_URL}/${key}`;
  }
  if (S3_CONFIGURED) {
    return `https://${process.env.S3_BUCKET}.s3.${process.env.S3_REGION}.amazonaws.com/${key}`;
  }
  // Mock URL for development
  return `https://mock-s3.example.com/${key}`;
}

// Artwork object-key helpers. Storage itself (R2 or local disk) lives in
// storage.ts; files are uploaded via POST /api/files/upload and served via
// /api/files/serve.

import { serveUrl } from "./storage";

function sanitizeFileName(fileName: string): string {
  return fileName.replace(/[^a-zA-Z0-9._-]+/g, "_");
}

export function buildS3Key(
  tenantId: string,
  artworkId: string,
  versionNumber: number,
  fileName: string
): string {
  return `artwork/${tenantId}/${artworkId}/v${versionNumber}/${sanitizeFileName(fileName)}`;
}

export function buildThumbnailKey(
  tenantId: string,
  artworkId: string,
  versionNumber: number
): string {
  return `artwork/${tenantId}/${artworkId}/v${versionNumber}/thumb.jpg`;
}

export function getPublicUrl(key: string): string {
  return serveUrl(key);
}

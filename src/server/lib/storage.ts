import { readFile, writeFile, mkdir } from "fs/promises";
import path from "path";

/**
 * Unified file storage.
 *
 * When S3_ENDPOINT + S3_ACCESS_KEY_ID + S3_SECRET_ACCESS_KEY + S3_BUCKET are
 * set, objects are stored in an S3-compatible bucket (Cloudflare R2 in
 * production). Otherwise files fall back to local disk (./.uploads) for
 * development. Files are always served through /api/files/serve so the
 * bucket never needs to be public.
 */

const LOCAL_UPLOAD_DIR = path.join(process.cwd(), ".uploads");

export function isRemoteStorageConfigured(): boolean {
  return !!(
    process.env.S3_ENDPOINT &&
    process.env.S3_ACCESS_KEY_ID &&
    process.env.S3_SECRET_ACCESS_KEY &&
    process.env.S3_BUCKET
  );
}

let s3Client: import("@aws-sdk/client-s3").S3Client | null = null;

async function getS3Client() {
  if (!s3Client) {
    const { S3Client } = await import("@aws-sdk/client-s3");
    s3Client = new S3Client({
      region: process.env.S3_REGION || "auto",
      endpoint: process.env.S3_ENDPOINT,
      credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY_ID!,
        secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
      },
      forcePathStyle: true,
    });
  }
  return s3Client;
}

/** Rejects path traversal and absolute keys. Returns the normalized key. */
export function sanitizeKey(key: string): string | null {
  const normalized = path.posix.normalize(key);
  if (normalized.includes("..") || normalized.startsWith("/") || normalized.length === 0) {
    return null;
  }
  return normalized;
}

export async function putObject(
  key: string,
  body: Buffer,
  contentType: string
): Promise<void> {
  if (isRemoteStorageConfigured()) {
    const { PutObjectCommand } = await import("@aws-sdk/client-s3");
    const client = await getS3Client();
    await client.send(
      new PutObjectCommand({
        Bucket: process.env.S3_BUCKET!,
        Key: key,
        Body: body,
        ContentType: contentType,
      })
    );
    return;
  }

  const filePath = path.join(LOCAL_UPLOAD_DIR, key);
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, body);
}

export async function getObject(
  key: string
): Promise<{ body: Buffer; contentType: string } | null> {
  if (isRemoteStorageConfigured()) {
    const { GetObjectCommand, NoSuchKey } = await import("@aws-sdk/client-s3");
    const client = await getS3Client();
    try {
      const res = await client.send(
        new GetObjectCommand({
          Bucket: process.env.S3_BUCKET!,
          Key: key,
        })
      );
      const bytes = await res.Body!.transformToByteArray();
      return {
        body: Buffer.from(bytes),
        contentType: res.ContentType ?? guessContentType(key),
      };
    } catch (err) {
      if (err instanceof NoSuchKey || (err as any)?.name === "NoSuchKey") return null;
      throw err;
    }
  }

  const filePath = path.join(LOCAL_UPLOAD_DIR, key);
  try {
    const body = await readFile(filePath);
    return { body, contentType: guessContentType(key) };
  } catch {
    return null;
  }
}

/** URL a browser can load the object from (proxied through our API). */
export function serveUrl(key: string): string {
  if (process.env.CDN_URL) {
    return `${process.env.CDN_URL}/${key}`;
  }
  return `/api/files/serve?key=${encodeURIComponent(key)}`;
}

const MIME_MAP: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".pdf": "application/pdf",
  ".ai": "application/postscript",
  ".eps": "application/postscript",
  ".psd": "image/vnd.adobe.photoshop",
};

function guessContentType(key: string): string {
  const ext = path.extname(key).toLowerCase();
  return MIME_MAP[ext] ?? "application/octet-stream";
}

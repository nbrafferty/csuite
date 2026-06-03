import { NextRequest, NextResponse } from "next/server";
import { readFile, stat } from "fs/promises";
import path from "path";

export const runtime = "nodejs";

export const dynamic = "force-dynamic";

const UPLOAD_DIR = path.join(process.cwd(), ".uploads");

const MIME_MAP: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".pdf": "application/pdf",
};

export async function GET(req: NextRequest) {
  const key = req.nextUrl.searchParams.get("key");
  if (!key) {
    return NextResponse.json({ error: "key required" }, { status: 400 });
  }

  const normalized = path.normalize(key);
  if (normalized.includes("..")) {
    return NextResponse.json({ error: "invalid key" }, { status: 400 });
  }

  const filePath = path.join(UPLOAD_DIR, normalized);
  try {
    await stat(filePath);
  } catch {
    return NextResponse.json(
      { error: "not found", path: filePath, key },
      { status: 404 },
    );
  }

  const buffer = await readFile(filePath);
  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_MAP[ext] ?? "application/octet-stream";

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}

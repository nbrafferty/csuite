import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/server/auth/auth";
import { putObject, sanitizeKey, serveUrl } from "@/server/lib/storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_FILE_BYTES = 50 * 1024 * 1024; // 50 MB

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const rawKey = (formData.get("key") ?? formData.get("s3Key")) as string | null;

    if (!file || !rawKey) {
      return NextResponse.json({ error: "file and key required" }, { status: 400 });
    }

    const key = sanitizeKey(rawKey);
    if (!key) {
      return NextResponse.json({ error: "invalid key" }, { status: 400 });
    }

    if (file.size > MAX_FILE_BYTES) {
      return NextResponse.json({ error: "file too large (max 50MB)" }, { status: 413 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    await putObject(key, buffer, file.type || "application/octet-stream");

    return NextResponse.json({
      url: serveUrl(key),
      key,
      size: buffer.length,
    });
  } catch (err: any) {
    console.error("File upload failed:", err);
    return NextResponse.json({ error: err.message ?? "upload failed" }, { status: 500 });
  }
}

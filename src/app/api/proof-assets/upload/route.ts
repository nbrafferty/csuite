import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export const runtime = "nodejs";

export const dynamic = "force-dynamic";

const UPLOAD_DIR = path.join(process.cwd(), ".uploads");

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const s3Key = formData.get("s3Key") as string | null;

    if (!file || !s3Key) {
      return NextResponse.json({ error: "file and s3Key required" }, { status: 400 });
    }

    const normalized = path.normalize(s3Key);
    if (normalized.includes("..")) {
      return NextResponse.json({ error: "invalid key" }, { status: 400 });
    }

    const filePath = path.join(UPLOAD_DIR, normalized);
    const dir = path.dirname(filePath);
    await mkdir(dir, { recursive: true });

    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(filePath, buffer);

    return NextResponse.json({
      url: `/api/proof-assets/serve?key=${encodeURIComponent(s3Key)}`,
      size: buffer.length,
    });
  } catch (err: any) {
    console.error("Proof asset upload failed:", err);
    return NextResponse.json({ error: err.message ?? "upload failed" }, { status: 500 });
  }
}

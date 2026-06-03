import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

const UPLOAD_DIR = path.join(process.cwd(), ".uploads");

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const s3Key = formData.get("s3Key") as string | null;

  if (!file || !s3Key) {
    return NextResponse.json({ error: "file and s3Key required" }, { status: 400 });
  }

  const filePath = path.join(UPLOAD_DIR, s3Key);
  const dir = path.dirname(filePath);
  await mkdir(dir, { recursive: true });

  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(filePath, buffer);

  return NextResponse.json({ url: `/api/proof-assets/serve?key=${encodeURIComponent(s3Key)}` });
}

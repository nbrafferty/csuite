import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/server/auth/auth";
import { getObject, sanitizeKey } from "@/server/lib/storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const rawKey = req.nextUrl.searchParams.get("key");
  if (!rawKey) {
    return NextResponse.json({ error: "key required" }, { status: 400 });
  }

  const key = sanitizeKey(rawKey);
  if (!key) {
    return NextResponse.json({ error: "invalid key" }, { status: 400 });
  }

  const object = await getObject(key);
  if (!object) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  return new NextResponse(new Uint8Array(object.body), {
    headers: {
      "Content-Type": object.contentType,
      "Cache-Control": "private, max-age=31536000, immutable",
    },
  });
}

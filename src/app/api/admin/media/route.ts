import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin/auth";
import { MEDIA_MAX_BYTES, MEDIA_TYPES, saveMedia } from "@/lib/store/media";

export async function POST(request: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Please sign in again." }, { status: 401 });

  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "No file received." }, { status: 400 });
  if (!MEDIA_TYPES.includes(file.type)) {
    return NextResponse.json({ error: "Use a JPEG, PNG or WebP image." }, { status: 415 });
  }
  if (file.size > MEDIA_MAX_BYTES) {
    return NextResponse.json({ error: "That image is too large even after resizing." }, { status: 413 });
  }
  const saved = await saveMedia(Buffer.from(await file.arrayBuffer()), file.type, file.name);
  return NextResponse.json(saved);
}

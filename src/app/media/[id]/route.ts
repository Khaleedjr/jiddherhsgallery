import { getMedia } from "@/lib/store/media";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const media = await getMedia(id);
  if (!media) return new Response("Not found", { status: 404 });
  return new Response(new Uint8Array(Buffer.from(media.data, "base64")), {
    headers: {
      "Content-Type": media.type,
      "Content-Length": String(media.bytes),
      // An id is never reused for different bytes, so this can be cached for good.
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

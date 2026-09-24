import { randomBytes } from "node:crypto";
import { getDriver } from "@/lib/store/driver";

/**
 * Uploaded product photos live in the store itself (as base64), served from
 * /media/<id>. The browser shrinks each photo before upload, so records stay
 * small and nothing extra has to be hosted.
 */
export type MediaRecord = {
  id: string;
  type: string;
  data: string;
  bytes: number;
  name: string;
  createdAt: string;
};

export const MEDIA_TYPES = ["image/webp", "image/jpeg", "image/png"];
/** Base64 grows files by a third; this keeps one photo's record well inside Upstash's 1 MB request limit. */
export const MEDIA_MAX_BYTES = 560 * 1024;

export async function saveMedia(buffer: Buffer, type: string, name: string) {
  const id = randomBytes(9).toString("base64url");
  const record: MediaRecord = {
    id,
    type,
    data: buffer.toString("base64"),
    bytes: buffer.length,
    name: name.slice(0, 120),
    createdAt: new Date().toISOString(),
  };
  await getDriver().put("media", { [id]: record });
  return { id, url: `/media/${id}` };
}

export async function getMedia(id: string) {
  if (!/^[A-Za-z0-9_-]{6,40}$/.test(id)) return null;
  return getDriver().get<MediaRecord>("media", id);
}

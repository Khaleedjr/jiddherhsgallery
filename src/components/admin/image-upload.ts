/** Shrink a photo in the browser before upload so it stays small in the store. */
export async function resizeForUpload(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const attempts = [
    { max: 1600, quality: 0.85 },
    { max: 1400, quality: 0.78 },
    { max: 1100, quality: 0.72 },
  ];
  try {
    for (const { max, quality } of attempts) {
      const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(bitmap.width * scale);
      canvas.height = Math.round(bitmap.height * scale);
      const context = canvas.getContext("2d");
      if (!context) throw new Error("This browser can't resize images.");
      context.fillStyle = "#ffffff";
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      let blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/webp", quality));
      // Older Safari quietly returns PNG for WebP requests; JPEG is the smaller fallback.
      if (!blob || blob.type !== "image/webp") {
        blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));
      }
      if (blob && blob.size <= 540 * 1024) return blob;
    }
  } finally {
    bitmap.close();
  }
  throw new Error("That photo is too large to upload, even after resizing.");
}

export async function uploadImage(file: File): Promise<string> {
  if (!file.type.startsWith("image/")) throw new Error(`${file.name} isn't an image.`);
  const blob = await resizeForUpload(file);
  const extension = blob.type === "image/webp" ? "webp" : "jpg";
  const form = new FormData();
  form.append("file", new File([blob], file.name.replace(/\.[^.]+$/, "") + `.${extension}`, { type: blob.type }));
  const response = await fetch("/api/admin/media", { method: "POST", body: form });
  const data = (await response.json().catch(() => ({}))) as { url?: string; error?: string };
  if (!response.ok || !data.url) throw new Error(data.error ?? "Upload failed.");
  return data.url;
}

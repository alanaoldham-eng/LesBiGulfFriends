"use client";

const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const VIDEO_TYPES = ["video/mp4", "video/quicktime", "video/webm", "video/ogg"];

export function validateImageOrVideo(file: File, opts?: { maxImageMb?: number; maxVideoMb?: number }) {
  const maxImageMb = opts?.maxImageMb ?? 10;
  const maxVideoMb = opts?.maxVideoMb ?? 50;

  const isImage = IMAGE_TYPES.includes(file.type);
  const isVideo = VIDEO_TYPES.includes(file.type);

  if (!isImage && !isVideo) {
    throw new Error("Please upload a JPG, PNG, WEBP, GIF, MP4, MOV, or WEBM file.");
  }

  const maxBytes = (isImage ? maxImageMb : maxVideoMb) * 1024 * 1024;
  if (file.size > maxBytes) {
    throw new Error(
      isImage
        ? `Images must be ${maxImageMb} MB or smaller.`
        : `Videos must be ${maxVideoMb} MB or smaller.`,
    );
  }

  return { isImage, isVideo };
}

export function validateMessageEdit(body: string) {
  const clean = String(body || "").trim();
  if (!clean) throw new Error("Message cannot be empty.");
  if (clean.length > 4000) throw new Error("Message must be 4000 characters or less.");
  return clean;
}

export function validateWarningWallText(body: string) {
  const clean = String(body || "").trim();
  if (clean.length < 20) throw new Error("Warning Wall posts must be at least 20 characters.");
  if (clean.length > 5000) throw new Error("Warning Wall posts must be 5000 characters or less.");
  return clean;
}

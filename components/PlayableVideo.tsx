"use client";

function guessVideoType(url: string, provided?: string | null) {
  if (provided) return provided;
  const lower = String(url || "").toLowerCase();
  if (lower.endsWith(".mov")) return "video/quicktime";
  if (lower.endsWith(".mp4") || lower.endsWith(".m4v")) return "video/mp4";
  if (lower.endsWith(".webm")) return "video/webm";
  if (lower.endsWith(".ogg") || lower.endsWith(".ogv")) return "video/ogg";
  if (lower.endsWith(".avi")) return "video/x-msvideo";
  return "video/mp4";
}

export function PlayableVideo({ src, type }: { src: string; type?: string | null }) {
  const resolvedType = guessVideoType(src, type);
  return <div><video controls playsInline preload="metadata" src={src} style={{ width: "100%", borderRadius: 12, background: "#000" }}><source src={src} type={resolvedType} /></video><div style={{ marginTop: 8 }}><a href={src} target="_blank" rel="noreferrer" style={{ color: "#8d2d5d", textDecoration: "underline", fontSize: 13 }}>Open video in new tab</a></div></div>;
}

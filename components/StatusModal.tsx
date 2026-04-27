"use client";

export function StatusModal({ open, title = "Notice", message, onClose }: { open: boolean; title?: string; message: string; onClose: () => void }) {
  if (!open) return null;
  return (
    <div role="dialog" aria-modal="true" onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(30,20,28,0.45)", display: "grid", placeItems: "center", zIndex: 10000, padding: 16 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: "min(480px, 100%)", background: "#fff", borderRadius: 20, border: "1px solid #ead5df", boxShadow: "0 20px 50px rgba(57,30,45,0.24)", padding: 18 }}>
        <h3 style={{ marginTop: 0, marginBottom: 10 }}>{title}</h3>
        <p style={{ marginTop: 0, lineHeight: 1.6 }}>{message}</p>
        <div style={{ display: "flex", justifyContent: "flex-end" }}><button className="button" onClick={onClose}>Dismiss</button></div>
      </div>
    </div>
  );
}

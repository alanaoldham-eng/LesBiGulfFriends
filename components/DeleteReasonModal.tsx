"use client";

import { useState } from "react";

export function DeleteReasonModal({ open, title = "Remove content", onCancel, onConfirm }: { open: boolean; title?: string; onCancel: () => void; onConfirm: (reason: string) => Promise<void> | void }) {
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  if (!open) return null;
  const submit = async () => { if (!reason.trim()) return; setBusy(true); try { await onConfirm(reason.trim()); setReason(""); } finally { setBusy(false); } };
  return (
    <div role="dialog" aria-modal="true" onClick={onCancel} style={{ position: "fixed", inset: 0, background: "rgba(30,20,28,0.45)", display: "grid", placeItems: "center", zIndex: 10000, padding: 16 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: "min(520px, 100%)", background: "#fff", borderRadius: 20, border: "1px solid #ead5df", boxShadow: "0 20px 50px rgba(57,30,45,0.24)", padding: 18 }}>
        <h3 style={{ marginTop: 0, marginBottom: 10 }}>{title}</h3>
        <textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Enter reason for removal" style={{ width: "100%", minHeight: 120, padding: "12px 14px", borderRadius: 14, border: "1px solid #d7a8bf", fontSize: 15 }} />
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 12 }}>
          <button className="button secondary" onClick={onCancel} disabled={busy}>Cancel</button>
          <button className="button" onClick={submit} disabled={busy || !reason.trim()}>{busy ? "Removing..." : "Remove"}</button>
        </div>
      </div>
    </div>
  );
}

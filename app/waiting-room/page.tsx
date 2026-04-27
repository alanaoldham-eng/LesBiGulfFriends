"use client";
export const dynamic = "force-dynamic";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ClientShell } from "../../components/ClientShell";
import { StatusModal } from "../../components/StatusModal";
import { DeleteReasonModal } from "../../components/DeleteReasonModal";
import { getCurrentUser } from "../../lib/auth";
import { getViewerRoleFlags, listWaitingRoomCandidates } from "../../lib/roadmap";
import { softRemoveContent } from "../../lib/contentModeration";

const trashBtn: React.CSSProperties = { padding: "6px 8px", borderRadius: 10, border: "1px solid #f1dfe8", background: "#fff", fontSize: 12, lineHeight: 1.1, cursor: "pointer", whiteSpace: "nowrap" };

export default function WaitingRoomPage() {
  const [me, setMe] = useState("");
  const [canReview, setCanReview] = useState(false);
  const [queue, setQueue] = useState<any[]>([]);
  const [status, setStatus] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const refresh = async (userId: string) => {
    const [roleFlags, waiting] = await Promise.all([getViewerRoleFlags(userId).catch(() => ({ canReview: false })), listWaitingRoomCandidates().catch(() => [])]);
    setCanReview(!!roleFlags?.canReview);
    setQueue((waiting || []).filter((row: any) => row.status !== "removed" && row.moderation_status !== "removed"));
  };

  useEffect(() => { getCurrentUser().then(async (user) => { if (!user) return; setMe(user.id); await refresh(user.id); }); }, []);

  if (!canReview) return <ClientShell><section className="hero"><h1 style={{ margin: 0, fontSize: 30 }}>Waiting Room</h1><p style={{ opacity: 0.8 }}>Only admin and moderators can open the waiting room.</p></section></ClientShell>;

  return (
    <ClientShell>
      <section className="hero"><h1 style={{ margin: 0, fontSize: 30 }}>Waiting Room</h1><p style={{ fontSize: 16, lineHeight: 1.6, opacity: 0.9 }}>Reception queue for reviewers.</p></section>
      <div className="grid"><section style={{ border: "1px solid #e9d7e2", borderRadius: 20, padding: 16, background: "#fff" }}><h3 style={{ marginTop: 0 }}>Reception queue</h3>{queue.length ? queue.map((row: any) => <div key={row.id} style={{ borderBottom: "1px solid #f1dfe8", padding: "10px 0" }}><div style={{ fontWeight: 700 }}>{row.profiles?.display_name || "New Member"}</div><div style={{ opacity: 0.75 }}>{row.status}</div><div style={{ marginTop: 8, display: "flex", gap: 8, flexWrap: "wrap" }}><Link className="button secondary" href={`/waiting-room/${row.id}`}>Review</Link><button style={trashBtn} onClick={() => setDeleteTarget(row.id)}>🗑 Delete</button></div></div>) : <p style={{ margin: 0, opacity: 0.8 }}>No candidates waiting right now.</p>}</section></div>
      <DeleteReasonModal open={!!deleteTarget} title="Remove candidate from waiting room" onCancel={() => setDeleteTarget(null)} onConfirm={async (reason) => { if (!deleteTarget) return; try { await softRemoveContent("waiting_room_candidates", deleteTarget, reason); setDeleteTarget(null); setStatus("Candidate removed from the website and logged."); await refresh(me); } catch (e: any) { setStatus(e.message || "Unable to remove candidate."); } }} />
      <StatusModal open={!!status} message={status} onClose={() => setStatus("")} />
    </ClientShell>
  );
}

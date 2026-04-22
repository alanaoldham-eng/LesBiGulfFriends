"use client";
export const dynamic = "force-dynamic";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ClientShell } from "../../components/ClientShell";
import { getCurrentUser } from "../../lib/auth";
import { getViewerRoleFlags, listWaitingRoomCandidates } from "../../lib/roadmap";
import { supabase } from "../../lib/supabase/client";

export default function WaitingRoomPage() {
  const [me, setMe] = useState("");
  const [canReview, setCanReview] = useState(false);
  const [queue, setQueue] = useState<any[]>([]);
  const [status, setStatus] = useState("");

  const refresh = async (userId: string) => {
    const [roleFlags, waiting] = await Promise.all([
      getViewerRoleFlags(userId).catch(() => ({ canReview: false })),
      listWaitingRoomCandidates().catch(() => []),
    ]);
    setCanReview(!!roleFlags?.canReview);
    setQueue(waiting);
  };

  useEffect(() => {
    getCurrentUser().then(async (user) => {
      if (!user) return;
      setMe(user.id);
      await refresh(user.id);
    });
  }, []);

  const deleteCandidate = async (candidateId: string) => {
    try {
      const { error } = await supabase.rpc("delete_waiting_candidate_rpc", {
        _candidate_id: candidateId,
      });
      if (error) throw error;
      setStatus("Candidate deleted from reception queue.");
      await refresh(me);
    } catch (e: any) {
      setStatus(e.message || "Unable to delete candidate.");
    }
  };

  if (!canReview) {
    return (
      <ClientShell>
        <section className="hero">
          <h1 style={{ margin: 0, fontSize: 30 }}>Waiting Room</h1>
          <p style={{ opacity: 0.8 }}>Only admin and moderators can open the waiting room.</p>
        </section>
      </ClientShell>
    );
  }

  return (
    <ClientShell>
      <section className="hero">
        <h1 style={{ margin: 0, fontSize: 30 }}>Waiting Room</h1>
        <p style={{ fontSize: 16, lineHeight: 1.6, opacity: 0.9 }}>Reception queue for reviewers.</p>
      </section>

      <div className="grid">
        <section style={{ border: "1px solid #e9d7e2", borderRadius: 20, padding: 16, background: "#fff" }}>
          <h3 style={{ marginTop: 0 }}>Reception queue</h3>
          {queue.length ? queue.map((row: any) => (
            <div key={row.id} style={{ borderBottom: "1px solid #f1dfe8", padding: "10px 0" }}>
              <div style={{ fontWeight: 700 }}>{row.profiles?.display_name || "New Member"}</div>
              <div style={{ opacity: 0.75 }}>{row.status}</div>
              <div style={{ marginTop: 8, display: "flex", gap: 8, flexWrap: "wrap" }}>
                <Link className="button secondary" href={`/waiting-room/${row.id}`}>Review</Link>
                <button className="button secondary" onClick={() => deleteCandidate(row.id)}>Delete</button>
              </div>
            </div>
          )) : <p style={{ margin: 0, opacity: 0.8 }}>No candidates waiting right now.</p>}
        </section>

        {status ? <p style={{ margin: 0, opacity: 0.8 }}>{status}</p> : null}
      </div>
    </ClientShell>
  );
}

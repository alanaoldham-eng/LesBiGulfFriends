"use client";
export const dynamic = "force-dynamic";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ClientShell } from "../../components/ClientShell";
import { getCurrentUser } from "../../lib/auth";
import { uploadPublicImage } from "../../lib/db";
import { ensureWaitingRoomCandidate, getViewerRoleFlags, listWaitingRoomCandidates, updateWaitingRoomIntroVideo } from "../../lib/roadmap";

export default function WaitingRoomPage() {
  const [me, setMe] = useState("");
  const [candidate, setCandidate] = useState<any | null>(null);
  const [canReview, setCanReview] = useState(false);
  const [queue, setQueue] = useState<any[]>([]);
  const [introFile, setIntroFile] = useState<File | null>(null);
  const [status, setStatus] = useState("");

  const refresh = async (userId: string) => {
    const [roleFlags, mine, waiting] = await Promise.all([
      getViewerRoleFlags(userId).catch(() => ({ canReview: false })),
      ensureWaitingRoomCandidate(userId).catch(() => null),
      listWaitingRoomCandidates().catch(() => []),
    ]);
    setCanReview(!!roleFlags?.canReview);
    setCandidate(mine);
    setQueue(waiting);
  };

  useEffect(() => {
    getCurrentUser().then(async (user) => {
      if (!user) return;
      setMe(user.id);
      await refresh(user.id);
    });
  }, []);

  const uploadIntro = async () => {
    if (!me || !candidate || !introFile) return;
    try {
      const intro_video_url = await uploadPublicImage("chat-media", me, introFile);
      await updateWaitingRoomIntroVideo(me, intro_video_url);
      setStatus("Intro video uploaded.");
      await refresh(me);
    } catch (e: any) {
      setStatus(e.message || "Unable to upload intro video.");
    }
  };

  return (
    <ClientShell>
      <section className="hero">
        <h1 style={{ margin: 0, fontSize: 30 }}>Waiting Room</h1>
        <p style={{ fontSize: 16, lineHeight: 1.6, opacity: 0.9 }}>
          Users who signed up without an invite stay here until they are either let in or deleted. New candidates are automatically announced in the Main group for reception duties.
        </p>
      </section>
      <div className="grid">
        <section style={{ border: "1px solid #e9d7e2", borderRadius: 20, padding: 16, background: "#fff" }}>
          <h3 style={{ marginTop: 0 }}>Your entry video</h3>
          <p style={{ opacity: 0.85, lineHeight: 1.6 }}>
            “I promise that I am over 26 years of age, and female. I will answer any questions you have, if you will let me in. I will check back later for questions. Today’s date is:”
          </p>
          <p style={{ opacity: 0.75 }}>Please say today’s actual date in your recording.</p>
          <input type="file" accept="video/*" onChange={(e) => setIntroFile(e.target.files?.[0] || null)} />
          <div style={{ marginTop: 12, display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button className="button" onClick={uploadIntro} disabled={!introFile}>Upload intro video</button>
            {candidate?.intro_video_url ? <a className="button secondary" href={candidate.intro_video_url} target="_blank" rel="noreferrer">View uploaded video</a> : null}
          </div>
          <div style={{ marginTop: 12, opacity: 0.8 }}>Status: <strong>{candidate?.status || "waiting"}</strong></div>
        </section>

        {canReview ? (
          <section style={{ border: "1px solid #e9d7e2", borderRadius: 20, padding: 16, background: "#fff" }}>
            <h3 style={{ marginTop: 0 }}>Reception queue</h3>
            {queue.length ? queue.map((row) => (
              <div key={row.id} style={{ borderBottom: "1px solid #f1dfe8", padding: "10px 0" }}>
                <div style={{ fontWeight: 700 }}>{row.profiles?.display_name || "New Member"}</div>
                <div style={{ opacity: 0.75 }}>{row.status}</div>
                <div style={{ marginTop: 8 }}><Link className="button secondary" href={`/waiting-room/${row.id}`}>Review</Link></div>
              </div>
            )) : <p style={{ margin: 0, opacity: 0.8 }}>No candidates waiting right now.</p>}
          </section>
        ) : null}

        {status ? <p style={{ margin: 0, opacity: 0.8 }}>{status}</p> : null}
      </div>
    </ClientShell>
  );
}

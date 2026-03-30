"use client";
export const dynamic = "force-dynamic";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ClientShell } from "../../../../components/ClientShell";
import { getCurrentUser } from "../../../../lib/auth";
import { getMyBlindQueueEntry, joinBlindChatQueue, leaveBlindSession, listMyBlindSessions, tryMatchBlindChat } from "../../../../lib/roadmap";

export default function BlindChatLobbyPage() {
  const [me, setMe] = useState("");
  const [queueEntry, setQueueEntry] = useState<any | null>(null);
  const [recentSessions, setRecentSessions] = useState<any[]>([]);
  const [status, setStatus] = useState("");

  const refresh = async (uid: string) => {
    const [queue, sessions] = await Promise.all([
      getMyBlindQueueEntry(uid).catch(() => null),
      listMyBlindSessions(uid).catch(() => []),
    ]);
    setQueueEntry(queue);
    setRecentSessions(sessions);
  };

  useEffect(() => {
    getCurrentUser().then(async (user) => {
      const uid = user?.id || "";
      setMe(uid);
      if (uid) await refresh(uid);
    });
  }, []);

  const join = async () => {
    try {
      await joinBlindChatQueue(me);
      setStatus("You joined the blind chat queue.");
      const matched = await tryMatchBlindChat(me).catch(() => null);
      if (matched?.id || matched?.sessionId) {
        window.location.href = `/games/blind-chat/${matched.id || matched.sessionId}`;
        return;
      }
      await refresh(me);
    } catch (e: any) {
      setStatus(e.message || "Unable to join queue.");
    }
  };

  return (
    <ClientShell>
      <section className="hero">
        <h1 style={{ margin: 0, fontSize: 30 }}>Blind Chat</h1>
        <p style={{ fontSize: 16, lineHeight: 1.6, opacity: 0.9 }}>
          Chat with someone new without seeing who they are. If both of you want to reveal later, you can.
        </p>
      </section>

      <div className="grid">
        <section style={{ border: "1px solid #e9d7e2", borderRadius: 20, padding: 16, background: "#fff" }}>
          <h3 style={{ marginTop: 0 }}>Lobby</h3>
          {queueEntry?.status === "waiting" ? (
            <p style={{ marginTop: 0, opacity: 0.85 }}>Looking for a match… refresh or wait for someone else to join.</p>
          ) : <p style={{ marginTop: 0, opacity: 0.85 }}>Join the queue when you’re ready for a playful anonymous conversation.</p>}
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button className="button" onClick={join}>Join blind chat</button>
            <button className="button secondary" onClick={() => refresh(me)}>Refresh</button>
          </div>
        </section>

        <section style={{ border: "1px solid #e9d7e2", borderRadius: 20, padding: 16, background: "#fff" }}>
          <h3 style={{ marginTop: 0 }}>Recent sessions</h3>
          {recentSessions.length ? recentSessions.map((row: any) => (
            <div key={row.session_id} style={{ borderBottom: "1px solid #f1dfe8", padding: "10px 0" }}>
              <div style={{ opacity: 0.75 }}>Status: {row.blind_chat_sessions?.status || "unknown"}</div>
              <Link className="button secondary" href={`/games/blind-chat/${row.session_id}`}>Open session</Link>
            </div>
          )) : <p style={{ margin: 0, opacity: 0.8 }}>No blind chat sessions yet.</p>}
        </section>

        {status ? <p style={{ margin: 0, opacity: 0.8 }}>{status}</p> : null}
      </div>
    </ClientShell>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { ClientShell } from "../../../components/ClientShell";
import { getCurrentUser } from "../../../lib/auth";
import { listGroupMessages, sendGroupMessage } from "../../../lib/db";

export default function GroupThreadPage() {
  const params = useParams<{ groupId: string }>();
  const groupId = params.groupId;
  const [me, setMe] = useState("");
  const [messages, setMessages] = useState<any[]>([]);
  const [body, setBody] = useState("");
  const [status, setStatus] = useState("");

  const refresh = async () => {
    const rows = await listGroupMessages(groupId).catch(() => []);
    setMessages(rows);
  };

  useEffect(() => {
    const run = async () => {
      const user = await getCurrentUser();
      if (!user) return;
      setMe(user.id);
      await refresh();
    };
    run();
  }, [groupId]);

  const send = async () => {
    if (!body.trim()) return;
    try {
      await sendGroupMessage(groupId, me, body.trim());
      setBody("");
      await refresh();
    } catch (e: any) {
      setStatus(e.message || "Unable to send group message.");
    }
  };

  return (
    <ClientShell>
      <section className="hero">
        <h1 style={{ margin: 0, fontSize: 30 }}>Group chat</h1>
        <p style={{ fontSize: 16, lineHeight: 1.6, opacity: 0.9 }}>
          This MVP thread is intentionally simple: text messages only, protected by group membership RLS.
        </p>
      </section>

      <div className="grid">
        <section style={{ border: "1px solid #e9d7e2", borderRadius: 20, padding: 16, background: "#fff" }}>
          <div style={{ border: "1px solid #f1dfe8", borderRadius: 16, padding: 12, minHeight: 220, background: "#fffafc" }}>
            {messages.length ? messages.map((m) => (
              <div key={m.id} style={{ marginBottom: 12 }}>
                <strong>{m.sender_id === me ? "You" : m.sender_id}</strong>
                <div>{m.body}</div>
              </div>
            )) : <p style={{ margin: 0, opacity: 0.7 }}>No group messages yet.</p>}
          </div>
          <div style={{ display: "grid", gap: 12, marginTop: 12 }}>
            <textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="Type a group message"
              style={{ minHeight: 100, padding: "14px 16px", borderRadius: 16, border: "1px solid #d7a8bf", fontSize: 16 }} />
            <button className="button" onClick={send}>Send to group</button>
            {status ? <p style={{ margin: 0, opacity: 0.8 }}>{status}</p> : null}
          </div>
        </section>
      </div>
    </ClientShell>
  );
}

"use client";

import { useEffect, useState } from "react";
import { ClientShell } from "../../components/ClientShell";
import { EmptyState } from "../../components/EmptyState";
import { getCurrentUser } from "../../lib/auth";
import { listFriends, listDmMessages, sendDm } from "../../lib/db";

export default function MessagesPage() {
  const [me, setMe] = useState("");
  const [friends, setFriends] = useState<any[]>([]);
  const [selected, setSelected] = useState<any | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [body, setBody] = useState("");
  const [status, setStatus] = useState("");

  useEffect(() => {
    const run = async () => {
      const user = await getCurrentUser();
      if (!user) return;
      setMe(user.id);
      const frs = await listFriends(user.id).catch(() => []);
      setFriends(frs);
    };
    run();
  }, []);

  const openThread = async (friend: any) => {
    setSelected(friend);
    const msgs = await listDmMessages(me, friend.id).catch(() => []);
    setMessages(msgs);
  };

  const send = async () => {
    if (!selected || !body.trim()) return;
    try {
      await sendDm(me, selected.id, body.trim());
      setBody("");
      const msgs = await listDmMessages(me, selected.id).catch(() => []);
      setMessages(msgs);
    } catch (e: any) {
      setStatus(e.message || "Unable to send message.");
    }
  };

  return (
    <ClientShell>
      <section className="hero">
        <h1 style={{ margin: 0, fontSize: 30 }}>Messages</h1>
        <p style={{ fontSize: 16, lineHeight: 1.6, opacity: 0.9 }}>
          Only friends can DM each other. Keep it simple and safe for the MVP.
        </p>
      </section>

      <div className="grid">
        <section style={{ border: "1px solid #e9d7e2", borderRadius: 20, padding: 16, background: "#fff" }}>
          <h3 style={{ marginTop: 0 }}>Friends</h3>
          {friends.length ? friends.map((f) => (
            <div key={f.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, marginBottom: 10 }}>
              <span>{f.display_name}</span>
              <button className="button secondary" onClick={() => openThread(f)}>Open thread</button>
            </div>
          )) : <EmptyState title="No DM threads yet" body="Add friends first, then come back here to chat." />}
        </section>

        {selected ? (
          <section style={{ border: "1px solid #e9d7e2", borderRadius: 20, padding: 16, background: "#fff" }}>
            <h3 style={{ marginTop: 0 }}>Chat with {selected.display_name}</h3>
            <div style={{ display: "grid", gap: 10 }}>
              <div style={{ border: "1px solid #f1dfe8", borderRadius: 16, padding: 12, minHeight: 180, background: "#fffafc" }}>
                {messages.length ? messages.map((m) => (
                  <div key={m.id} style={{ marginBottom: 10 }}>
                    <strong>{m.sender_id === me ? "You" : selected.display_name}</strong>
                    <div style={{ opacity: 0.9 }}>{m.body}</div>
                  </div>
                )) : <p style={{ margin: 0, opacity: 0.7 }}>No messages yet.</p>}
              </div>
              <textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="Type a message"
                style={{ minHeight: 100, padding: "14px 16px", borderRadius: 16, border: "1px solid #d7a8bf", fontSize: 16 }} />
              <button className="button" onClick={send}>Send message</button>
            </div>
          </section>
        ) : null}

        {status ? <p style={{ margin: 0, opacity: 0.8 }}>{status}</p> : null}
      </div>
    </ClientShell>
  );
}

"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { ClientShell } from "../../components/ClientShell";
import { EmptyState } from "../../components/EmptyState";
import { getCurrentUser } from "../../lib/auth";
import { listFriends, listDmMessages, sendDm, uploadPublicImage, getMyProfile } from "../../lib/db";

async function sendPrivateMessageEmailNotification(recipientUserId: string, senderName: string, snippet: string) {
  try {
    await fetch("/api/notifications/private-message", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ recipientUserId, senderName, snippet }),
    });
  } catch {}
}

function MessageAttachment({ m, senderName }: { m: any; senderName: string }) {
  return (
    <div key={m.id} style={{ marginBottom: 12 }}>
      <strong>{senderName}</strong>
      {m.body ? <div style={{ opacity: 0.95, whiteSpace: "pre-wrap" }}>{m.body}</div> : null}
      {m.link_url ? (
        <div style={{ marginTop: 6 }}>
          <a href={m.link_url} target="_blank" rel="noreferrer" style={{ color: "#8d2d5d", textDecoration: "underline" }}>
            {m.link_url}
          </a>
        </div>
      ) : null}
      {m.media_url ? (
        <div style={{ marginTop: 8 }}>
          {String(m.media_type || "").startsWith("image/") ? (
            <img src={m.media_url} alt="Attachment" style={{ maxWidth: "100%", borderRadius: 14, border: "1px solid #ead5df" }} />
          ) : (
            <a href={m.media_url} target="_blank" rel="noreferrer" style={{ color: "#8d2d5d", textDecoration: "underline" }}>
              Open attachment
            </a>
          )}
        </div>
      ) : null}
    </div>
  );
}

export default function MessagesPage() {
  const [me, setMe] = useState("");
  const [friends, setFriends] = useState<any[]>([]);
  const [selected, setSelected] = useState<any | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [body, setBody] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [attachment, setAttachment] = useState<File | null>(null);
  const [status, setStatus] = useState("");
  const [myName, setMyName] = useState("A member");

  useEffect(() => {
    const run = async () => {
      const user = await getCurrentUser();
      if (!user) return;
      setMe(user.id);
      const [frs, myProfile] = await Promise.all([
        listFriends(user.id).catch(() => []),
        getMyProfile(user.id).catch(() => null),
      ]);
      setFriends(frs);
      setMyName(myProfile?.display_name || "A member");
    };
    run();
  }, []);

  const openThread = async (friend: any) => {
    setSelected(friend);
    const msgs = await listDmMessages(me, friend.id).catch(() => []);
    setMessages(msgs);
  };

  const send = async () => {
    if (!selected) return;
    if (!body.trim() && !linkUrl.trim() && !attachment) return;
    try {
      let mediaUrl: string | null = null;
      let mediaType: string | null = null;
      if (attachment) {
        mediaUrl = await uploadPublicImage("chat-media", me, attachment);
        mediaType = attachment.type || "application/octet-stream";
      }
      const snippet = body.trim() || linkUrl.trim() || (attachment ? "Sent you an attachment" : "Sent you a message");
      await sendDm(me, selected.id, body.trim(), mediaUrl, mediaType, linkUrl.trim() || null);
      await sendPrivateMessageEmailNotification(selected.id, myName, snippet.slice(0, 120));
      setBody("");
      setLinkUrl("");
      setAttachment(null);
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
          Only friends can DM each other. You can send text, links, and picture attachments.
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
                  <MessageAttachment
                    key={m.id}
                    m={m}
                    senderName={m.sender_id === me ? "You" : selected.display_name}
                  />
                )) : <p style={{ margin: 0, opacity: 0.7 }}>No messages yet.</p>}
              </div>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Type a message"
                style={{ minHeight: 100, padding: "14px 16px", borderRadius: 16, border: "1px solid #d7a8bf", fontSize: 16 }}
              />
              <input
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="Optional link"
                style={{ padding: "14px 16px", borderRadius: 16, border: "1px solid #d7a8bf", fontSize: 16 }}
              />
              <input type="file" accept="image/*,.pdf,.doc,.docx,.txt,.zip" onChange={(e) => setAttachment(e.target.files?.[0] || null)} />
              <button className="button" onClick={send}>Send message</button>
            </div>
          </section>
        ) : null}

        {status ? <p style={{ margin: 0, opacity: 0.8 }}>{status}</p> : null}
      </div>
    </ClientShell>
  );
}

"use client";
export const dynamic = "force-dynamic";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { ClientShell } from "../../../../components/ClientShell";
import { getCurrentUser } from "../../../../lib/auth";
import {
  listRoleplayMessages,
  listRoleplayParticipants,
  sendRoleplayMessage,
} from "../../../../lib/roadmap";

export default function RoleplaySessionPage() {
  const params = useParams<{ sessionId: string }>();
  const sessionId = params?.sessionId || "";
  const [me, setMe] = useState("");
  const [body, setBody] = useState("");
  const [messages, setMessages] = useState<any[]>([]);
  const [participants, setParticipants] = useState<any[]>([]);
  const [status, setStatus] = useState("");

  const refresh = async () => {
    if (!sessionId) return;

    const [msgs, ppl] = await Promise.all([
      listRoleplayMessages(sessionId).catch(() => []),
      listRoleplayParticipants(sessionId).catch(() => []),
    ]);
    setMessages(msgs);
    setParticipants(ppl);
  };

  useEffect(() => {
    if (!sessionId) return;

    const run = async () => {
      const user = await getCurrentUser().catch(() => null);
      if (!user) return;
      setMe(user.id);
      await refresh();
    };

    run();
  }, [sessionId]);

  const participantMap = useMemo(
    () => new Map(participants.map((p: any) => [p.user_id, p])),
    [participants]
  );

  const send = async () => {
    if (!sessionId || !me || !body.trim()) return;
    try {
      await sendRoleplayMessage(sessionId, me, body);
      setBody("");
      await refresh();
    } catch (e: any) {
      setStatus(e.message || "Unable to send message.");
    }
  };

  const labelFor = (senderId: string) => {
    const row = participantMap.get(senderId);
    if (!row) return "Participant";
    if (row.is_anonymous) {
      return row.role === "sub" ? "Anonymous Sub" : "Anonymous Participant";
    }
    return row.profile?.display_name || "Participant";
  };

  return (
    <ClientShell>
      <section className="hero">
        <h1 style={{ margin: 0, fontSize: 30 }}>Roleplay Session</h1>
        <p style={{ fontSize: 16, lineHeight: 1.6, opacity: 0.9 }}>
          Consensual, opt-in, and leave-anytime. Anonymous participants stay
          anonymous; visible participants link back to their profiles.
        </p>
      </section>

      <div className="grid">
        <section
          style={{
            border: "1px solid #e9d7e2",
            borderRadius: 20,
            padding: 16,
            background: "#fff",
          }}
        >
          <div
            style={{
              border: "1px solid #f1dfe8",
              borderRadius: 16,
              padding: 12,
              minHeight: 220,
              background: "#fffafc",
            }}
          >
            {messages.length ? (
              messages.map((m) => (
                <div
                  key={m.id}
                  style={{
                    marginBottom: 12,
                    padding: 10,
                    border: "1px solid #f1dfe8",
                    borderRadius: 14,
                  }}
                >
                  <div style={{ fontSize: 12, opacity: 0.6 }}>
                    {labelFor(m.sender_id)}
                  </div>
                  <div style={{ marginTop: 4, whiteSpace: "pre-wrap" }}>
                    {m.body}
                  </div>
                </div>
              ))
            ) : (
              <p style={{ margin: 0, opacity: 0.7 }}>No messages yet.</p>
            )}
          </div>

          <div style={{ display: "grid", gap: 12, marginTop: 12 }}>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Type a message"
              style={{
                minHeight: 100,
                padding: "14px 16px",
                borderRadius: 16,
                border: "1px solid #d7a8bf",
                fontSize: 16,
              }}
            />
            <button className="button" onClick={send}>
              Send
            </button>
          </div>
        </section>

        <section
          style={{
            border: "1px solid #e9d7e2",
            borderRadius: 20,
            padding: 16,
            background: "#fff",
          }}
        >
          <h3 style={{ marginTop: 0 }}>Participants</h3>
          {participants.map((p) => (
            <div
              key={p.user_id}
              style={{ borderBottom: "1px solid #f1dfe8", padding: "10px 0" }}
            >
              <div style={{ fontWeight: 700 }}>
                {p.is_anonymous
                  ? p.role === "sub"
                    ? "Anonymous Sub"
                    : "Anonymous Participant"
                  : p.profile?.display_name || "Participant"}
              </div>
              <div style={{ opacity: 0.75 }}>{p.role}</div>
              {!p.is_anonymous && p.profile?.id ? (
                <a href={`/members/${p.profile.id}`} style={{ color: "#8d2d5d" }}>
                  Open profile
                </a>
              ) : null}
            </div>
          ))}
        </section>

        {status ? <p style={{ margin: 0, opacity: 0.8 }}>{status}</p> : null}
      </div>
    </ClientShell>
  );
}

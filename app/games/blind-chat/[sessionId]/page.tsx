"use client";
export const dynamic = "force-dynamic";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { ClientShell } from "../../../components/ClientShell";
import { getCurrentUser } from "../../../lib/auth";

type Message = { id: string; sender: "me" | "them"; body: string; created_at: string };

export default function BlindChatSessionPage() {
  const params = useParams<{ sessionId: string }>();
  const sessionId = params?.sessionId || "";
  const [me, setMe] = useState("");
  const [myAlias] = useState("GoldenFern");
  const [partnerAlias] = useState("NightOwl");
  const [body, setBody] = useState("");
  const [status, setStatus] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);

  useEffect(() => { getCurrentUser().then(async (user) => { if (!user) return; setMe(user.id); }); }, []);
  const canSend = useMemo(() => body.trim().length > 0, [body]);
  const send = async () => {
    const clean = body.trim(); if (!clean) return;
    setMessages((prev) => [...prev, { id: `${Date.now()}`, sender: 'me', body: clean, created_at: new Date().toISOString() }]);
    setBody(''); setStatus('Message added locally. Wire realtime/database next.');
  };
  return (
    <ClientShell>
      <section className='hero'><h1 style={{ margin: 0, fontSize: 30 }}>Blind Chat</h1><p style={{ fontSize: 16, lineHeight: 1.6, opacity: 0.9 }}>Session: {sessionId || 'unknown'}</p></section>
      <div className='grid'>
        <section style={{ border: '1px solid #e9d7e2', borderRadius: 20, padding: 16, background: '#fff' }}>
          <h3 style={{ marginTop: 0 }}>You are chatting with: 🌙 {partnerAlias}</h3>
          <p style={{ opacity: 0.8 }}>Your alias in this chat is <strong>{myAlias}</strong>.</p>
          <div style={{ border: '1px solid #f1dfe8', borderRadius: 16, padding: 12, minHeight: 240, background: '#fffafc', marginTop: 12 }}>
            {messages.length ? messages.map((m) => <div key={m.id} style={{ marginBottom: 12, display: 'flex', justifyContent: m.sender === 'me' ? 'flex-end' : 'flex-start' }}><div style={{ maxWidth: '80%', padding: '10px 12px', borderRadius: 14, border: '1px solid #ead5df', background: m.sender === 'me' ? '#fdebf3' : '#ffffff' }}><div style={{ fontSize: 12, opacity: 0.6, marginBottom: 4 }}>{m.sender === 'me' ? myAlias : partnerAlias}</div><div style={{ whiteSpace: 'pre-wrap' }}>{m.body}</div></div></div>) : <p style={{ margin: 0, opacity: 0.7 }}>No messages yet. Start the conversation anonymously.</p>}
          </div>
          <div style={{ display: 'grid', gap: 12, marginTop: 12 }}>
            <textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder='Send a message...' style={{ minHeight: 100, padding: '14px 16px', borderRadius: 16, border: '1px solid #d7a8bf', fontSize: 16 }} />
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button className='button' onClick={send} disabled={!me || !canSend}>Send</button>
              <button className='button secondary' onClick={() => setStatus('Reveal request UI shell installed.')} type='button'>Request Reveal</button>
              <button className='button secondary' onClick={() => setStatus('Leave flow UI shell installed.')} type='button'>Leave Chat</button>
            </div>
          </div>
          {status ? <p style={{ marginTop: 12, opacity: 0.8 }}>{status}</p> : null}
        </section>
      </div>
    </ClientShell>
  );
}

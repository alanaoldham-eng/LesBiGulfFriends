"use client";
export const dynamic = "force-dynamic";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ClientShell } from "../../../components/ClientShell";
import { getCurrentUser } from "../../../lib/auth";
import { createRoleplaySession, joinRoleplaySession, listRoleplaySessions } from "../../../lib/roadmap";

export default function RoleplayPage() {
  const [me, setMe] = useState("");
  const [sessions, setSessions] = useState<any[]>([]);
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [status, setStatus] = useState("");

  const refresh = async () => setSessions(await listRoleplaySessions().catch(() => []));

  useEffect(() => { getCurrentUser().then(async (user) => { if (!user) return; setMe(user.id); await refresh(); }); }, []);

  const createAndJoin = async (role: 'sub' | 'participant') => {
    try {
      const session = await createRoleplaySession(me);
      await joinRoleplaySession(session.id, me, role, isAnonymous);
      window.location.href = `/games/roleplay/${session.id}`;
    } catch (e: any) { setStatus(e.message || 'Unable to create session.'); }
  };

  const joinExisting = async (sessionId: string, role: 'sub' | 'participant') => {
    try {
      await joinRoleplaySession(sessionId, me, role, isAnonymous);
      window.location.href = `/games/roleplay/${sessionId}`;
    } catch (e: any) { setStatus(e.message || 'Unable to join session.'); }
  };

  return (
    <ClientShell>
      <section className='hero'>
        <h1 style={{ margin: 0, fontSize: 30 }}>Roleplay Game</h1>
        <p style={{ fontSize: 16, lineHeight: 1.6, opacity: 0.9 }}>A consensual BDSM-themed opt-in game inside the Adult community. Participants can stay anonymous or reveal their name linked to their profile.</p>
      </section>
      <div className='grid'>
        <section style={{ border: '1px solid #e9d7e2', borderRadius: 20, padding: 16, background: '#fff' }}>
          <h3 style={{ marginTop: 0 }}>Choose your identity mode</h3>
          <label style={{ display: 'block', marginBottom: 8 }}><input type='radio' checked={isAnonymous} onChange={() => setIsAnonymous(true)} /> Stay anonymous</label>
          <label style={{ display: 'block', marginBottom: 16 }}><input type='radio' checked={!isAnonymous} onChange={() => setIsAnonymous(false)} /> Reveal my username and profile</label>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button className='button' onClick={() => createAndJoin('sub')}>Create session as sub</button>
            <button className='button secondary' onClick={() => createAndJoin('participant')}>Create session as participant</button>
          </div>
        </section>
        <section style={{ border: '1px solid #e9d7e2', borderRadius: 20, padding: 16, background: '#fff' }}>
          <h3 style={{ marginTop: 0 }}>Active sessions</h3>
          {sessions.length ? sessions.map((s) => (
            <div key={s.id} style={{ borderBottom: '1px solid #f1dfe8', padding: '10px 0' }}>
              <div style={{ fontWeight: 700 }}>Session {String(s.id).slice(0, 8)}</div>
              <div style={{ opacity: 0.75 }}>{new Date(s.created_at).toLocaleString()}</div>
              <div style={{ marginTop: 8, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <button className='button secondary' onClick={() => joinExisting(s.id, 'participant')}>Join as participant</button>
                <button className='button secondary' onClick={() => joinExisting(s.id, 'sub')}>Join as sub</button>
              </div>
            </div>
          )) : <p style={{ margin: 0, opacity: 0.8 }}>No active sessions yet.</p>}
        </section>
        {status ? <p style={{ margin: 0, opacity: 0.8 }}>{status}</p> : null}
      </div>
    </ClientShell>
  );
}

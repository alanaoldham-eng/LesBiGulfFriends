"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { ClientShell } from "../../components/ClientShell";
import { getCurrentUser } from "../../lib/auth";
import { createInvite, listMyInvites, getMyProfile } from "../../lib/db";

export default function InvitesPage() {
  const [me, setMe] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("");
  const [invites, setInvites] = useState<any[]>([]);
  const [karma, setKarma] = useState<number>(0);

  const refresh = async (uid: string) => {
    const [rows, profile] = await Promise.all([
      listMyInvites(uid).catch(() => []),
      getMyProfile(uid).catch(() => null),
    ]);
    setInvites(rows);
    setKarma(Number(profile?.karma_points || 0));
  };

  useEffect(() => {
    const run = async () => {
      const user = await getCurrentUser();
      if (!user) return;
      setMe(user.id);
      await refresh(user.id);
    };
    run();
  }, []);

  const submit = async () => {
    if (!email.trim()) return;
    try {
      await createInvite(me, email.trim());
      setEmail("");
      setStatus("Invitation recorded. When your friend signs up with that email, the friendship and karma will be created automatically.");
      await refresh(me);
    } catch (e: any) {
      setStatus(e.message || "Unable to create invite.");
    }
  };

  return (
    <ClientShell>
      <section className="hero">
        <h1 style={{ margin: 0, fontSize: 30 }}>Invite friends</h1>
        <p style={{ fontSize: 16, lineHeight: 1.6, opacity: 0.9 }}>
          Invite friends by email. When they join with that email, the friendship is created automatically and you earn karma.
        </p>
      </section>

      <div className="grid">
        <section style={{ border: "1px solid #e9d7e2", borderRadius: 20, padding: 16, background: "#fff" }}>
          <h3 style={{ marginTop: 0 }}>Your karma</h3>
          <p style={{ margin: 0, fontSize: 28, fontWeight: 800 }}>{karma}</p>
        </section>

        <section style={{ border: "1px solid #e9d7e2", borderRadius: 20, padding: 16, background: "#fff" }}>
          <h3 style={{ marginTop: 0 }}>Send an invite</h3>
          <div style={{ display: "grid", gap: 12 }}>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="friend@example.com"
              style={{ padding: "14px 16px", borderRadius: 16, border: "1px solid #d7a8bf", fontSize: 16 }}
            />
            <button className="button" onClick={submit} disabled={!me || !email.trim()}>Invite friend</button>
            {status ? <p style={{ margin: 0, opacity: 0.8 }}>{status}</p> : null}
          </div>
        </section>

        <section style={{ border: "1px solid #e9d7e2", borderRadius: 20, padding: 16, background: "#fff" }}>
          <h3 style={{ marginTop: 0 }}>Your invites</h3>
          {invites.length ? invites.map((inv) => (
            <div key={inv.id} style={{ padding: "10px 0", borderBottom: "1px solid #f1dfe8" }}>
              <strong>{inv.invitee_email}</strong>
              <div style={{ opacity: 0.8 }}>Status: {inv.status}</div>
            </div>
          )) : <p style={{ margin: 0, opacity: 0.8 }}>No invites yet.</p>}
        </section>
      </div>
    </ClientShell>
  );
}

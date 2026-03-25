"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { ClientShell } from "../../components/ClientShell";
import { getCurrentUser } from "../../lib/auth";
import { createInvite, listMyInvites, getMyProfile } from "../../lib/db";

export default function InvitesPage() {
  const [me, setMe] = useState("");
  const [inviterName, setInviterName] = useState("A friend");
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
    setInviterName(profile?.display_name || "A friend");
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

  const sendInviteEmail = async (inviteId: string, inviteeEmail: string) => {
    const res = await fetch("/api/invites/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ inviteeEmail, inviterName }),
    });
    const data = await res.json();
    return { ok: res.ok, ...data };
  };

  const submit = async () => {
    if (!email.trim()) return;
    try {
      const invite = await createInvite(me, email.trim());
      const sendResult = await sendInviteEmail(invite.id, email.trim());

      if (!sendResult.ok) {
        const { updateInviteStatus } = await import("../../lib/db");
        await updateInviteStatus(invite.id, "failed", null, sendResult.error || "Unable to send email", null);
        setStatus(sendResult.error || "Invite created, but email failed to send.");
      } else {
        const { updateInviteStatus } = await import("../../lib/db");
        await updateInviteStatus(invite.id, "sent", sendResult.sentAt, null, sendResult.resendMessageId || null);
        setStatus("Invitation email sent.");
      }

      setEmail("");
      await refresh(me);
    } catch (e: any) {
      setStatus(e.message || "Unable to create invite.");
    }
  };

  const retryInvite = async (inviteId: string, inviteeEmail: string) => {
    try {
      setStatus("Retrying invite...");
      const sendResult = await sendInviteEmail(inviteId, inviteeEmail);
      const { updateInviteStatus } = await import("../../lib/db");
      if (!sendResult.ok) {
        await updateInviteStatus(inviteId, "failed", null, sendResult.error || "Unable to send email", null);
        setStatus(sendResult.error || "Retry failed.");
      } else {
        await updateInviteStatus(inviteId, "sent", sendResult.sentAt, null, sendResult.resendMessageId || null);
        setStatus("Invite email sent.");
      }
      await refresh(me);
    } catch (e: any) {
      setStatus(e.message || "Retry failed.");
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
              <div style={{ opacity: 0.8, marginTop: 4 }}>Status: {inv.status}</div>
              {inv.error_message ? <div style={{ opacity: 0.7, marginTop: 4 }}>Error: {inv.error_message}</div> : null}
              {(inv.status === "failed" || inv.status === "pending") ? (
                <div style={{ marginTop: 8 }}>
                  <button className="button secondary" onClick={() => retryInvite(inv.id, inv.invitee_email)}>Retry send</button>
                </div>
              ) : null}
            </div>
          )) : <p style={{ margin: 0, opacity: 0.8 }}>No invites yet.</p>}
        </section>
      </div>
    </ClientShell>
  );
}

"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { ClientShell } from "../../components/ClientShell";
import { StatusModal } from "../../components/StatusModal";
import { getCurrentUser } from "../../lib/auth";
import { createInvite, listMyInvites, getMyProfile, updateInviteStatus } from "../../lib/db";
import { supabase } from "../../lib/supabase/client";

const tinyBtn: React.CSSProperties = { padding: "6px 8px", borderRadius: 10, border: "1px solid #f1dfe8", background: "#fff", fontSize: 12, lineHeight: 1.1, cursor: "pointer", whiteSpace: "nowrap" };

export default function InvitesPage() {
  const [me, setMe] = useState("");
  const [inviterName, setInviterName] = useState("A friend");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("");
  const [invites, setInvites] = useState<any[]>([]);
  const [karma, setKarma] = useState<number>(0);

  const refresh = async (uid: string) => {
    const [rows, profile] = await Promise.all([listMyInvites(uid).catch(() => []), getMyProfile(uid).catch(() => null)]);
    setInvites(rows);
    setKarma(Number(profile?.karma_points || 0));
    setInviterName(profile?.display_name || "A friend");
  };

  useEffect(() => { (async () => { const user = await getCurrentUser(); if (!user) return; setMe(user.id); await refresh(user.id); })(); }, []);

  const sendInviteEmail = async (inviteeEmail: string) => {
    const res = await fetch("/api/invites/send", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ inviteeEmail, inviterName }) });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.error || "Invite email failed to send.");
    return data;
  };

  const submit = async () => {
    if (!email.trim()) return;
    try {
      const invite = await createInvite(me, email.trim());
      try {
        const sendResult = await sendInviteEmail(email.trim());
        await updateInviteStatus(invite.id, "sent", sendResult.sentAt || new Date().toISOString(), null, sendResult.resendMessageId || null);
        setStatus("Invitation email sent.");
      } catch (sendError: any) {
        await updateInviteStatus(invite.id, "failed", null, sendError.message || "Unable to send email", null);
        setStatus(sendError.message || "Invite created, but email failed to send.");
      }
      setEmail("");
      await refresh(me);
    } catch (e: any) { setStatus(e.message || "Unable to create invite."); }
  };

  const retryInvite = async (inviteId: string, inviteeEmail: string) => {
    try {
      const sendResult = await sendInviteEmail(inviteeEmail);
      await updateInviteStatus(inviteId, "sent", sendResult.sentAt || new Date().toISOString(), null, sendResult.resendMessageId || null);
      setStatus("Invite email sent.");
      await refresh(me);
    } catch (e: any) {
      await updateInviteStatus(inviteId, "failed", null, e.message || "Retry failed", null).catch(() => null);
      setStatus(e.message || "Retry failed.");
      await refresh(me);
    }
  };

  const deleteInvite = async (inviteId: string) => {
    try {
      const { data, error } = await supabase.rpc("delete_invite_rpc", { _invite_id: inviteId });
      if (error) throw error;
      if (!data?.deleted) throw new Error("Invite was not deleted.");
      setStatus("Invite deleted.");
      await refresh(me);
    } catch (e: any) { setStatus(e.message || "Unable to delete invite."); }
  };

  return (
    <ClientShell>
      <section className="hero"><h1 style={{ margin: 0, fontSize: 30 }}>Invite friends</h1><p style={{ fontSize: 16, lineHeight: 1.6, opacity: 0.9 }}>Invite friends by email. Pending or failed invites can be retried or deleted for troubleshooting.</p></section>
      <div className="grid">
        <section style={{ border: "1px solid #e9d7e2", borderRadius: 20, padding: 16, background: "#fff" }}><h3 style={{ marginTop: 0 }}>Your karma</h3><p style={{ margin: 0, fontSize: 28, fontWeight: 800 }}>{karma}</p></section>
        <section style={{ border: "1px solid #e9d7e2", borderRadius: 20, padding: 16, background: "#fff" }}>
          <h3 style={{ marginTop: 0 }}>Send an invite</h3>
          <div style={{ display: "grid", gap: 12 }}><input id="invite-email" name="inviteEmail" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="friend@example.com" style={{ padding: "14px 16px", borderRadius: 16, border: "1px solid #d7a8bf", fontSize: 16 }} /><button className="button" onClick={submit} disabled={!me || !email.trim()}>Invite friend</button></div>
        </section>
        <section style={{ border: "1px solid #e9d7e2", borderRadius: 20, padding: 16, background: "#fff" }}>
          <h3 style={{ marginTop: 0 }}>Your invites</h3>
          {invites.length ? invites.map((inv) => (
            <div key={inv.id} style={{ padding: "10px 0", borderBottom: "1px solid #f1dfe8" }}>
              <strong>{inv.invitee_email}</strong>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 6, alignItems: "center" }}><span style={{ display: "inline-flex", padding: "4px 10px", borderRadius: 999, fontSize: 12, fontWeight: 800, background: inv.status === "sent" ? "#e8f7ee" : inv.status === "joined" ? "#e8f0ff" : inv.status === "failed" ? "#ffe9ea" : "#f4edf1", color: inv.status === "sent" ? "#1e7a43" : inv.status === "joined" ? "#355cde" : inv.status === "failed" ? "#b42318" : "#6b4b5c" }}>{inv.status}</span></div>
              {inv.error_message ? <div style={{ opacity: 0.7, marginTop: 6 }}>Error: {inv.error_message}</div> : null}
              <div style={{ marginTop: 8, display: "flex", gap: 8, flexWrap: "wrap" }}>
                {(inv.status === "failed" || inv.status === "pending") ? <button style={tinyBtn} onClick={() => retryInvite(inv.id, inv.invitee_email)}>Retry send</button> : null}
                {(inv.status === "failed" || inv.status === "pending") ? <button style={tinyBtn} onClick={() => deleteInvite(inv.id)}>Delete Invite</button> : null}
              </div>
            </div>
          )) : <p style={{ margin: 0, opacity: 0.8 }}>No invites yet.</p>}
        </section>
      </div>
      <StatusModal open={!!status} message={status} onClose={() => setStatus("")} />
    </ClientShell>
  );
}

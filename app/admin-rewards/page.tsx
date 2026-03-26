"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { ClientShell } from "../../components/ClientShell";
import { getCurrentUser } from "../../lib/auth";
import { listProfilesForAdmin, rewardUserKarma, grantBadge } from "../../lib/db";

const ADMIN_EMAIL = "alanaoldham@gmail.com";

export default function AdminRewardsPage() {
  const [allowed, setAllowed] = useState(false);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [amount, setAmount] = useState("1");
  const [note, setNote] = useState("Helpful community member");
  const [status, setStatus] = useState("");
  const [badgeUserId, setBadgeUserId] = useState("");
  const [badgeLabel, setBadgeLabel] = useState("OG");
  const [badgeEmoji, setBadgeEmoji] = useState("👑");
  const [badgeKey, setBadgeKey] = useState("og");
  const [badgeElectionKey, setBadgeElectionKey] = useState("");

  useEffect(() => {
    const run = async () => {
      const user = await getCurrentUser();
      if (!user) return;
      const email = user.email?.toLowerCase() || "";
      if (email === ADMIN_EMAIL) {
        setAllowed(true);
        const rows = await listProfilesForAdmin().catch(() => []);
        setProfiles(rows);
      }
    };
    run();
  }, []);

  const reward = async () => {
    try {
      await rewardUserKarma(selectedUserId, Number(amount), note);
      setStatus("Karma reward granted.");
    } catch (e: any) {
      setStatus(e.message || "Unable to reward karma.");
    }
  };

  const giveBadge = async () => {
    try {
      await grantBadge(badgeUserId, badgeKey, badgeLabel, badgeEmoji, badgeElectionKey || null);
      setStatus("Badge granted.");
    } catch (e: any) {
      setStatus(e.message || "Unable to grant badge.");
    }
  };

  return (
    <ClientShell>
      <section className="hero">
        <h1 style={{ margin: 0, fontSize: 30 }}>Admin karma rewards</h1>
        <p style={{ fontSize: 16, lineHeight: 1.6, opacity: 0.9 }}>
          Manually reward helpful members.
        </p>
      </section>

      {!allowed ? (
        <section style={{ border: "1px solid #e9d7e2", borderRadius: 20, padding: 16, background: "#fff" }}>
          <p style={{ margin: 0, opacity: 0.8 }}>This page is only available to the community admin.</p>
        </section>
      ) : (
        <section style={{ border: "1px solid #e9d7e2", borderRadius: 20, padding: 16, background: "#fff" }}>
          <div style={{ display: "grid", gap: 12 }}>
            <select
              id="reward-user-id"
              name="rewardUserId"
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              style={{ padding: "14px 16px", borderRadius: 16, border: "1px solid #d7a8bf", fontSize: 16, background: "#fff" }}
            >
              <option value="">Select member</option>
              {profiles.map((profile) => (
                <option key={profile.id} value={profile.id}>{profile.display_name || profile.id}</option>
              ))}
            </select>
            <input
              id="reward-amount"
              name="rewardAmount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Amount"
              style={{ padding: "14px 16px", borderRadius: 16, border: "1px solid #d7a8bf", fontSize: 16 }}
            />
            <textarea
              id="reward-note"
              name="rewardNote"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Reason"
              style={{ minHeight: 120, padding: "14px 16px", borderRadius: 16, border: "1px solid #d7a8bf", fontSize: 16 }}
            />
            <button className="button" onClick={reward} disabled={!selectedUserId || !amount || !note.trim()}>
              Grant karma
            </button>
            {status ? <p style={{ margin: 0, opacity: 0.8 }}>{status}</p> : null}
          </div>
                  <div style={{ height: 16 }} />
          <section style={{ border: "1px solid #e9d7e2", borderRadius: 20, padding: 16, background: "#fff" }}>
            <h3 style={{ marginTop: 0 }}>Grant badge</h3>
            <div style={{ display: "grid", gap: 12 }}>
              <select id="badge-user-id" name="badgeUserId" value={badgeUserId} onChange={(e) => setBadgeUserId(e.target.value)} style={{ padding: "14px 16px", borderRadius: 16, border: "1px solid #d7a8bf", fontSize: 16, background: "#fff" }}>
                <option value="">Select member</option>
                {profiles.map((profile) => (
                  <option key={profile.id} value={profile.id}>{profile.display_name || profile.id}</option>
                ))}
              </select>
              <input id="badge-key" name="badgeKey" value={badgeKey} onChange={(e) => setBadgeKey(e.target.value)} placeholder="Badge key" style={{ padding: "14px 16px", borderRadius: 16, border: "1px solid #d7a8bf", fontSize: 16 }} />
              <input id="badge-label" name="badgeLabel" value={badgeLabel} onChange={(e) => setBadgeLabel(e.target.value)} placeholder="Badge label" style={{ padding: "14px 16px", borderRadius: 16, border: "1px solid #d7a8bf", fontSize: 16 }} />
              <input id="badge-emoji" name="badgeEmoji" value={badgeEmoji} onChange={(e) => setBadgeEmoji(e.target.value)} placeholder="Badge emoji" style={{ padding: "14px 16px", borderRadius: 16, border: "1px solid #d7a8bf", fontSize: 16 }} />
              <input id="badge-election-key" name="badgeElectionKey" value={badgeElectionKey} onChange={(e) => setBadgeElectionKey(e.target.value)} placeholder="Election key (optional)" style={{ padding: "14px 16px", borderRadius: 16, border: "1px solid #d7a8bf", fontSize: 16 }} />
              <button className="button" onClick={giveBadge} disabled={!badgeUserId || !badgeKey || !badgeLabel || !badgeEmoji}>Grant badge</button>
            </div>
          </section>
        </section>
      )}
    </ClientShell>
  );
}

"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { ClientShell } from "../../components/ClientShell";
import { getCurrentUser } from "../../lib/auth";
import { listReportableProfiles, rewardUserKarma } from "../../lib/db";

const ADMIN_EMAIL = "alanaoldham@gmail.com";

export default function AdminRewardsPage() {
  const [allowed, setAllowed] = useState(false);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [amount, setAmount] = useState("1");
  const [note, setNote] = useState("Helpful community member");
  const [status, setStatus] = useState("");

  useEffect(() => {
    const run = async () => {
      const user = await getCurrentUser();
      if (!user) return;
      const email = user.email?.toLowerCase() || "";
      if (email === ADMIN_EMAIL) {
        setAllowed(true);
        const rows = await listReportableProfiles(user.id).catch(() => []);
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
        </section>
      )}
    </ClientShell>
  );
}

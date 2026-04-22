"use client";
export const dynamic = "force-dynamic";

import { useEffect, useMemo, useState } from "react";
import { ClientShell } from "../../components/ClientShell";
import { getCurrentUser } from "../../lib/auth";
import { grantBadge, listBadgesForUser, listProfilesForAdmin, rewardUserKarma } from "../../lib/db";
import { supabase } from "../../lib/supabase/client";

const ADMIN_EMAIL = "alanaoldham@gmail.com";

export default function AdminRewardsPage() {
  const [allowed, setAllowed] = useState(false);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [amount, setAmount] = useState("1");
  const [note, setNote] = useState("Helpful community member");
  const [status, setStatus] = useState("");
  const [badgeUserId, setBadgeUserId] = useState("");
  const [badgeSelection, setBadgeSelection] = useState("og");
  const [eventBadgeOptions, setEventBadgeOptions] = useState<any[]>([]);

  useEffect(() => {
    const run = async () => {
      const user = await getCurrentUser().catch(() => null);
      const email = user?.email?.toLowerCase() || "";
      if (email !== ADMIN_EMAIL) return;
      setAllowed(true);

      const [rows, eventsRes] = await Promise.all([
        listProfilesForAdmin().catch(() => []),
        supabase.from("events").select("id, title, starts_at").order("starts_at", { ascending: false }).limit(200),
      ]);
      setProfiles(rows);
      setEventBadgeOptions((eventsRes.data || []).map((ev: any) => ({
        value: `event:${ev.id}`,
        label: `${ev.title} (${new Date(ev.starts_at).toLocaleDateString()})`,
        badgeKey: "event_attended",
        badgeLabel: `Attended ${ev.title} • ${new Date(ev.starts_at).toLocaleDateString()}`,
        badgeEmoji: "😊",
      })));
    };
    run();
  }, []);

  const badgeOptions = useMemo(() => ([
    { value: "og", label: "OG badge", badgeKey: "og", badgeLabel: "OG", badgeEmoji: "👑" },
    ...eventBadgeOptions,
  ]), [eventBadgeOptions]);

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
      const selected = badgeOptions.find((b) => b.value === badgeSelection);
      if (!selected) throw new Error("Select a badge first.");
      const existing = await listBadgesForUser(badgeUserId).catch(() => []);
      const already = (existing || []).some((b: any) => b.badge_key === selected.badgeKey && b.badge_label === selected.badgeLabel);
      if (already) {
        setStatus("That user already has that badge.");
        return;
      }
      await grantBadge(badgeUserId, selected.badgeKey, selected.badgeLabel, selected.badgeEmoji, null);
      setStatus("Badge granted.");
    } catch (e: any) {
      setStatus(e.message || "Unable to grant badge.");
    }
  };

  return (
    <ClientShell>
      <section className="hero">
        <h1 style={{ margin: 0, fontSize: 30 }}>Admin Magic Wand</h1>
        <p style={{ fontSize: 16, lineHeight: 1.6, opacity: 0.9 }}>Manually reward helpful members and grant badges.</p>
      </section>

      {!allowed ? (
        <section style={{ border: "1px solid #e9d7e2", borderRadius: 20, padding: 16, background: "#fff" }}>
          <p style={{ margin: 0, opacity: 0.8 }}>This page is only available to the community admin.</p>
        </section>
      ) : (
        <section style={{ border: "1px solid #e9d7e2", borderRadius: 20, padding: 16, background: "#fff" }}>
          <div style={{ display: "grid", gap: 12 }}>
            <select value={selectedUserId} onChange={(e) => setSelectedUserId(e.target.value)} style={{ padding: "14px 16px", borderRadius: 16, border: "1px solid #d7a8bf", fontSize: 16, background: "#fff" }}>
              <option value="">Select member</option>
              {profiles.map((profile: any) => <option key={profile.id} value={profile.id}>{profile.display_name || profile.id}</option>)}
            </select>
            <input value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Amount" style={{ padding: "14px 16px", borderRadius: 16, border: "1px solid #d7a8bf", fontSize: 16 }} />
            <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Reason" style={{ minHeight: 120, padding: "14px 16px", borderRadius: 16, border: "1px solid #d7a8bf", fontSize: 16 }} />
            <button className="button" onClick={reward} disabled={!selectedUserId || !amount || !note.trim()}>Grant karma</button>
          </div>

          <div style={{ height: 16 }} />
          <section style={{ border: "1px solid #e9d7e2", borderRadius: 20, padding: 16, background: "#fff" }}>
            <h3 style={{ marginTop: 0 }}>Grant badge</h3>
            <div style={{ display: "grid", gap: 12 }}>
              <select value={badgeUserId} onChange={(e) => setBadgeUserId(e.target.value)} style={{ padding: "14px 16px", borderRadius: 16, border: "1px solid #d7a8bf", fontSize: 16, background: "#fff" }}>
                <option value="">Select member</option>
                {profiles.map((profile: any) => <option key={profile.id} value={profile.id}>{profile.display_name || profile.id}</option>)}
              </select>
              <select value={badgeSelection} onChange={(e) => setBadgeSelection(e.target.value)} style={{ padding: "14px 16px", borderRadius: 16, border: "1px solid #d7a8bf", fontSize: 16, background: "#fff" }}>
                {badgeOptions.map((badge: any) => <option key={badge.value} value={badge.value}>{badge.label}</option>)}
              </select>
              <button className="button" onClick={giveBadge} disabled={!badgeUserId || !badgeSelection}>Grant badge</button>
            </div>
          </section>
          {status ? <p style={{ marginTop: 12, opacity: 0.8 }}>{status}</p> : null}
        </section>
      )}
    </ClientShell>
  );
}

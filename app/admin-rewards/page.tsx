"use client";
export const dynamic = "force-dynamic";

import { useEffect, useMemo, useState } from "react";
import { ClientShell } from "../../components/ClientShell";
import { getCurrentUser } from "../../lib/auth";
import {
  banMember,
  grantBadge,
  listBadgesForUser,
  listProfilesForAdmin,
  rewardUserKarma,
  setMemberModerator,
} from "../../lib/db";
import { supabase } from "../../lib/supabase/client";

const ADMIN_EMAIL = "alanaoldham@gmail.com";

export default function AdminDashboardPage() {
  const [allowed, setAllowed] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [amount, setAmount] = useState("1");
  const [note, setNote] = useState("Helpful community member");
  const [status, setStatus] = useState("");
  const [badgeUserId, setBadgeUserId] = useState("");
  const [badgeSelection, setBadgeSelection] = useState("og");
  const [eventBadgeOptions, setEventBadgeOptions] = useState<any[]>([]);
  const [removeUserId, setRemoveUserId] = useState("");
  const [removeReason, setRemoveReason] = useState("");
  const [moderatorWorkingId, setModeratorWorkingId] = useState("");
  const [contentSources, setContentSources] = useState<any[]>([]);
  const [contentTitle, setContentTitle] = useState("Handsome");
  const [contentSlug, setContentSlug] = useState("handsome");
  const [contentRssUrl, setContentRssUrl] = useState("https://rss.art19.com/handsome");
  const [contentDescription, setContentDescription] = useState("Funny, warm, and easy to throw on during a walk or drive.");
  const [contentFeaturedRank, setContentFeaturedRank] = useState("1");
  const [syncingContent, setSyncingContent] = useState(false);

  const refreshProfiles = async () => {
    const rows = await listProfilesForAdmin().catch(() => []);
    setProfiles(rows);
  };

  const refreshContentSources = async () => {
    const { data } = await supabase
      .from("content_sources")
      .select("id, slug, title, description, rss_url, is_active, is_featured, featured_rank, updated_at")
      .order("featured_rank", { ascending: true, nullsFirst: false })
      .order("title", { ascending: true });

    setContentSources(data || []);
  };

  useEffect(() => {
    const run = async () => {
      const user = await getCurrentUser().catch(() => null);
      const email = user?.email?.toLowerCase() || "";
      const admin = email === ADMIN_EMAIL;
      let moderator = false;

      if (user?.id) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("is_moderator, is_banned, membership_status")
          .eq("id", user.id)
          .maybeSingle();

        moderator =
          !!profile?.is_moderator &&
          !profile?.is_banned &&
          !["removed", "banned"].includes(String(profile?.membership_status || "").toLowerCase());
      }

      if (!admin && !moderator) return;

      setAllowed(true);
      setIsAdmin(admin);

      const [rows, eventsRes] = await Promise.all([
        listProfilesForAdmin().catch(() => []),
        supabase
          .from("events")
          .select("id, title, starts_at")
          .order("starts_at", { ascending: false })
          .limit(200),
      ]);

      setProfiles(rows);
      setEventBadgeOptions(
        (eventsRes.data || []).map((ev: any) => ({
          value: `event:${ev.id}`,
          label: `${ev.title} (${new Date(ev.starts_at).toLocaleDateString()})`,
          badgeKey: "event_attended",
          badgeLabel: `Attended ${ev.title} • ${new Date(ev.starts_at).toLocaleDateString()}`,
          badgeEmoji: "😊",
        }))
      );

      await refreshContentSources().catch(() => null);
    };

    run();
  }, []);

  const badgeOptions = useMemo(
    () => [
      { value: "og", label: "OG badge", badgeKey: "og", badgeLabel: "OG", badgeEmoji: "👑" },
      ...eventBadgeOptions,
    ],
    [eventBadgeOptions]
  );

  const reward = async () => {
    try {
      await rewardUserKarma(selectedUserId, Number(amount), note);
      setStatus("Karma reward granted.");
      await refreshProfiles();
    } catch (e: any) {
      setStatus(e.message || "Unable to reward karma.");
    }
  };

  const toggleModerator = async (userId: string, currentlyMod: boolean) => {
    if (!userId || moderatorWorkingId) return;

    setModeratorWorkingId(userId);

    try {
      await setMemberModerator(userId, !currentlyMod);
      setStatus(currentlyMod ? "Moderator privileges removed." : "Moderator privileges granted.");
      await refreshProfiles();
    } catch (e: any) {
      setStatus(e.message || "Unable to update moderator status.");
    } finally {
      setModeratorWorkingId("");
    }
  };

  const removeAndBan = async () => {
    if (!removeUserId || !removeReason.trim()) return;

    const confirmed = window.confirm("Remove and ban this member?");
    if (!confirmed) return;

    try {
      await banMember(removeUserId, removeReason.trim());
      setStatus("Member removed and banned.");
      setRemoveUserId("");
      setRemoveReason("");
      await refreshProfiles();
    } catch (e: any) {
      setStatus(e.message || "Unable to remove member.");
    }
  };

  const giveBadge = async () => {
    try {
      const selected = badgeOptions.find((b) => b.value === badgeSelection);
      if (!selected) throw new Error("Select a badge first.");

      const existing = await listBadgesForUser(badgeUserId).catch(() => []);
      const already = (existing || []).some(
        (b: any) => b.badge_key === selected.badgeKey && b.badge_label === selected.badgeLabel
      );

      if (already) {
        setStatus("That user already has that badge.");
        return;
      }

      await grantBadge(
        badgeUserId,
        selected.badgeKey,
        selected.badgeLabel,
        selected.badgeEmoji,
        null
      );

      setStatus("Badge granted.");
    } catch (e: any) {
      setStatus(e.message || "Unable to grant badge.");
    }
  };

  const syncRss = async (source?: any) => {
    setSyncingContent(true);
    setStatus("");

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;

      const payload = source
        ? {
            title: source.title,
            slug: source.slug,
            rssUrl: source.rss_url,
            description: source.description,
            isFeatured: source.is_featured,
            featuredRank: source.featured_rank,
          }
        : {
            title: contentTitle,
            slug: contentSlug,
            rssUrl: contentRssUrl,
            description: contentDescription,
            editorialNote: contentDescription,
            isFeatured: true,
            featuredRank: Number(contentFeaturedRank || 1),
          };

      const res = await fetch("/api/content/rss-sync", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token || ""}`,
        },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error || "Unable to sync RSS.");

      setStatus(`RSS synced. ${json.syncedCount || 0} item(s) imported.`);
      await refreshContentSources();
    } catch (e: any) {
      setStatus(e.message || "Unable to sync RSS.");
    } finally {
      setSyncingContent(false);
    }
  };

  return (
    <ClientShell>
      <section className="hero">
        <h1 style={{ margin: 0, fontSize: 30 }}>Admin Dashboard</h1>
        <p style={{ fontSize: 16, lineHeight: 1.6, opacity: 0.9 }}>
          Manage reception, community rewards, moderators, safety, and curated content.
        </p>
      </section>

      {!allowed ? (
        <section style={{ border: "1px solid #e9d7e2", borderRadius: 20, padding: 16, background: "#fff" }}>
          <p style={{ margin: 0, opacity: 0.8 }}>This page is only available to admins and moderators.</p>
        </section>
      ) : (
        <div className="grid">
          <section style={{ border: "1px solid #e9d7e2", borderRadius: 20, padding: 16, background: "#fff7fb" }}>
            <h3 style={{ marginTop: 0 }}>Curate featured content</h3>
            <p style={{ opacity: 0.8, lineHeight: 1.6 }}>
              Add an RSS feed, feature it on the landing page, and sync episodes/items into the content page.
            </p>

            <div style={{ display: "grid", gap: 12 }}>
              <input value={contentTitle} onChange={(e) => setContentTitle(e.target.value)} placeholder="Source title" style={{ padding: "14px 16px", borderRadius: 16, border: "1px solid #d7a8bf", fontSize: 16 }} />
              <input value={contentSlug} onChange={(e) => setContentSlug(e.target.value)} placeholder="URL slug, e.g. handsome" style={{ padding: "14px 16px", borderRadius: 16, border: "1px solid #d7a8bf", fontSize: 16 }} />
              <input value={contentRssUrl} onChange={(e) => setContentRssUrl(e.target.value)} placeholder="RSS feed URL" style={{ padding: "14px 16px", borderRadius: 16, border: "1px solid #d7a8bf", fontSize: 16 }} />
              <textarea value={contentDescription} onChange={(e) => setContentDescription(e.target.value)} placeholder="Editorial note" style={{ minHeight: 90, padding: "14px 16px", borderRadius: 16, border: "1px solid #d7a8bf", fontSize: 16 }} />
              <input value={contentFeaturedRank} onChange={(e) => setContentFeaturedRank(e.target.value)} placeholder="Featured rank" style={{ padding: "14px 16px", borderRadius: 16, border: "1px solid #d7a8bf", fontSize: 16 }} />
              <button className="button" onClick={() => syncRss()} disabled={syncingContent || !contentTitle || !contentSlug || !contentRssUrl}>
                {syncingContent ? "Syncing..." : "Add / Sync RSS"}
              </button>
            </div>

            {contentSources.length ? (
              <div style={{ marginTop: 16, display: "grid", gap: 10 }}>
                {contentSources.map((source: any) => (
                  <div key={source.id} style={{ border: "1px solid #f1dfe8", borderRadius: 16, padding: 12, background: "#fff" }}>
                    <strong>{source.title}</strong>
                    <p style={{ margin: "6px 0", opacity: 0.75 }}>{source.rss_url || "No RSS feed set."}</p>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      <a className="button secondary" href={`/content/${source.slug}`}>Open page</a>
                      {source.rss_url ? (
                        <button className="button secondary" onClick={() => syncRss(source)} disabled={syncingContent}>
                          Sync RSS
                        </button>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
          </section>

          {isAdmin ? (
            <>
              <section style={{ border: "1px solid #e9d7e2", borderRadius: 20, padding: 16, background: "#fff" }}>
                <h3 style={{ marginTop: 0 }}>Grant karma</h3>
                <div style={{ display: "grid", gap: 12 }}>
                  <select value={selectedUserId} onChange={(e) => setSelectedUserId(e.target.value)} style={{ padding: "14px 16px", borderRadius: 16, border: "1px solid #d7a8bf", fontSize: 16, background: "#fff" }}>
                    <option value="">Select member</option>
                    {profiles.map((profile: any) => <option key={profile.id} value={profile.id}>{profile.display_name || profile.id}</option>)}
                  </select>
                  <input value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Amount" style={{ padding: "14px 16px", borderRadius: 16, border: "1px solid #d7a8bf", fontSize: 16 }} />
                  <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Reason" style={{ minHeight: 100, padding: "14px 16px", borderRadius: 16, border: "1px solid #d7a8bf", fontSize: 16 }} />
                  <button className="button" onClick={reward} disabled={!selectedUserId || !amount || !note.trim()}>Grant karma</button>
                </div>
              </section>

              <section style={{ border: "1px solid #e9d7e2", borderRadius: 20, padding: 16, background: "#fff" }}>
                <h3 style={{ marginTop: 0 }}>Toggle moderator status</h3>
                <div style={{ display: "grid", gap: 10 }}>
                  {profiles.filter((profile: any) => !profile.is_banned).map((profile: any) => (
                    <div key={profile.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap", borderBottom: "1px solid #f1dfe8", padding: "10px 0" }}>
                      <div>
                        <strong>{profile.display_name || profile.id}</strong>
                        <div style={{ fontSize: 12, opacity: 0.7 }}>{profile.is_moderator ? "Moderator" : "Member"}</div>
                      </div>
                      <button className="button secondary" onClick={() => toggleModerator(profile.id, !!profile.is_moderator)} disabled={moderatorWorkingId === profile.id}>
                        {moderatorWorkingId === profile.id ? "Working..." : profile.is_moderator ? "Remove Mod" : "Make Mod"}
                      </button>
                    </div>
                  ))}
                </div>
              </section>

              <section style={{ border: "1px solid #e9d7e2", borderRadius: 20, padding: 16, background: "#fff7fb" }}>
                <h3 style={{ marginTop: 0 }}>Remove / Ban member</h3>
                <div style={{ display: "grid", gap: 12 }}>
                  <select value={removeUserId} onChange={(e) => setRemoveUserId(e.target.value)} style={{ padding: "14px 16px", borderRadius: 16, border: "1px solid #d7a8bf", fontSize: 16, background: "#fff" }}>
                    <option value="">Select member to remove</option>
                    {profiles.map((profile: any) => (
                      <option key={profile.id} value={profile.id}>{profile.display_name || profile.id}{profile.is_banned ? " — BANNED" : ""}</option>
                    ))}
                  </select>
                  <textarea value={removeReason} onChange={(e) => setRemoveReason(e.target.value)} placeholder="Required reason for removal" style={{ minHeight: 100, padding: "14px 16px", borderRadius: 16, border: "1px solid #d7a8bf", fontSize: 16 }} />
                  <button className="button" onClick={removeAndBan} disabled={!removeUserId || !removeReason.trim()}>Remove and ban member</button>
                </div>
              </section>

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
            </>
          ) : null}

          {status ? <p style={{ margin: 0, opacity: 0.8 }}>{status}</p> : null}
        </div>
      )}
    </ClientShell>
  );
}

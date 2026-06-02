"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ClientShell } from "../../../components/ClientShell";
import { getCurrentUser } from "../../../lib/auth";
import { sendFriendRequest } from "../../../lib/db";
import {
  areUsersFriendsFast,
  getMemberDisplayNameFast,
  getPublicMemberProfileFast,
  listMemberBadgesFast,
} from "../../../lib/memberProfile";

async function sendFriendRequestEmailNotification(recipientUserId: string, requesterName: string) {
  try {
    await fetch("/api/notifications/friend-request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ recipientUserId, requesterName }),
    });
  } catch {}
}

function LoadingProfileCard() {
  return (
    <ClientShell>
      <section className="hero">
        <h1 style={{ margin: 0, fontSize: 30 }}>Loading member profile...</h1>
        <p style={{ fontSize: 16, lineHeight: 1.6, opacity: 0.85 }}>
          Pulling up their public profile.
        </p>
      </section>

      <div className="grid">
        <section style={{ border: "1px solid #e9d7e2", borderRadius: 20, padding: 16, background: "#fff" }}>
          <div style={{ width: 120, height: 120, borderRadius: 20, background: "#fff7fb", border: "1px solid #ead5df", marginBottom: 12 }} />
          <div style={{ width: "45%", height: 18, borderRadius: 999, background: "#f1dfe8", marginBottom: 12 }} />
          <div style={{ width: "90%", height: 12, borderRadius: 999, background: "#f1dfe8", marginBottom: 8 }} />
          <div style={{ width: "70%", height: 12, borderRadius: 999, background: "#f1dfe8" }} />
        </section>
      </div>
    </ClientShell>
  );
}

export default function MemberProfilePage() {
  const params = useParams<{ id: string }>();
  const memberId = params?.id || "";
  const [me, setMe] = useState("");
  const [profile, setProfile] = useState<any | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [profileUnavailable, setProfileUnavailable] = useState(false);
  const [isFriend, setIsFriend] = useState(false);
  const [friendshipLoaded, setFriendshipLoaded] = useState(false);
  const [status, setStatus] = useState("");
  const [badges, setBadges] = useState<any[]>([]);
  const [badgesLoaded, setBadgesLoaded] = useState(false);
  const [eventBadgesOpen, setEventBadgesOpen] = useState(false);
  const [votedBadgesOpen, setVotedBadgesOpen] = useState(false);
  const [myName, setMyName] = useState("A member");

  useEffect(() => {
    if (!memberId) return;

    let mounted = true;

    const run = async () => {
      setIsLoadingProfile(true);
      setProfileUnavailable(false);
      setBadges([]);
      setBadgesLoaded(false);
      setIsFriend(false);
      setFriendshipLoaded(false);
      setStatus("");

      const user = await getCurrentUser().catch(() => null);
      if (!mounted) return;

      if (!user) {
        setIsLoadingProfile(false);
        setProfileUnavailable(true);
        return;
      }

      setMe(user.id);

      const memberProfile = await getPublicMemberProfileFast(memberId).catch(() => null);
      if (!mounted) return;

      if (!memberProfile) {
        setProfile(null);
        setIsLoadingProfile(false);
        setProfileUnavailable(true);
        return;
      }

      setProfile(memberProfile);
      setIsLoadingProfile(false);

      // Secondary details should not block the profile from appearing.
      void Promise.all([
        user.id === memberId
          ? Promise.resolve(false)
          : areUsersFriendsFast(user.id, memberId).catch(() => false),
        listMemberBadgesFast(memberId).catch(() => []),
        getMemberDisplayNameFast(user.id).catch(() => "A member"),
      ]).then(([friend, badgeRows, displayName]) => {
        if (!mounted) return;
        setIsFriend(!!friend);
        setFriendshipLoaded(true);
        setBadges(badgeRows || []);
        setBadgesLoaded(true);
        setMyName(displayName || "A member");
      });
    };

    run();

    return () => {
      mounted = false;
    };
  }, [memberId]);

  const addFriend = async () => {
    if (!me || !memberId) return;
    try {
      const result: any = await sendFriendRequest(me, memberId);
      setStatus(result?.duplicate ? "Friend request already pending." : "Friend request sent.");
      setIsFriend(true);
      if (!result?.duplicate) await sendFriendRequestEmailNotification(memberId, myName);
    } catch (e: any) {
      setStatus(e.message || "Unable to send friend request.");
    }
  };

  const mainPhoto = profile?.photo_urls?.[0] || profile?.photo_url || null;
  const extraPhotos = (profile?.photo_urls || []).slice(1, 3);
  const isSelf = me === memberId;

  const parseBadgeDate = (badge: any) => {
    const raw = `${badge.badge_label || ""} ${badge.created_at || ""}`;
    const paren = String(badge.badge_label || "").match(/\(([^)]+)\)/)?.[1];
    const parsed = Date.parse(paren || badge.event_date || badge.expires_at || badge.created_at || raw);
    return Number.isFinite(parsed) ? parsed : 0;
  };

  const badgeGroups = useMemo(() => {
    const rows = badges || [];
    const og = rows.filter((badge: any) =>
      String(badge.badge_key || "").toLowerCase().includes("og") ||
      String(badge.badge_label || "").toLowerCase().includes("og")
    );

    const voted = rows
      .filter((badge: any) =>
        String(badge.badge_key || "").toLowerCase().includes("voted") ||
        String(badge.badge_key || "").toLowerCase().includes("vote") ||
        String(badge.badge_label || "").toLowerCase().includes("voted") ||
        String(badge.badge_label || "").includes("🗳️")
      )
      .sort((a: any, b: any) => parseBadgeDate(b) - parseBadgeDate(a));

    const events = rows
      .filter((badge: any) => {
        const key = String(badge.badge_key || "").toLowerCase();
        const label = String(badge.badge_label || "").toLowerCase();
        const isOg = og.some((ogBadge: any) => ogBadge.id === badge.id);
        const isVoted = voted.some((voteBadge: any) => voteBadge.id === badge.id);
        return !isOg && !isVoted && (key.includes("event") || key.includes("attended") || label.includes("event") || label.includes("attended"));
      })
      .sort((a: any, b: any) => parseBadgeDate(b) - parseBadgeDate(a));

    const used = new Set([...og, ...voted, ...events].map((badge: any) => badge.id));
    const other = rows.filter((badge: any) => !used.has(badge.id));

    return { og, events, voted, other };
  }, [badges]);

  const renderBadge = (badge: any) => (
    <span key={badge.id} style={{ padding: "6px 10px", borderRadius: 999, background: "#fff7fb", border: "1px solid #f1dfe8", display: "inline-flex", gap: 4, alignItems: "center" }}>
      {badge.emoji ? <span>{badge.emoji}</span> : null}
      <span>{badge.badge_label}</span>
    </span>
  );

  if (isLoadingProfile) return <LoadingProfileCard />;

  if (profileUnavailable) {
    return (
      <ClientShell>
        <section className="hero">
          <h1 style={{ margin: 0, fontSize: 30 }}>Member unavailable</h1>
          <p style={{ fontSize: 16, lineHeight: 1.6, opacity: 0.9 }}>
            This profile is no longer available.
          </p>
        </section>
      </ClientShell>
    );
  }

  return (
    <ClientShell>
      <section className="hero">
        <h1 style={{ margin: 0, fontSize: 30 }}>{profile?.display_name || "Member profile"}</h1>
        <p style={{ fontSize: 16, lineHeight: 1.6, opacity: 0.9 }}>
          View this member’s public profile.
        </p>
      </section>

      <div className="grid">
        <section style={{ border: "1px solid #e9d7e2", borderRadius: 20, padding: 16, background: "#fff" }}>
          {mainPhoto ? <img src={mainPhoto} alt={profile?.display_name || "Profile"} style={{ width: 120, height: 120, objectFit: "cover", borderRadius: 20, border: "1px solid #ead5df", marginBottom: 12 }} /> : null}
          <h3 style={{ marginTop: 0 }}>{profile?.display_name || "Unknown member"}</h3>
          <p style={{ opacity: 0.8 }}>{profile?.bio || "No bio yet."}</p>
          {extraPhotos.length ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: 12, marginTop: 12, marginBottom: 12 }}>
              {extraPhotos.map((url: string, idx: number) => (
                <img key={url} src={url} alt={`Additional profile ${idx + 2}`} style={{ width: "100%", aspectRatio: "1 / 1", objectFit: "cover", borderRadius: 18, border: "1px solid #ead5df" }} />
              ))}
            </div>
          ) : null}
          {profile?.city ? <p style={{ opacity: 0.75 }}>City: {profile.city}</p> : null}
          {profile?.relationship_status ? <p style={{ opacity: 0.75 }}>Relationship status: {profile.relationship_status}</p> : null}

          {!badgesLoaded ? (
            <p style={{ opacity: 0.65 }}>Loading badges...</p>
          ) : badges.length ? (
            <div className="badge-stack" style={{ display: "grid", gap: 10, marginBottom: 12 }}>
              {badgeGroups.og.length ? (
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {badgeGroups.og.map(renderBadge)}
                </div>
              ) : null}

              {badgeGroups.events.length ? (
                <section style={{ border: "1px solid #f1dfe8", borderRadius: 16, padding: 10, background: "#fffafc" }}>
                  <button type="button" className="button secondary" onClick={() => setEventBadgesOpen((v) => !v)}>
                    {eventBadgesOpen ? "Hide Event Badges" : `Show Event Badges (${badgeGroups.events.length})`}
                  </button>
                  {eventBadgesOpen ? <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 10 }}>{badgeGroups.events.map(renderBadge)}</div> : null}
                </section>
              ) : null}

              {badgeGroups.voted.length ? (
                <section style={{ border: "1px solid #f1dfe8", borderRadius: 16, padding: 10, background: "#fffafc" }}>
                  <button type="button" className="button secondary" onClick={() => setVotedBadgesOpen((v) => !v)}>
                    {votedBadgesOpen ? "Hide Voted 🗳️ Badges" : `Show Voted 🗳️ Badges (${badgeGroups.voted.length})`}
                  </button>
                  {votedBadgesOpen ? <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 10 }}>{badgeGroups.voted.map(renderBadge)}</div> : null}
                </section>
              ) : null}

              {badgeGroups.other.length ? <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>{badgeGroups.other.map(renderBadge)}</div> : null}
            </div>
          ) : null}

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12 }}>
            {!isSelf && friendshipLoaded && !isFriend ? <button className="button" onClick={addFriend}>Add Friend</button> : null}
            {!isSelf && friendshipLoaded && isFriend ? <Link className="button secondary" href={`/messages?thread=${encodeURIComponent(memberId)}`}>Chat</Link> : null}
          </div>
          {status ? <p style={{ marginTop: 12, opacity: 0.8 }}>{status}</p> : null}
        </section>
      </div>
    </ClientShell>
  );
}

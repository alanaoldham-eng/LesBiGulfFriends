"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { ClientShell } from "../../../components/ClientShell";
import { getCurrentUser } from "../../../lib/auth";
import { getProfileById, getFriendIds, sendFriendRequest, listBadgesForUser, getMyProfile } from "../../../lib/db";

async function sendFriendRequestEmailNotification(recipientUserId: string, requesterName: string) {
  try {
    await fetch("/api/notifications/friend-request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ recipientUserId, requesterName }),
    });
  } catch {}
}

export default function MemberProfilePage() {
  const params = useParams<{ id: string }>();
  const memberId = params.id;
  const [me, setMe] = useState("");
  const [profile, setProfile] = useState<any | null>(null);
  const [friendIds, setFriendIds] = useState<Set<string>>(new Set());
  const [status, setStatus] = useState("");
  const [badges, setBadges] = useState<any[]>([]);
  const [myName, setMyName] = useState("A member");

  useEffect(() => {
    const run = async () => {
      const user = await getCurrentUser();
      if (!user) return;
      setMe(user.id);
      const [p, ids, badgeRows]: [any, Set<string>, any[]] = await Promise.all([
        getProfileById(memberId).catch(() => null),
        getFriendIds(user.id).catch(() => new Set<string>()),
        listBadgesForUser(memberId).catch(() => []),
      ]);
      setProfile(p);
      setFriendIds(ids);
      setBadges(badgeRows);
    };
    run();
  }, [memberId]);

  const addFriend = async () => {
    try {
      const result: any = await sendFriendRequest(me, memberId);
      setStatus(result?.duplicate ? "Friend request already pending." : "Friend request sent.");
      if (!result?.duplicate) await sendFriendRequestEmailNotification(memberId, myName);
    } catch (e: any) {
      setStatus(e.message || "Unable to send friend request.");
    }
  };

  const mainPhoto = profile?.photo_urls?.[0] || profile?.photo_url || null;
  const isSelf = me === memberId;
  const isFriend = friendIds.has(memberId);

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
          {profile?.city ? <p style={{ opacity: 0.75 }}>City: {profile.city}</p> : null}
          {profile?.relationship_status ? <p style={{ opacity: 0.75 }}>Relationship status: {profile.relationship_status}</p> : null}
          {badges.length ? <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>{badges.map((badge) => <span key={badge.id} style={{ padding: "6px 10px", borderRadius: 999, background: "#fff7fb", border: "1px solid #f1dfe8" }}>{badge.emoji} {badge.badge_label}</span>)}</div> : null}
          {!isSelf && !isFriend ? <button className="button" onClick={addFriend}>Add Friend</button> : null}
          {status ? <p style={{ marginTop: 12, opacity: 0.8 }}>{status}</p> : null}
        </section>
      </div>
    </ClientShell>
  );
}

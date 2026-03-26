"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { ClientShell } from "../../../components/ClientShell";
import { getCurrentUser } from "../../../lib/auth";
import { getProfileById, getFriendIds, sendFriendRequest } from "../../../lib/db";

export default function MemberProfilePage() {
  const params = useParams<{ id: string }>();
  const memberId = params.id;
  const [me, setMe] = useState("");
  const [profile, setProfile] = useState<any | null>(null);
  const [friendIds, setFriendIds] = useState<Set<string>>(new Set<string>());
  const [status, setStatus] = useState("");

  useEffect(() => {
    const run = async () => {
      const user = await getCurrentUser();
      if (!user) return;
      setMe(user.id);
      const [p, ids] = await Promise.all([
        getProfileById(memberId).catch(() => null),
        getFriendIds(user.id).catch(() => new Set<string>()),
      ]);
      setProfile(p);
      setFriendIds(ids);
    };
    run();
  }, [memberId]);

  const addFriend = async () => {
    try {
      await sendFriendRequest(me, memberId);
      setStatus("Friend request sent.");
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
          {!isSelf && !isFriend ? <button className="button" onClick={addFriend}>Add Friend</button> : null}
          {status ? <p style={{ marginTop: 12, opacity: 0.8 }}>{status}</p> : null}
        </section>
      </div>
    </ClientShell>
  );
}

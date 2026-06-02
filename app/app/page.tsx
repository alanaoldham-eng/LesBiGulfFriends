"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ClientShell } from "../../components/ClientShell";
import { getCurrentUser } from "../../lib/auth";
import { getKreweCompletionStatus } from "../../lib/kreweVibe";
import { listFriends, listMyGroups, getMyProfile, isProfileComplete } from "../../lib/db";
import {
  getFeaturedContentSources,
  listConfessions,
  getViewerRoleFlags,
  listWaitingRoomCandidates,
} from "../../lib/roadmap";

const ADMIN_EMAIL = "alanaoldham@gmail.com";

function formatKarma(value: any) {
  const num = Number(value || 0);
  return Number.isInteger(num) ? String(num) : num.toFixed(1).replace(/\.0$/, "");
}

export default function AppHomePage() {
  const [name, setName] = useState("member");
  const [friendCount, setFriendCount] = useState(0);
  const [groupCount, setGroupCount] = useState(0);
  const [karmaPoints, setKarmaPoints] = useState(0);
  const [featuredSources, setFeaturedSources] = useState<any[]>([]);
  const [recentConfessions, setRecentConfessions] = useState<any[]>([]);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const [needsKreweVibe, setNeedsKreweVibe] = useState(false);
  const [canReview, setCanReview] = useState(false);
  const [waitingCount, setWaitingCount] = useState(0);

  useEffect(() => {
    const run = async () => {
      const user = await getCurrentUser().catch(() => null);
      if (!user) return;

      const [friends, groups, profile, sources, confessions, roleFlags, waiting, vibe] = await Promise.all([
        listFriends(user.id).catch(() => []),
        listMyGroups(user.id).catch(() => []),
        getMyProfile(user.id).catch(() => null),
        getFeaturedContentSources().catch(() => []),
        listConfessions(3).catch(() => []),
        getViewerRoleFlags(user.id).catch(() => ({ canReview: false })),
        listWaitingRoomCandidates().catch(() => []),
        getKreweCompletionStatus(user.id).catch(() => ({ complete: true })),
      ]);

      const email = user.email?.toLowerCase() || "";
      const reviewer = email === ADMIN_EMAIL || !!roleFlags?.canReview;

      setFriendCount(friends.length);
      setGroupCount(groups.length);
      setName(profile?.display_name || user.email?.split("@")[0] || "member");
      setKarmaPoints(Number(profile?.karma_points || 0));
      setFeaturedSources(sources);
      setRecentConfessions(confessions);
      setNeedsOnboarding(!isProfileComplete(profile));
      setNeedsKreweVibe(!vibe.complete && String(profile?.membership_status || "").toLowerCase() === "waiting");
      setCanReview(reviewer);
      setWaitingCount(
        reviewer
          ? (waiting || []).filter((x: any) => x.status === "waiting" || x.status === "questioned").length
          : 0
      );
    };

    run();
  }, []);

  return (
    <ClientShell>
      <section className="hero">
        <h1 style={{ margin: 0, fontSize: 30 }}>Welcome, {name}</h1>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 14 }}>
          <Link className="button" href="/groups-app">Browse Groups</Link>
        </div>
      </section>

      <div className="grid">
        {needsOnboarding ? (
          <section style={{ border: "1px solid #e9d7e2", borderRadius: 20, padding: 16, background: "#fff7fb" }}>
            <h3 style={{ marginTop: 0 }}>Finish your profile</h3>
            <p style={{ opacity: 0.85, lineHeight: 1.6 }}>
              Complete your name and add at least one photo, then go to the Main group so you can post your introduction.
            </p>
            <Link className="button" href="/onboarding/profile">Complete profile</Link>
          </section>
        ) : null}

        {needsKreweVibe ? (
          <section style={{ border: "1px solid #e9d7e2", borderRadius: 20, padding: 16, background: "#fff7fb" }}>
            <h3 style={{ marginTop: 0 }}>Reception step</h3>
            <p style={{ opacity: 0.85, lineHeight: 1.6 }}>
              Complete Krewe Vibe so moderators can review your reception request.
            </p>
            <Link className="button" href="/krewe-vibe">Complete Krewe Vibe</Link>
          </section>
        ) : null}

        {canReview ? (
          <section style={{ border: "1px solid #e9d7e2", borderRadius: 20, padding: 16, background: "#fff" }}>
            <h3 style={{ marginTop: 0 }}>Reception duties</h3>
            <p style={{ opacity: 0.85, lineHeight: 1.6 }}>
              There {waitingCount === 1 ? "is" : "are"} currently <strong>{waitingCount}</strong> reception candidate{waitingCount === 1 ? "" : "s"} ready for questions and review.
            </p>
            <Link className="button secondary" href="/waiting-room">Open reception</Link>
          </section>
        ) : null}

        <section style={{ border: "1px solid #e9d7e2", borderRadius: 20, padding: 16, background: "#fff" }}>
          <h3 style={{ marginTop: 0 }}>Your snapshot</h3>
          <ul style={{ lineHeight: 1.8, paddingLeft: 18, marginBottom: 0 }}>
            <li>{friendCount} friends</li>
            <li>{groupCount} groups</li>
            <li>{formatKarma(karmaPoints)} karma points</li>
          </ul>
        </section>

        <section style={{ border: "1px solid #e9d7e2", borderRadius: 20, padding: 16, background: "#fff" }}>
          <h3 style={{ marginTop: 0 }}>Featured this week</h3>
          {featuredSources.length ? featuredSources.slice(0, 2).map((source) => (
            <div key={source.id} style={{ border: "1px solid #f1dfe8", borderRadius: 16, padding: 12, marginBottom: 10 }}>
              <strong>{source.title}</strong>
              <p style={{ margin: "6px 0 10px", opacity: 0.8 }}>
                {source.editorial_note || source.description}
              </p>
              <Link className="button secondary" href={`/content/${source.slug}`}>Open</Link>
            </div>
          )) : (
            <p style={{ opacity: 0.75 }}>No featured content yet.</p>
          )}
        </section>

        <section style={{ border: "1px solid #e9d7e2", borderRadius: 20, padding: 16, background: "#fff" }}>
          <h3 style={{ marginTop: 0 }}>Anonymous confessional</h3>
          {recentConfessions.length ? recentConfessions.map((post: any) => (
            <div key={post.id} style={{ borderBottom: "1px solid #f1dfe8", padding: "8px 0" }}>
              <div style={{ fontSize: 12, opacity: 0.65 }}>Anonymous</div>
              <p style={{ margin: "4px 0", lineHeight: 1.5 }}>{post.body}</p>
              <div style={{ fontSize: 12, opacity: 0.65 }}>
                {post.reply_count || 0} replies • {post.reaction_count || 0} reactions
              </div>
            </div>
          )) : (
            <p style={{ opacity: 0.75 }}>No confessions yet.</p>
          )}
          <div style={{ marginTop: 12 }}>
            <Link className="button secondary" href="/confessions">Open Confessions</Link>
          </div>
        </section>
      </div>
    </ClientShell>
  );
}

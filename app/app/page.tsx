"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ClientShell } from "../../components/ClientShell";
import { getCurrentUser } from "../../lib/auth";
import { listFriends, listMyGroups, getMyProfile, hasBreakfastCheckInToday, getBreakfastProgress, isProfileComplete } from "../../lib/db";
import { getFeaturedContentSources, listConfessions, getViewerRoleFlags, listWaitingRoomCandidates } from "../../lib/roadmap";

function formatKarma(value: any) {
  const num = Number(value || 0);
  return Number.isInteger(num) ? String(num) : num.toFixed(1).replace(/\.0$/, "");
}

export default function AppHomePage() {
  const [name, setName] = useState("member");
  const [friendCount, setFriendCount] = useState(0);
  const [groupCount, setGroupCount] = useState(0);
  const [karmaPoints, setKarmaPoints] = useState(0);
  const [checkedInToday, setCheckedInToday] = useState(false);
  const [breakfastProgress, setBreakfastProgress] = useState<any | null>(null);
  const [featuredSources, setFeaturedSources] = useState<any[]>([]);
  const [recentConfessions, setRecentConfessions] = useState<any[]>([]);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const [canReview, setCanReview] = useState(false);
  const [waitingCount, setWaitingCount] = useState(0);
  const [mainGroupId, setMainGroupId] = useState<string | null>(null);

  useEffect(() => {
    const run = async () => {
      const user = await getCurrentUser().catch(() => null);
      if (!user) return;

      const [friends, groups, profile, checked, progress, sources, confessions, roleFlags, waiting] = await Promise.all([
        listFriends(user.id).catch(() => []),
        listMyGroups(user.id).catch(() => []),
        getMyProfile(user.id).catch(() => null),
        hasBreakfastCheckInToday(user.id).catch(() => false),
        getBreakfastProgress(user.id).catch(() => null),
        getFeaturedContentSources().catch(() => []),
        listConfessions(3).catch(() => []),
        getViewerRoleFlags(user.id).catch(() => ({ canReview: false })),
        listWaitingRoomCandidates().catch(() => []),
      ]);

      const mainGroup = (groups || []).find((g: any) => String(g.name || "").toLowerCase() === "main");
      setFriendCount(friends.length);
      setGroupCount(groups.length);
      setName(profile?.display_name || user.email?.split("@")[0] || "member");
      setKarmaPoints(Number(profile?.karma_points || 0));
      setCheckedInToday(checked);
      setBreakfastProgress(progress);
      setFeaturedSources(sources);
      setRecentConfessions(confessions);
      setNeedsOnboarding(!isProfileComplete(profile));
      setCanReview(!!roleFlags?.canReview);
      setWaitingCount((waiting || []).filter((x: any) => x.status === "waiting" || x.status === "questioned").length);
      setMainGroupId(mainGroup?.id || null);
    };
    run();
  }, []);

  return (
    <ClientShell>
      <section className="hero">
        <h1 style={{ margin: 0, fontSize: 30 }}>Welcome, {name}</h1>
        <p style={{ fontSize: 16, lineHeight: 1.6, opacity: 0.9 }}>
          Your web beta now includes games, curated content, anonymous confessions, blind chat, a waiting room, and the new consensual roleplay game.
        </p>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 14 }}>
          {mainGroupId ? <Link className="button" href={`/groups-app/${mainGroupId}`}>Open Main Group</Link> : <Link className="button" href="/groups-app">Open Groups</Link>}
          <Link className="button secondary" href="/groups-app">Browse Groups</Link>
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

        {canReview ? (
          <section style={{ border: "1px solid #e9d7e2", borderRadius: 20, padding: 16, background: "#fff" }}>
            <h3 style={{ marginTop: 0 }}>Reception duties</h3>
            <p style={{ opacity: 0.85, lineHeight: 1.6 }}>
              There {waitingCount === 1 ? "is" : "are"} currently <strong>{waitingCount}</strong> waiting-room candidate{waitingCount === 1 ? "" : "s"} ready for questions and review.
            </p>
            <Link className="button secondary" href="/waiting-room">Open waiting room</Link>
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
          <h3 style={{ marginTop: 0 }}>Games reminder</h3>
          <p style={{ opacity: 0.85, lineHeight: 1.6 }}>
            {checkedInToday ? `You already checked in for Breakfast of Champions today. Current streak: ${breakfastProgress?.current_streak || 0} 🔥` : "Breakfast of Champions is waiting for you."}
          </p>
        </section>

        <section style={{ border: "1px solid #e9d7e2", borderRadius: 20, padding: 16, background: "#fff" }}>
          <h3 style={{ marginTop: 0 }}>Featured this week</h3>
          {featuredSources.length ? featuredSources.slice(0, 2).map((source) => (
            <div key={source.id} style={{ border: "1px solid #f1dfe8", borderRadius: 16, padding: 12, marginBottom: 10 }}>
              <strong>{source.title}</strong>
              <p style={{ margin: "8px 0", opacity: 0.8 }}>{source.editorial_note || source.description || "Fresh curated content for members."}</p>
              <Link className="button secondary" href={`/content/${source.slug}`}>Open</Link>
            </div>
          )) : <p style={{ margin: 0, opacity: 0.8 }}>Curated content is ready.</p>}
        </section>

        <section style={{ border: "1px solid #e9d7e2", borderRadius: 20, padding: 16, background: "#fff" }}>
          <h3 style={{ marginTop: 0 }}>Anonymous confessional</h3>
          {recentConfessions.length ? recentConfessions.map((post) => (
            <div key={post.id} style={{ borderBottom: "1px solid #f1dfe8", padding: "10px 0" }}>
              <div style={{ fontSize: 12, opacity: 0.6 }}>Anonymous</div>
              <div style={{ whiteSpace: "pre-wrap", marginTop: 4 }}>{post.body}</div>
              <div style={{ marginTop: 6, fontSize: 13, opacity: 0.75 }}>{post.reply_count} replies • {post.reaction_count} reactions</div>
            </div>
          )) : <p style={{ margin: 0, opacity: 0.8 }}>No anonymous posts yet.</p>}
          <div style={{ marginTop: 12 }}><Link className="button secondary" href="/confessions">Open Confessions</Link></div>
        </section>
      </div>
    </ClientShell>
  );
}

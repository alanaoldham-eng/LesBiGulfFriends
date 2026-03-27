"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ClientShell } from "../../components/ClientShell";
import { getCurrentUser } from "../../lib/auth";
import { listFriends, listMyGroups, getMyProfile, listPositiveKarmaStandings, hasBreakfastCheckInToday, getBreakfastProgress } from "../../lib/db";
import { getFeaturedContentSources, listConfessions } from "../../lib/roadmap";

function formatKarma(value: any) {
  const num = Number(value || 0);
  return Number.isInteger(num) ? String(num) : num.toFixed(1).replace(/\.0$/, "");
}

export default function AppHomePage() {
  const [name, setName] = useState("member");
  const [friendCount, setFriendCount] = useState(0);
  const [groupCount, setGroupCount] = useState(0);
  const [karmaPoints, setKarmaPoints] = useState(0);
  const [standings, setStandings] = useState<any[]>([]);
  const [checkedInToday, setCheckedInToday] = useState(false);
  const [breakfastProgress, setBreakfastProgress] = useState<any | null>(null);
  const [featuredSources, setFeaturedSources] = useState<any[]>([]);
  const [recentConfessions, setRecentConfessions] = useState<any[]>([]);

  useEffect(() => {
    const run = async () => {
      const user = await getCurrentUser();
      if (!user) return;
      const [friends, groups, profile, leaderboard, checked, progress, sources, confessions] = await Promise.all([
        listFriends(user.id).catch(() => []),
        listMyGroups(user.id).catch(() => []),
        getMyProfile(user.id).catch(() => null),
        listPositiveKarmaStandings(200).catch(() => []),
        hasBreakfastCheckInToday(user.id).catch(() => false),
        getBreakfastProgress(user.id).catch(() => null),
        getFeaturedContentSources().catch(() => []),
        listConfessions(3).catch(() => []),
      ]);
      setFriendCount(friends.length);
      setGroupCount(groups.length);
      setName(profile?.display_name || user.email?.split("@")[0] || "member");
      setKarmaPoints(Number(profile?.karma_points || 0));
      setStandings(leaderboard);
      setCheckedInToday(checked);
      setBreakfastProgress(progress);
      setFeaturedSources(sources);
      setRecentConfessions(confessions);
    };
    run();
  }, []);

  return (
    <ClientShell>
      <section className="hero">
        <h1 style={{ margin: 0, fontSize: 30 }}>Welcome, {name}</h1>
        <p style={{ fontSize: 16, lineHeight: 1.6, opacity: 0.9 }}>
          Your web beta now includes games, curated content, anonymous confessions, and blind chat alongside friends, messages, groups, and events.
        </p>
      </section>

      <div className="grid">
        <section style={{ border: "1px solid #e9d7e2", borderRadius: 20, padding: 16, background: "#fff" }}>
          <h3 style={{ marginTop: 0 }}>Your snapshot</h3>
          <ul style={{ lineHeight: 1.8, paddingLeft: 18, marginBottom: 0 }}>
            <li>{friendCount} friends</li>
            <li>{groupCount} groups</li>
            <li>{formatKarma(karmaPoints)} karma points</li>
          </ul>

          <div style={{ marginTop: 16 }}>
            <h4 style={{ margin: "0 0 10px" }}>Karma standings</h4>
            <div style={{ display: "grid", gap: 10 }}>
              {standings.length ? standings.map((row) => (
                <div key={row.id} style={{ display: "flex", gap: 12, alignItems: "center", padding: 10, border: "1px solid #f1dfe8", borderRadius: 16 }}>
                  {(row.photo_urls?.[0] || row.photo_url) ? (
                    <img
                      src={row.photo_urls?.[0] || row.photo_url}
                      alt={row.display_name || "Member"}
                      style={{ width: 42, height: 42, borderRadius: 999, objectFit: "cover", border: "1px solid #ead5df" }}
                    />
                  ) : null}
                  <div>
                    <Link href={`/members/${row.id}`} style={{ color: "#8d2d5d", fontWeight: 700 }}>
                      {row.display_name || "Member"}
                    </Link>
                    <div style={{ opacity: 0.8 }}>{formatKarma(row.karma_points)} karma</div>
                  </div>
                </div>
              )) : <p style={{ margin: 0, opacity: 0.8 }}>Standings will appear when members start earning karma.</p>}
            </div>
          </div>
        </section>

        <section style={{ border: "1px solid #e9d7e2", borderRadius: 20, padding: 16, background: "#fff" }}>
          <h3 style={{ marginTop: 0 }}>Games reminder</h3>
          <p style={{ opacity: 0.85, lineHeight: 1.6 }}>
            {checkedInToday
              ? `You already checked in for Breakfast of Champions today. Current streak: ${breakfastProgress?.current_streak || 0} 🔥`
              : "Breakfast of Champions is waiting for you. Meditate, post your intention, and protect your streak."}
          </p>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <Link className="button" href="/games/breakfast_of_champions">
              {checkedInToday ? "View Breakfast of Champions" : "Check in now"}
            </Link>
            <Link className="button secondary" href="/games">Open Games</Link>
            <Link className="button secondary" href="/games/blind-chat">Blind Chat</Link>
          </div>
        </section>

        <section style={{ border: "1px solid #e9d7e2", borderRadius: 20, padding: 16, background: "#fff" }}>
          <h3 style={{ marginTop: 0 }}>Featured this week</h3>
          {featuredSources.length ? featuredSources.slice(0, 2).map((source) => (
            <div key={source.id} style={{ border: "1px solid #f1dfe8", borderRadius: 16, padding: 12, marginBottom: 10 }}>
              <strong>{source.title}</strong>
              <p style={{ margin: "8px 0", opacity: 0.8 }}>{source.editorial_note || source.description || "Fresh curated content for members."}</p>
              <Link className="button secondary" href={`/content/${source.slug}`}>Open</Link>
            </div>
          )) : (
            <p style={{ margin: 0, opacity: 0.8 }}>Curated content is ready. Add your first featured source in Supabase to populate this section.</p>
          )}
        </section>

        <section style={{ border: "1px solid #e9d7e2", borderRadius: 20, padding: 16, background: "#fff" }}>
          <h3 style={{ marginTop: 0 }}>Anonymous confessional</h3>
          {recentConfessions.length ? recentConfessions.map((post) => (
            <div key={post.id} style={{ borderBottom: "1px solid #f1dfe8", padding: "10px 0" }}>
              <div style={{ fontSize: 12, opacity: 0.6 }}>Anonymous</div>
              <div style={{ whiteSpace: "pre-wrap", marginTop: 4 }}>{post.body}</div>
              <div style={{ marginTop: 6, fontSize: 13, opacity: 0.75 }}>{post.reply_count} replies • {post.reaction_count} reactions</div>
            </div>
          )) : (
            <p style={{ margin: 0, opacity: 0.8 }}>No anonymous posts yet. Be the first to start the space.</p>
          )}
          <div style={{ marginTop: 12 }}>
            <Link className="button secondary" href="/confessions">Open Confessions</Link>
          </div>
        </section>
      </div>
    </ClientShell>
  );
}

"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ClientShell } from "../../components/ClientShell";
import { getCurrentUser } from "../../lib/auth";
import { listFriends, listMyGroups, getMyProfile, listPositiveKarmaStandings } from "../../lib/db";

export default function AppHomePage() {
  const [name, setName] = useState("member");
  const [friendCount, setFriendCount] = useState(0);
  const [groupCount, setGroupCount] = useState(0);
  const [karmaPoints, setKarmaPoints] = useState(0);
  const [standings, setStandings] = useState<any[]>([]);

  useEffect(() => {
    const run = async () => {
      const user = await getCurrentUser();
      if (!user) return;

      const [friends, groups, profile, leaderboard] = await Promise.all([
        listFriends(user.id).catch(() => []),
        listMyGroups(user.id).catch(() => []),
        getMyProfile(user.id).catch(() => null),
        listPositiveKarmaStandings(200).catch(() => []),
      ]);

      setFriendCount(friends.length);
      setGroupCount(groups.length);
      setName(profile?.display_name || user.email?.split("@")[0] || "member");
      setKarmaPoints(Number(profile?.karma_points || 0));
      setStandings(leaderboard);
    };

    run();
  }, []);

  return (
    <ClientShell>
      <section className="hero">
        <h1 style={{ margin: 0, fontSize: 30 }}>Welcome, {name}</h1>
        <p style={{ fontSize: 16, lineHeight: 1.6, opacity: 0.9 }}>
          This is your connected MVP dashboard. Profiles, friends, messages, and group chat are now wired for Supabase.
        </p>
      </section>

      <section
        style={{
          border: "1px solid #e9d7e2",
          borderRadius: 20,
          padding: 16,
          background: "#fff",
          marginTop: 16,
        }}
      >
        <h3 style={{ marginTop: 0 }}>Phase 2 preview</h3>
        <p style={{ margin: 0, lineHeight: 1.7, opacity: 0.9 }}>
          Karma is currently tracked in our database ledger so we can keep the community moving quickly in phase 1.
          In phase 2, karma is planned to become an ERC-20 token on Base. Members will have embedded wallets tied to
          their email address using Thirdweb, and the phase 1 karma ledger is intended to guide a future airdrop when
          the database system is replaced by blockchain rewards.
        </p>
      </section>

      <div className="grid">
        <section
          style={{
            border: "1px solid #e9d7e2",
            borderRadius: 20,
            padding: 16,
            background: "#fff",
          }}
        >
          <h3 style={{ marginTop: 0 }}>Your snapshot</h3>
          <ul style={{ lineHeight: 1.8, paddingLeft: 18, marginBottom: 0 }}>
            <li>{friendCount} friends</li>
            <li>{groupCount} groups</li>
            <li>{karmaPoints} karma points</li>
          </ul>

          <div style={{ marginTop: 16 }}>
            <h4 style={{ margin: "0 0 10px" }}>Karma standings</h4>
            <div style={{ display: "grid", gap: 10 }}>
              {standings.length ? (
                standings.map((row) => (
                  <div
                    key={row.id}
                    style={{
                      display: "flex",
                      gap: 12,
                      alignItems: "center",
                      padding: 10,
                      border: "1px solid #f1dfe8",
                      borderRadius: 16,
                    }}
                  >
                    {row.photo_urls?.[0] || row.photo_url ? (
                      <img
                        src={row.photo_urls?.[0] || row.photo_url}
                        alt={row.display_name || "Member"}
                        style={{
                          width: 42,
                          height: 42,
                          borderRadius: 999,
                          objectFit: "cover",
                          border: "1px solid #ead5df",
                        }}
                      />
                    ) : null}
                    <div>
                      <Link href={`/members/${row.id}`} style={{ color: "#8d2d5d", fontWeight: 700 }}>
                        {row.display_name || "Member"}
                      </Link>
                      <div style={{ opacity: 0.8 }}>{Number(row.karma_points || 0)} karma</div>
                    </div>
                  </div>
                ))
              ) : (
                <p style={{ margin: 0, opacity: 0.8 }}>Standings will appear when members start earning karma.</p>
              )}
            </div>
          </div>
        </section>
      </div>
    </ClientShell>
  );
}
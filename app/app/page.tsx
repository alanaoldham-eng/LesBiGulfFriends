"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { ClientShell } from "../../components/ClientShell";
import { getCurrentUser } from "../../lib/auth";
import { listFriends, listMyGroups, getMyProfile } from "../../lib/db";

export default function AppHomePage() {
  const [name, setName] = useState("member");
  const [friendCount, setFriendCount] = useState(0);
  const [groupCount, setGroupCount] = useState(0);
  const [karmaPoints, setKarmaPoints] = useState(0);

  useEffect(() => {
    const run = async () => {
      const user = await getCurrentUser();
      if (!user) return;
      const [friends, groups, profile] = await Promise.all([
        listFriends(user.id).catch(() => []),
        listMyGroups(user.id).catch(() => []),
        getMyProfile(user.id).catch(() => null),
      ]);
      setFriendCount(friends.length);
      setGroupCount(groups.length);
      setName(profile?.display_name || user.email?.split("@")[0] || "member");
      setKarmaPoints(Number(profile?.karma_points || 0));
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

<section style={{ border: "1px solid #e9d7e2", borderRadius: 20, padding: 16, background: "#fff", marginTop: 16 }}>
  <h3 style={{ marginTop: 0 }}>Phase 2 preview</h3>
  <p style={{ margin: 0, lineHeight: 1.7, opacity: 0.9 }}>
    Karma is currently tracked in our database ledger so we can keep the community moving quickly in phase 1.
    In phase 2, karma is planned to become an ERC-20 token on Base. Members will have embedded wallets tied to
    their email address using Thirdweb, and the phase 1 karma ledger is intended to guide a future airdrop when
    the database system is replaced by blockchain rewards.
  </p>
</section>

      <div className="grid">
        <section style={{ border: "1px solid #e9d7e2", borderRadius: 20, padding: 16, background: "#fff" }}>
          <h3 style={{ marginTop: 0 }}>Your snapshot</h3>
          <ul style={{ lineHeight: 1.8, paddingLeft: 18, marginBottom: 0 }}>
            <li>{friendCount} friends</li>
            <li>{groupCount} groups</li>
            <li>{karmaPoints} karma points</li>
            <li>Next step: wire events/check-ins after this MVP feels stable</li>
          </ul>
        </section>
      </div>
    </ClientShell>
  );
}

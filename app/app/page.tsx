"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { ClientShell } from "../../components/ClientShell";
import { getCurrentUser } from "../../lib/auth";
import { listFriends, listMyGroups } from "../../lib/db";

export default function AppHomePage() {
  const [name, setName] = useState("member");
  const [friendCount, setFriendCount] = useState(0);
  const [groupCount, setGroupCount] = useState(0);

  useEffect(() => {
    const run = async () => {
      const user = await getCurrentUser();
      if (!user) return;
      const [friends, groups] = await Promise.all([
        listFriends(user.id).catch(() => []),
        listMyGroups(user.id).catch(() => []),
      ]);
      setFriendCount(friends.length);
      setGroupCount(groups.length);
      setName(user.email?.split("@")[0] || "member");
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
      <div className="grid">
        <section style={{ border: "1px solid #e9d7e2", borderRadius: 20, padding: 16, background: "#fff" }}>
          <h3 style={{ marginTop: 0 }}>Your snapshot</h3>
          <ul style={{ lineHeight: 1.8, paddingLeft: 18, marginBottom: 0 }}>
            <li>{friendCount} friends</li>
            <li>{groupCount} groups</li>
            <li>Next step: wire events/check-ins after this MVP feels stable</li>
          </ul>
        </section>
      </div>
    </ClientShell>
  );
}

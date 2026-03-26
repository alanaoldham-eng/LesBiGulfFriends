"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { signOutEverywhere, getCurrentUser } from "../lib/auth";

const ADMIN_EMAIL = "alanaoldham@gmail.com";

export function ClientShell({ children }: { children: React.ReactNode }) {
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    getCurrentUser().then((user) => {
      const email = user?.email?.toLowerCase() || "";
      setIsAdmin(email === ADMIN_EMAIL);
    });
  }, []);

  return (
    <>
      <div style={{ marginBottom: 14 }}>
        <div className="member-banner">Member area</div>
      </div>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 18 }}>
        <Link href="/app" className="button secondary">Home</Link>
        <Link href="/profile" className="button secondary">Profile</Link>
        <Link href="/friends" className="button secondary">Friends</Link>
        <Link href="/messages" className="button secondary">Messages</Link>
        <Link href="/groups-app" className="button secondary">Groups</Link>
        <Link href="/availability" className="button secondary">Availability</Link>
        <Link href="/proposals" className="button secondary">Proposals</Link>
        <Link href="/events-app" className="button secondary">Events</Link>
        <Link href="/invites" className="button secondary">Invites</Link>
        <Link href="/feedback" className="button secondary">Bug / Feature</Link>
        {isAdmin ? <Link href="/admin-rewards" className="button secondary">Reward Karma</Link> : null}
        <button className="button secondary" onClick={() => signOutEverywhere()}>Logout</button>
      </div>
      {children}
    </>
  );
}

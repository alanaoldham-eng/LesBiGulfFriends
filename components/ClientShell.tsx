"use client";

import Link from "next/link";
import { signOutEverywhere } from "../lib/auth";

export function ClientShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 18 }}>
        <Link href="/app" className="button secondary">Home</Link>
        <Link href="/profile" className="button secondary">Profile</Link>
        <Link href="/friends" className="button secondary">Friends</Link>
        <Link href="/messages" className="button secondary">Messages</Link>
        <Link href="/groups-app" className="button secondary">Groups</Link>
        <button className="button secondary" onClick={() => signOutEverywhere()}>Logout</button>
      </div>
      {children}
    </>
  );
}

"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { listInAppNotifications } from "../lib/db";
import { signOutEverywhere, getCurrentUser } from "../lib/auth";

const ADMIN_EMAIL = "alanaoldham@gmail.com";

export function ClientShell({ children }: { children: React.ReactNode }) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    getCurrentUser().then((user) => {
      const email = user?.email?.toLowerCase() || "";
      setIsAdmin(email === ADMIN_EMAIL);
      if (user?.id) {
        listInAppNotifications(user.id).then(setNotifications).catch(() => setNotifications([]));
      }
    });
  }, []);

  return (
    <>
      <div style={{ marginBottom: 14 }}>
        <div className="member-banner">Member area</div>
      </div>
      <div style={{ marginBottom: 18, position: "relative" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <button className="button secondary" onClick={() => setMenuOpen((v) => !v)} aria-label="Open menu">☰ Menu</button>
          <div style={{ display: "flex", gap: 10 }}>
            <div style={{ position: "relative" }}>
              <button className="button secondary" onClick={() => setNotifOpen((v) => !v)} aria-label="Open notifications">
                🔔
                {notifications.length ? <span style={{ marginLeft: 8, fontWeight: 700 }}>({notifications.length})</span> : null}
              </button>
              {notifOpen ? (
                <div style={{ position: "absolute", right: 0, top: 46, width: 320, maxHeight: 420, overflow: "auto", zIndex: 30, border: "1px solid #e9d7e2", borderRadius: 16, background: "#fff", padding: 12, boxShadow: "0 14px 28px rgba(57,30,45,0.15)" }}>
                  <div style={{ fontWeight: 700, marginBottom: 8 }}>Notifications</div>
                  {notifications.length ? notifications.map((n: any) => (
                    <Link key={n.id} href={n.href} className="button secondary" style={{ width: "100%", justifyContent: "flex-start", marginBottom: 8 }}>
                      {n.text}
                    </Link>
                  )) : <p style={{ margin: 0, opacity: 0.75 }}>No new notifications.</p>}
                </div>
              ) : null}
            </div>
            <Link href="/profile" className="button secondary" aria-label="Open profile">👤</Link>
          </div>
        </div>
        {menuOpen ? (
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 12 }}>
            <Link href="/app" className="button secondary">Home</Link>
            <Link href="/friends" className="button secondary">Friends & Invites</Link>
            <Link href="/messages" className="button secondary">Messages</Link>
            <Link href="/groups-app" className="button secondary">Main Group</Link>
            <Link href="/games" className="button secondary">Games</Link>
            {/* <Link href="/content" className="button secondary">Curated Content</Link> */}
            <Link href="/availability" className="button secondary">Availability</Link>
            <Link href="/proposals" className="button secondary">Proposals</Link>
            <Link href="/events-app" className="button secondary">Events</Link>
            <Link href="/feedback" className="button secondary">Bug / Feature</Link>
            {isAdmin ? <Link href="/admin-rewards" className="button secondary">Reward Karma</Link> : null}
            <button className="button secondary" onClick={() => signOutEverywhere()}>Logout</button>
          </div>
        ) : null}
      </div>
      {children}
    </>
  );
}

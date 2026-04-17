"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { listInAppNotifications } from "../lib/db";
import { signOutEverywhere, getCurrentUser } from "../lib/auth";

const ADMIN_EMAIL = "alanaoldham@gmail.com";

export function ClientShell({ children }: { children: React.ReactNode }) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const wrapRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    getCurrentUser().then((user) => {
      const email = user?.email?.toLowerCase() || "";
      setIsAdmin(email === ADMIN_EMAIL);
      setIsLoggedIn(Boolean(user?.id));
      if (user?.id) {
        listInAppNotifications(user.id).then(setNotifications).catch(() => setNotifications([]));
      } else {
        setNotifications([]);
      }
    });
  }, []);

  useEffect(() => {
    const onDocClick = (event: MouseEvent) => {
      if (!wrapRef.current) return;
      if (!wrapRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
        setNotifOpen(false);
        setProfileOpen(false);
      }
    };

    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  return (
    <>
      <div style={{ marginBottom: 14 }}>
        <div className="member-banner">Member area</div>
      </div>

      <div ref={wrapRef} style={{ marginBottom: 18, position: "relative" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
          <div style={{ position: "relative" }}>
            <button
              className="button secondary"
              onClick={() => {
                setMenuOpen((v) => !v);
                setNotifOpen(false);
                setProfileOpen(false);
              }}
              aria-label="Open menu"
            >
              ☰
            </button>

            {menuOpen ? (
              <div
                style={{
                  position: "absolute",
                  left: 0,
                  top: 46,
                  minWidth: 240,
                  zIndex: 30,
                  border: "1px solid #e9d7e2",
                  borderRadius: 16,
                  background: "#fff",
                  padding: 10,
                  boxShadow: "0 14px 28px rgba(57,30,45,0.15)",
                  display: "grid",
                  gap: 8,
                }}
              >
                <Link href="/app" className="button secondary">Home</Link>
                <Link href="/groups-app" className="button secondary">Groups</Link>
                <Link href="/messages" className="button secondary">Messages</Link>
                <Link href="/friends" className="button secondary">Friends & Invites</Link>
                <Link href="/games" className="button secondary">Games</Link>
                <Link href="/confessions" className="button secondary">Confessions</Link>
                <Link href="/availability" className="button secondary">Availability</Link>
                <Link href="/proposals" className="button secondary">Proposals</Link>
                <Link href="/events-app" className="button secondary">Events</Link>
                <Link href="/feedback" className="button secondary">Bug / Feature</Link>
                {isLoggedIn ? (
                  <button
                    className="button secondary"
                    onClick={() => {
                      setNotifOpen((v) => !v);
                      setProfileOpen(false);
                    }}
                  >
                    Notifications
                    {notifications.length ? <span style={{ marginLeft: 8, fontWeight: 700 }}>({notifications.length})</span> : null}
                  </button>
                ) : null}
                {isAdmin ? <Link href="/admin-rewards" className="button secondary">Reward Karma</Link> : null}
              </div>
            ) : null}
          </div>

          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            {isLoggedIn ? (
              <>
                {notifOpen ? (
                  <div
                    style={{
                      position: "absolute",
                      right: 58,
                      top: 46,
                      width: 320,
                      maxHeight: 420,
                      overflow: "auto",
                      zIndex: 30,
                      border: "1px solid #e9d7e2",
                      borderRadius: 16,
                      background: "#fff",
                      padding: 12,
                      boxShadow: "0 14px 28px rgba(57,30,45,0.15)",
                    }}
                  >
                    <div style={{ fontWeight: 700, marginBottom: 10 }}>Notifications</div>
                    {notifications.length ? (
                      <div style={{ display: "grid", gap: 10 }}>
                        {notifications.map((n: any) => (
                          <Link
                            key={n.id}
                            href={n.href}
                            style={{
                              display: "block",
                              padding: 12,
                              borderRadius: 14,
                              border: "1px solid #f1dfe8",
                              background: "#fff8fb",
                              textDecoration: "none",
                              color: "inherit",
                            }}
                          >
                            <div style={{ fontWeight: 600, lineHeight: 1.4 }}>{n.text}</div>
                            {n.created_at ? (
                              <div style={{ fontSize: 12, opacity: 0.65, marginTop: 6 }}>
                                {new Date(n.created_at).toLocaleString()}
                              </div>
                            ) : null}
                          </Link>
                        ))}
                      </div>
                    ) : (
                      <p style={{ margin: 0, opacity: 0.75 }}>No new notifications.</p>
                    )}
                  </div>
                ) : null}

                <div style={{ position: "relative" }}>
                  <button
                    className="button secondary"
                    onClick={() => {
                      setProfileOpen((v) => !v);
                      setMenuOpen(false);
                      setNotifOpen(false);
                    }}
                    aria-label="Open profile menu"
                  >
                    👤
                  </button>

                  {profileOpen ? (
                    <div
                      style={{
                        position: "absolute",
                        right: 0,
                        top: 46,
                        minWidth: 220,
                        zIndex: 30,
                        border: "1px solid #e9d7e2",
                        borderRadius: 16,
                        background: "#fff",
                        padding: 10,
                        boxShadow: "0 14px 28px rgba(57,30,45,0.15)",
                        display: "grid",
                        gap: 8,
                      }}
                    >
                      <Link href="/profile" className="button secondary">Profile</Link>
                      <Link href="/profile" className="button secondary">Edit Profile</Link>
                      <button className="button secondary" onClick={() => signOutEverywhere()}>Logout</button>
                    </div>
                  ) : null}
                </div>
              </>
            ) : (
              <>
                <Link href="/login" className="button secondary">Log in</Link>
                <Link href="/signup" className="button">Sign up</Link>
              </>
            )}
          </div>
        </div>
      </div>

      {children}
    </>
  );
}

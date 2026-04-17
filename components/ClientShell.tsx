"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { signOutEverywhere, getCurrentUser } from "../lib/auth";
import { listInAppNotifications } from "../lib/notificationSettings";

const ADMIN_EMAIL = "alanaoldham@gmail.com";

const panelStyle: React.CSSProperties = {
  position: "absolute",
  top: 46,
  zIndex: 30,
  border: "1px solid #e9d7e2",
  borderRadius: 16,
  background: "#fff",
  padding: 10,
  boxShadow: "0 14px 28px rgba(57,30,45,0.15)",
};

const menuItemStyle: React.CSSProperties = {
  display: "block",
  width: "100%",
  textAlign: "left",
  padding: "11px 12px",
  borderRadius: 12,
  border: "1px solid #f1dfe8",
  background: "#fff",
  color: "inherit",
  textDecoration: "none",
  font: "inherit",
  lineHeight: 1.25,
  cursor: "pointer",
};

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
              <div style={{ ...panelStyle, left: 0, minWidth: 240, display: "grid", gap: 8 }}>
                <Link href="/app" style={menuItemStyle}>Home</Link>
                <Link href="/groups-app" style={menuItemStyle}>Groups</Link>
                <Link href="/messages" style={menuItemStyle}>Messages</Link>
                <Link href="/friends" style={menuItemStyle}>Friends & Invites</Link>
                <Link href="/games" style={menuItemStyle}>Games</Link>
                <Link href="/confessions" style={menuItemStyle}>Confessions</Link>
                <Link href="/warning-wall" style={menuItemStyle}>The Warning Wall</Link>
                <Link href="/availability" style={menuItemStyle}>Availability</Link>
                <Link href="/proposals" style={menuItemStyle}>Proposals</Link>
                <Link href="/events-app" style={menuItemStyle}>Events</Link>
                <Link href="/feedback" style={menuItemStyle}>Bug / Feature</Link>
                {isAdmin ? <Link href="/admin-rewards" style={menuItemStyle}>Reward Karma</Link> : null}
              </div>
            ) : null}
          </div>

          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            {isLoggedIn ? (
              <>
                <div style={{ position: "relative" }}>
                  <button
                    className="button secondary"
                    onClick={() => {
                      setNotifOpen((v) => !v);
                      setMenuOpen(false);
                      setProfileOpen(false);
                    }}
                    aria-label="Open notifications"
                    style={{ position: "relative" }}
                  >
                    🔔
                    {notifications.length ? (
                      <span style={{ position: "absolute", top: -6, right: -6, minWidth: 18, height: 18, padding: "0 5px", borderRadius: 999, background: "#8d2d5d", color: "#fff", fontSize: 11, fontWeight: 700, lineHeight: "18px", textAlign: "center" }}>{notifications.length}</span>
                    ) : null}
                  </button>
                  {notifOpen ? (
                    <div style={{ ...panelStyle, right: 0, width: 340, maxWidth: "calc(100vw - 24px)", maxHeight: 420, overflow: "auto" }}>
                      <div style={{ fontWeight: 700, marginBottom: 10 }}>Notifications</div>
                      {notifications.length ? (
                        <div style={{ display: "grid", gap: 10 }}>
                          {notifications.map((n: any) => (
                            <Link key={n.id} href={n.href} style={{ display: "block", padding: 12, borderRadius: 14, border: "1px solid #f1dfe8", background: "#fff8fb", textDecoration: "none", color: "inherit" }}>
                              <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                                <div style={{ width: 10, height: 10, borderRadius: 999, background: "#8d2d5d", marginTop: 5, flex: "0 0 auto" }} />
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <div style={{ fontWeight: 600, lineHeight: 1.45 }}>{n.text}</div>
                                  {n.created_at ? <div style={{ fontSize: 12, opacity: 0.65, marginTop: 6 }}>{new Date(n.created_at).toLocaleString()}</div> : null}
                                </div>
                              </div>
                            </Link>
                          ))}
                        </div>
                      ) : <p style={{ margin: 0, opacity: 0.75 }}>No new notifications.</p>}
                    </div>
                  ) : null}
                </div>

                <div style={{ position: "relative" }}>
                  <button className="button secondary" onClick={() => { setProfileOpen((v) => !v); setMenuOpen(false); setNotifOpen(false); }} aria-label="Open profile menu">👤</button>
                  {profileOpen ? (
                    <div style={{ ...panelStyle, right: 0, minWidth: 220, display: "grid", gap: 8 }}>
                      <Link href="/profile" style={menuItemStyle}>View Profile</Link>
                      <Link href="/profile" style={menuItemStyle}>Edit Profile</Link>
                      <Link href="/forgot-password" style={menuItemStyle}>Change Password</Link>
                      <button style={menuItemStyle} onClick={() => signOutEverywhere()}>Logout</button>
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

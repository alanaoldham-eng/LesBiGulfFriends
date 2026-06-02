"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { signOutEverywhere, getCurrentUser } from "../lib/auth";
import { getKreweCompletionStatus } from "../lib/kreweVibe";
import { listInAppNotifications } from "../lib/notificationSettings";
import { getViewerRoleFlags } from "../lib/roadmap";
import { supabase } from "../lib/supabase/client";

const ADMIN_EMAIL = "alanaoldham@gmail.com";

const panelBase: React.CSSProperties = {
  position: "absolute",
  top: 38,
  zIndex: 10001,
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
  padding: "9px 10px",
  borderRadius: 11,
  border: "1px solid #f1dfe8",
  background: "#fff",
  color: "inherit",
  textDecoration: "none",
  font: "inherit",
  fontSize: 13,
  lineHeight: 1.2,
  cursor: "pointer",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

export function ClientShell({ children }: { children: React.ReactNode }) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [canReview, setCanReview] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUserId, setCurrentUserId] = useState("");
  const [notifications, setNotifications] = useState<any[]>([]);
  const [kreweVibeComplete, setKreweVibeComplete] = useState(false);
  const [leftTarget, setLeftTarget] = useState<HTMLElement | null>(null);
  const [rightTarget, setRightTarget] = useState<HTMLElement | null>(null);
  const leftRef = useRef<HTMLDivElement | null>(null);
  const rightRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setLeftTarget(document.getElementById("topbar-left-slot"));
    setRightTarget(document.getElementById("topbar-right-slot"));
  }, []);

  useEffect(() => {
    getCurrentUser().then(async (user) => {
      const email = user?.email?.toLowerCase() || "";
      setIsAdmin(email === ADMIN_EMAIL);
      setIsLoggedIn(Boolean(user?.id));
      setCurrentUserId(user?.id || "");

      if (user?.id) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("membership_status, is_banned")
          .eq("id", user.id)
          .maybeSingle();

        if (profile?.is_banned || ["removed", "banned"].includes(String(profile?.membership_status || "").toLowerCase())) {
          await signOutEverywhere();
          return;
        }

        listInAppNotifications(user.id)
          .then(setNotifications)
          .catch(() => setNotifications([]));

        const roleFlags = await getViewerRoleFlags(user.id).catch(() => ({ canReview: false }));
        setCanReview(!!roleFlags?.canReview);

        const vibe = await getKreweCompletionStatus(user.id).catch(() => ({ complete: false }));
        setKreweVibeComplete(!!vibe.complete);
      } else {
        setNotifications([]);
        setCanReview(false);
        setKreweVibeComplete(false);
      }
    });
  }, []);

  const closeMenus = () => {
    setMenuOpen(false);
    setNotifOpen(false);
    setProfileOpen(false);
  };

  useEffect(() => {
    const onDocClick = (event: MouseEvent) => {
      const target = event.target as Node;
      const insideLeft = !!leftRef.current?.contains(target);
      const insideRight = !!rightRef.current?.contains(target);

      if (insideLeft || insideRight) return;
      closeMenus();
    };

    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const kreweMenuStyle: React.CSSProperties = kreweVibeComplete
    ? menuItemStyle
    : { ...menuItemStyle, background: "#fff7fb", borderColor: "#d7a8bf", fontWeight: 900 };

  const menuPanel = menuOpen ? (
    <div
      className="topbar-menu-panel"
      style={{
        ...panelBase,
        left: 0,
        width: 238,
        maxWidth: "calc(100vw - 22px)",
        display: "grid",
        gap: 7,
      }}
    >
      <Link href="/app" style={menuItemStyle} onClick={closeMenus}>Home</Link>
      <Link href="/groups-app" style={menuItemStyle} onClick={closeMenus}>Groups</Link>
      <Link href="/messages" style={menuItemStyle} onClick={closeMenus}>Messages</Link>
      <Link href="/friends" style={menuItemStyle} onClick={closeMenus}>Friends & Invites</Link>
      {!kreweVibeComplete ? <Link href="/krewe-vibe" style={kreweMenuStyle} onClick={closeMenus}>Complete Krewe Vibe</Link> : null}
      <Link href="/friend-suggestions" style={menuItemStyle} onClick={closeMenus}>Friend Suggestions</Link>
      <Link href="/krewe-vibe" style={menuItemStyle} onClick={closeMenus}>Krewe Vibe</Link>
      <Link href="/events-app" style={menuItemStyle} onClick={closeMenus}>Events</Link>
      <Link href="/games" style={menuItemStyle} onClick={closeMenus}>Games</Link>
      <Link href="/confessions" style={menuItemStyle} onClick={closeMenus}>Confessions</Link>
      <Link href="/warning-wall" style={menuItemStyle} onClick={closeMenus}>The Warning Wall</Link>
      <Link href="/availability" style={menuItemStyle} onClick={closeMenus}>Availability</Link>
      {(canReview || isAdmin) ? <Link href="/proposals" style={menuItemStyle} onClick={closeMenus}>Proposals</Link> : null}
      {(canReview || isAdmin) ? <Link href="/waiting-room" style={menuItemStyle} onClick={closeMenus}>Waiting Room</Link> : null}
      <Link href="/feedback" style={menuItemStyle} onClick={closeMenus}>Bug / Feature</Link>
      {isAdmin ? <Link href="/admin-rewards" style={menuItemStyle} onClick={closeMenus}>Admin Dashboard</Link> : null}
      {isLoggedIn ? <button type="button" style={menuItemStyle} onClick={() => signOutEverywhere()}>Logout</button> : null}
    </div>
  ) : null;

  const notificationPanel = notifOpen ? (
    <div
      className="topbar-notification-panel"
      style={{
        ...panelBase,
        right: 0,
        width: 320,
        maxWidth: "calc(100vw - 22px)",
        maxHeight: 420,
        overflow: "auto",
      }}
    >
      <div style={{ fontWeight: 800, marginBottom: 10 }}>Notifications</div>
      {notifications.length ? (
        <div style={{ display: "grid", gap: 9 }}>
          {notifications.map((n: any) => (
            <Link
              key={n.id}
              href={n.href}
              onClick={closeMenus}
              style={{
                display: "block",
                padding: 11,
                borderRadius: 13,
                border: "1px solid #f1dfe8",
                background: "#fff8fb",
                textDecoration: "none",
                color: "inherit",
              }}
            >
              <div style={{ fontWeight: 650, lineHeight: 1.4 }}>{n.text}</div>
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
  ) : null;

  const profilePanel = profileOpen ? (
    <div
      className="topbar-profile-panel"
      style={{
        ...panelBase,
        right: 0,
        width: 210,
        maxWidth: "calc(100vw - 22px)",
        display: "grid",
        gap: 7,
      }}
    >
      <Link href={currentUserId ? `/members/${currentUserId}` : "/profile"} style={menuItemStyle} onClick={closeMenus}>View Profile</Link>
      <Link href="/profile" style={menuItemStyle} onClick={closeMenus}>Edit Profile</Link>
      <Link href="/krewe-vibe" style={kreweMenuStyle} onClick={closeMenus}>{kreweVibeComplete ? "Krewe Vibe" : "Complete Krewe Vibe"}</Link>
      <Link href="/forgot-password" style={menuItemStyle} onClick={closeMenus}>Change Password</Link>
      <button type="button" style={menuItemStyle} onClick={() => signOutEverywhere()}>Logout</button>
    </div>
  ) : null;

  const leftControls = (
    <div ref={leftRef} className="topbar-left-controls">
      <div style={{ position: "relative" }}>
        <button
          className="topbar-icon-button"
          onClick={() => {
            setMenuOpen((v) => !v);
            setNotifOpen(false);
            setProfileOpen(false);
          }}
          aria-label="Open menu"
          type="button"
        >
          ☰
        </button>
        {menuPanel}
      </div>
    </div>
  );

  const rightControls = (
    <div ref={rightRef} className="topbar-right-controls">
      {isLoggedIn ? (
        <>
          <div style={{ position: "relative" }}>
            <button
              className="topbar-icon-button"
              onClick={() => {
                setNotifOpen((v) => !v);
                setMenuOpen(false);
                setProfileOpen(false);
              }}
              aria-label="Open notifications"
              type="button"
              style={{ position: "relative" }}
            >
              🔔
              {notifications.length ? (
                <span className="topbar-badge">
                  {notifications.length}
                </span>
              ) : null}
            </button>
            {notificationPanel}
          </div>

          <div className="desktop-profile-menu" style={{ position: "relative" }}>
            <button
              className="topbar-icon-button"
              onClick={() => {
                setProfileOpen((v) => !v);
                setMenuOpen(false);
                setNotifOpen(false);
              }}
              aria-label="Open profile menu"
              type="button"
            >
              👤
            </button>
            {profilePanel}
          </div>
        </>
      ) : (
        <div className="desktop-auth-actions">
          <Link href="/login" className="button secondary">Log in</Link>
          <Link href="/signup" className="button">Sign up</Link>
        </div>
      )}
    </div>
  );

  const bottomNav = isLoggedIn ? (
    <nav className="mobile-bottom-nav" aria-label="Primary mobile navigation">
      <Link href="/app" className="mobile-bottom-nav-item" onClick={closeMenus}>
        <span>🏠</span>
        <span>Home</span>
      </Link>
      <Link href="/groups-app" className="mobile-bottom-nav-item" onClick={closeMenus}>
        <span>👥</span>
        <span>Groups</span>
      </Link>
      <Link href="/events-app" className="mobile-bottom-nav-item" onClick={closeMenus}>
        <span>📅</span>
        <span>Events</span>
      </Link>
      <Link href="/messages" className="mobile-bottom-nav-item" onClick={closeMenus}>
        <span>💬</span>
        <span>Messages</span>
      </Link>
      <Link href={currentUserId ? `/members/${currentUserId}` : "/profile"} className="mobile-bottom-nav-item" onClick={closeMenus}>
        <span>👤</span>
        <span>Profile</span>
      </Link>
    </nav>
  ) : (
    <nav className="mobile-bottom-nav mobile-bottom-nav-auth" aria-label="Mobile login navigation">
      <Link href="/login" className="mobile-bottom-nav-item" onClick={closeMenus}>
        <span>🔑</span>
        <span>Log in</span>
      </Link>
      <Link href="/signup" className="mobile-bottom-nav-item" onClick={closeMenus}>
        <span>✨</span>
        <span>Sign up</span>
      </Link>
    </nav>
  );

  return (
    <>
      {leftTarget ? createPortal(leftControls, leftTarget) : null}
      {rightTarget ? createPortal(rightControls, rightTarget) : null}
      {children}
      {bottomNav}
    </>
  );
}

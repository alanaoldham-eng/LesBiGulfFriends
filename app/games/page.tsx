"use client";
export const dynamic = "force-dynamic";

import Link from "next/link";
import { ClientShell } from "../../components/ClientShell";

export default function GamesPage() {
  return (
    <ClientShell>
      <section className="hero">
        <h1 style={{ margin: 0, fontSize: 30 }}>Games</h1>
        <p style={{ fontSize: 16, lineHeight: 1.6, opacity: 0.9 }}>
          Build habits, earn karma, and have fun with community-powered games.
        </p>
      </section>

      <div className="grid">
        <section style={{ border: "1px solid #e9d7e2", borderRadius: 24, padding: 20, background: "linear-gradient(180deg, #fff, #fff7fb)" }}>
          <div style={{ fontSize: 34, marginBottom: 8 }}>🥣🔥</div>
          <h3 style={{ marginTop: 0 }}>Breakfast of Champions</h3>
          <p style={{ opacity: 0.85, lineHeight: 1.7 }}>
            Every morning, meditate and post your intention for the day. Earn 0.1 karma for each daily check-in, protect your streak,
            and climb the leaderboard.
          </p>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <Link className="button" href="/games/breakfast_of_champions">Play now</Link>
            <span style={{ alignSelf: "center", opacity: 0.75 }}>Daily habit • streaks • leaderboard</span>
          </div>
        </section>
      </div>
    </ClientShell>
  );
}

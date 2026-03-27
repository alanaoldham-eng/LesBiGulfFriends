"use client";
export const dynamic = "force-dynamic";

import Link from "next/link";
import { ClientShell } from "../../components/ClientShell";
import { listGames } from "../../lib/db";

export default async function GamesPage() {
  const games = await listGames();

  return (
    <ClientShell>
      <section className="hero">
        <h1 style={{ margin: 0, fontSize: 30 }}>Games</h1>
        <p style={{ fontSize: 16, lineHeight: 1.6, opacity: 0.9 }}>
          Play community-building games, earn karma, and build habits together.
        </p>
      </section>

      <div className="grid">
        {games.map((game) => (
          <section key={game.key} style={{ border: "1px solid #e9d7e2", borderRadius: 20, padding: 16, background: "#fff" }}>
            <h3 style={{ marginTop: 0 }}>{game.name}</h3>
            <p style={{ opacity: 0.85 }}>{game.description}</p>
            <Link className="button" href={`/games/${game.key}`}>Open game</Link>
          </section>
        ))}
      </div>
    </ClientShell>
  );
}

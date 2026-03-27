"use client";
export const dynamic = "force-dynamic";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ClientShell } from "../../../components/ClientShell";
import { getCurrentUser } from "../../../lib/auth";

export default function BlindChatLobbyPage() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const run = async () => {
      const user = await getCurrentUser().catch(() => null);
      if (!user) return;
      setReady(true);
    };
    run();
  }, []);

  return (
    <ClientShell>
      <section className="hero">
        <h1 style={{ margin: 0, fontSize: 30 }}>Blind Chat</h1>
        <p style={{ fontSize: 16, lineHeight: 1.6, opacity: 0.9 }}>
          Chat with someone new without seeing who they are at first. If both of
          you want to reveal later, you can.
        </p>
      </section>

      <div className="grid">
        <section
          style={{
            border: "1px solid #e9d7e2",
            borderRadius: 20,
            padding: 16,
            background: "#fff",
          }}
        >
          <h3 style={{ marginTop: 0 }}>How it works</h3>
          <ul style={{ lineHeight: 1.8, paddingLeft: 18, marginBottom: 0 }}>
            <li>You enter the blind chat space.</li>
            <li>You get paired with another member anonymously.</li>
            <li>You chat using temporary aliases.</li>
            <li>Identity reveal only happens if both people agree.</li>
          </ul>

          <div style={{ marginTop: 16, display: "flex", gap: 10, flexWrap: "wrap" }}>
            <Link className="button" href="/games">
              Back to Games
            </Link>
            <Link className="button secondary" href="/confessions">
              Anonymous Confessional
            </Link>
          </div>

          {ready ? (
            <p style={{ marginTop: 16, opacity: 0.8 }}>
              Blind chat UI shell is installed. Matching logic can be wired next.
            </p>
          ) : null}
        </section>
      </div>
    </ClientShell>
  );
}
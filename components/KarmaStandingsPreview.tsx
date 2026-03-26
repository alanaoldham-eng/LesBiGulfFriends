"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { listKarmaStandings } from "../lib/db";

function formatKarma(value: any) {
  const num = Number(value || 0);
  return Number.isInteger(num) ? String(num) : num.toFixed(1).replace(/\.0$/, "");
}

export function KarmaStandingsPreview() {
  const [rows, setRows] = useState<any[]>([]);

  useEffect(() => {
    listKarmaStandings(10).then(setRows).catch(() => setRows([]));
  }, []);

  return (
    <section className="landing-secondary">
      <h2 style={{ marginTop: 0 }}>Karma leaderboard</h2>
      <p style={{ opacity: 0.85, lineHeight: 1.7 }}>
        Helpful members rise through karma. Right now karma is a database-backed points ledger. In phase 2, the plan is to
        move karma onto Base as an ERC-20 token with Thirdweb embedded wallets by email, with a future airdrop guided by
        the phase 1 ledger.
      </p>
      <div className="grid">
        {rows.length ? rows.map((row, index) => (
          <section key={row.id} style={{ border: "1px solid #e9d7e2", borderRadius: 20, padding: 16, background: "#fff" }}>
            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
              {(row.photo_urls?.[0] || row.photo_url) ? (
                <img
                  src={row.photo_urls?.[0] || row.photo_url}
                  alt={row.display_name || "Member"}
                  style={{ width: 52, height: 52, borderRadius: 999, objectFit: "cover", border: "1px solid #ead5df" }}
                />
              ) : null}
              <div>
                <div style={{ fontSize: 12, opacity: 0.7 }}>#{index + 1}</div>
                <Link href={`/members/${row.id}`} style={{ color: "#8d2d5d", fontWeight: 700 }}>
                  {row.display_name || "Member"}
                </Link>
                <div style={{ opacity: 0.8 }}>{formatKarma(row.karma_points)} karma</div>
              </div>
            </div>
          </section>
        )) : <p style={{ opacity: 0.75 }}>Standings will appear once members start earning karma.</p>}
      </div>
    </section>
  );
}

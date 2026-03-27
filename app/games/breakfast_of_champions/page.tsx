"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { ClientShell } from "../../../components/ClientShell";
import { getCurrentUser } from "../../../lib/auth";
import { breakfastCheckIn, getBreakfastLeaderboard, getBreakfastProgress } from "../../../lib/db";

function formatDate(value: string) {
  return new Date(value).toLocaleDateString();
}

export default function BreakfastOfChampionsPage() {
  const [me, setMe] = useState("");
  const [intention, setIntention] = useState("");
  const [status, setStatus] = useState("");
  const [progress, setProgress] = useState<any | null>(null);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);

  const refresh = async (uid: string) => {
    const [prog, board] = await Promise.all([
      getBreakfastProgress(uid).catch(() => null),
      getBreakfastLeaderboard().catch(() => []),
    ]);
    setProgress(prog);
    setLeaderboard(board);
  };

  useEffect(() => {
    const run = async () => {
      const user = await getCurrentUser();
      if (!user) return;
      setMe(user.id);
      await refresh(user.id);
    };
    run();
  }, []);

  const checkIn = async () => {
    try {
      const result = await breakfastCheckIn(intention);
      if (result?.duplicate) {
        setStatus("You already checked in today.");
      } else {
        setStatus(`Checked in! Current streak: ${result?.streak || 1}`);
      }
      setIntention("");
      if (me) await refresh(me);
    } catch (e: any) {
      setStatus(e.message || "Unable to check in.");
    }
  };

  return (
    <ClientShell>
      <section className="hero">
        <h1 style={{ margin: 0, fontSize: 30 }}>Breakfast of Champions</h1>
        <p style={{ fontSize: 16, lineHeight: 1.6, opacity: 0.9 }}>
          Every morning, meditate and post your intention for the day. Earn 0.1 karma for each daily check-in and build your streak.
        </p>
      </section>

      <div className="grid">
        <section style={{ border: "1px solid #e9d7e2", borderRadius: 20, padding: 16, background: "#fff" }}>
          <h3 style={{ marginTop: 0 }}>Today’s check-in</h3>
          <p style={{ opacity: 0.85 }}>Take a moment to breathe, reflect, and write your intention for the day.</p>
          <textarea
            id="breakfast-intention"
            name="breakfastIntention"
            value={intention}
            onChange={(e) => setIntention(e.target.value)}
            placeholder="What is your intention today?"
            style={{ minHeight: 140, padding: "14px 16px", borderRadius: 16, border: "1px solid #d7a8bf", fontSize: 16, width: "100%" }}
          />
          <div style={{ marginTop: 12, display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button className="button" onClick={checkIn} disabled={!me}>Check in</button>
            {progress ? <div style={{ alignSelf: "center", opacity: 0.8 }}>Current streak: {progress.current_streak || 0} 🔥</div> : null}
          </div>
          {progress?.last_check_in ? <p style={{ marginTop: 12, opacity: 0.75 }}>Last check-in: {formatDate(progress.last_check_in)}</p> : null}
          {status ? <p style={{ marginTop: 12, opacity: 0.85 }}>{status}</p> : null}
        </section>

        <section style={{ border: "1px solid #e9d7e2", borderRadius: 20, padding: 16, background: "#fff" }}>
          <h3 style={{ marginTop: 0 }}>Streak leaderboard</h3>
          <div style={{ display: "grid", gap: 10 }}>
            {leaderboard.length ? leaderboard.map((row, index) => (
              <div key={row.user_id} style={{ display: "flex", gap: 12, alignItems: "center", padding: 10, border: "1px solid #f1dfe8", borderRadius: 16 }}>
                {(row.profile?.photo_urls?.[0] || row.profile?.photo_url) ? (
                  <img
                    src={row.profile?.photo_urls?.[0] || row.profile?.photo_url}
                    alt={row.profile?.display_name || "Member"}
                    style={{ width: 42, height: 42, borderRadius: 999, objectFit: "cover", border: "1px solid #ead5df" }}
                  />
                ) : null}
                <div>
                  <div style={{ fontSize: 12, opacity: 0.7 }}>#{index + 1}</div>
                  <div style={{ fontWeight: 700 }}>{row.profile?.display_name || "Member"}</div>
                  <div style={{ opacity: 0.8 }}>{row.current_streak || 0} day streak 🔥</div>
                </div>
              </div>
            )) : <p style={{ margin: 0, opacity: 0.8 }}>No check-ins yet. Be the first!</p>}
          </div>
        </section>
      </div>
    </ClientShell>
  );
}

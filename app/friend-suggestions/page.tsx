"use client";
export const dynamic = "force-dynamic";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ClientShell } from "../../components/ClientShell";
import { getCurrentUser } from "../../lib/auth";
import { getKreweCompletionStatus, listKreweFriendSuggestions } from "../../lib/kreweVibe";

export default function FriendSuggestionsPage() {
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [complete, setComplete] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const run = async () => {
      const user = await getCurrentUser().catch(() => null);

      if (!user) {
        setLoading(false);
        return;
      }

      const completion = await getKreweCompletionStatus(user.id).catch(() => ({ complete: false }));
      setComplete(!!completion.complete);

      const rows = await listKreweFriendSuggestions(user.id).catch(() => []);
      setSuggestions(rows);
      setLoading(false);
    };

    run();
  }, []);

  return (
    <ClientShell>
      <section className="hero">
        <h1 style={{ margin: 0, fontSize: 30 }}>Friend Suggestions</h1>
        <p style={{ fontSize: 16, lineHeight: 1.6, opacity: 0.9 }}>
          Suggestions are based on shared community values, shared event preferences,
          compatible communication style, shared interests, and private safety signals.
        </p>
      </section>

      <div className="grid">
        {!complete ? (
          <section style={{ border: "1px solid #e9d7e2", borderRadius: 20, padding: 16, background: "#fff7fb" }}>
            <h3 style={{ marginTop: 0 }}>Finish your Krewe Vibe first</h3>
            <p style={{ opacity: 0.8 }}>
              Matching works best after you answer the required questions.
            </p>
            <Link href="/krewe-vibe" className="button">Complete Krewe Vibe</Link>
          </section>
        ) : null}

        {loading ? <p>Loading suggestions...</p> : null}

        {!loading && !suggestions.length ? (
          <section style={{ border: "1px solid #e9d7e2", borderRadius: 20, padding: 16, background: "#fff" }}>
            <h3 style={{ marginTop: 0 }}>No suggestions yet</h3>
            <p style={{ opacity: 0.8 }}>
              As more members complete Krewe Vibe, the matching pool will improve.
            </p>
          </section>
        ) : null}

        {suggestions.map((row) => {
          const profile = row.profile || {};
          const photo = profile.photo_urls?.[0] || profile.photo_url || null;

          return (
            <section
              key={profile.id}
              style={{ border: "1px solid #e9d7e2", borderRadius: 20, padding: 16, background: "#fff" }}
            >
              <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                {photo ? (
                  <img
                    src={photo}
                    alt={profile.display_name || "Member"}
                    style={{ width: 54, height: 54, borderRadius: 999, objectFit: "cover", border: "1px solid #ead5df" }}
                  />
                ) : (
                  <div style={{ width: 54, height: 54, borderRadius: 999, background: "#fff7fb", display: "grid", placeItems: "center" }}>
                    👤
                  </div>
                )}

                <div>
                  <Link href={`/members/${profile.id}`} style={{ color: "#8d2d5d", fontWeight: 900 }}>
                    {profile.display_name || "Member"}
                  </Link>
                  <div style={{ opacity: 0.7, fontSize: 13 }}>Compatibility score: {row.score}</div>
                </div>
              </div>

              {row.reasons?.length ? (
                <ul style={{ marginBottom: 0 }}>
                  {row.reasons.map((reason: string) => (
                    <li key={reason}>{reason}</li>
                  ))}
                </ul>
              ) : null}
            </section>
          );
        })}
      </div>
    </ClientShell>
  );
}

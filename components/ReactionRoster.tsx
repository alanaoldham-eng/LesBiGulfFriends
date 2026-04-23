"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

export function ReactionRoster({
  emoji,
  reactions,
  onReact,
  buttonStyle,
}: {
  emoji: string;
  reactions: any[];
  onReact: () => void;
  buttonStyle?: React.CSSProperties;
}) {
  const [open, setOpen] = useState(false);

  const uniquePeople = useMemo(() => {
    const seen = new Set<string>();
    return (reactions || []).filter((r: any) => {
      const key = String(r.user_id || "");
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [reactions]);

  return (
    <div
      style={{ position: "relative", display: "inline-block" }}
      onMouseEnter={() => uniquePeople.length && setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button type="button" style={buttonStyle} onClick={onReact} aria-label={`React with ${emoji}`}>
        {emoji} {reactions?.length || ""}
      </button>

      {open ? (
        <div
          style={{
            position: "absolute",
            bottom: "calc(100% + 6px)",
            left: 0,
            minWidth: 180,
            maxWidth: 260,
            background: "#fff",
            border: "1px solid #ead5df",
            borderRadius: 12,
            boxShadow: "0 10px 24px rgba(57,30,45,0.18)",
            padding: 10,
            zIndex: 999,
          }}
        >
          <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 6 }}>
            Reacted with {emoji}
          </div>
          <div style={{ display: "grid", gap: 6 }}>
            {uniquePeople.map((r: any) => (
              <Link
                key={r.user_id}
                href={`/members/${r.user_id}`}
                style={{ color: "#8d2d5d", textDecoration: "none", fontWeight: 600 }}
              >
                {r.profile?.display_name || r.user_id}
              </Link>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

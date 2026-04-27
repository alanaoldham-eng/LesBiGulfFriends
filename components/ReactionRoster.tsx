"use client";

import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { supabase } from "../lib/supabase/client";

export function ReactionRoster({ emoji, reactions, onReact, buttonStyle }: { emoji: string; reactions: any[]; onReact: () => void; buttonStyle?: React.CSSProperties }) {
  const anchorRef = useRef<HTMLDivElement | null>(null);
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const [namesById, setNamesById] = useState<Record<string, string>>({});

  const uniquePeople = useMemo(() => {
    const seen = new Set<string>();
    return (reactions || []).filter((r: any) => {
      const key = String(r.user_id || "");
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [reactions]);

  const displayName = (r: any) => r.profile?.display_name || r.profiles?.display_name || r.display_name || namesById[String(r.user_id)] || "Member";

  const fetchMissingNames = async () => {
    const missing = uniquePeople.map((r: any) => String(r.user_id)).filter((id) => id && !namesById[id] && !(uniquePeople.find((r: any) => String(r.user_id) === id)?.profile?.display_name));
    if (!missing.length) return;
    const { data } = await supabase.from("profiles").select("id, display_name").in("id", [...new Set(missing)]);
    if (data?.length) {
      const next: Record<string, string> = {};
      data.forEach((p: any) => { if (p.id && p.display_name) next[p.id] = p.display_name; });
      setNamesById((prev) => ({ ...prev, ...next }));
    }
  };

  const show = () => {
    if (!uniquePeople.length || !anchorRef.current) return;
    const rect = anchorRef.current.getBoundingClientRect();
    setCoords({ top: rect.top - 8, left: rect.left });
    setOpen(true);
    fetchMissingNames().catch(() => null);
  };

  return (
    <div ref={anchorRef} style={{ position: "relative", display: "inline-block" }} onMouseEnter={show} onMouseLeave={() => setOpen(false)}>
      <button type="button" style={buttonStyle} onClick={onReact}>{emoji} {reactions?.length || ""}</button>
      {open && typeof document !== "undefined" ? createPortal(
        <div onMouseEnter={show} onMouseLeave={() => setOpen(false)} style={{ position: "fixed", top: coords.top, left: coords.left, transform: "translateY(-100%)", minWidth: 180, maxWidth: 260, background: "#fff", border: "1px solid #ead5df", borderRadius: 12, boxShadow: "0 10px 24px rgba(57,30,45,0.18)", padding: 10, zIndex: 10001 }}>
          <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 6 }}>Reacted with {emoji}</div>
          <div style={{ display: "grid", gap: 6 }}>
            {uniquePeople.map((r: any) => (
              <Link key={r.user_id} href={`/members/${r.user_id}`} style={{ color: "#8d2d5d", textDecoration: "none", fontWeight: 600 }}>{displayName(r)}</Link>
            ))}
          </div>
        </div>, document.body
      ) : null}
    </div>
  );
}

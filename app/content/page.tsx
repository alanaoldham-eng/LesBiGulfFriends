"use client";
export const dynamic = "force-dynamic";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ClientShell } from "../../components/ClientShell";
import { getCurrentUser } from "../../lib/auth";
import { getFeaturedContentSources, getLatestContentItems, getMySavedContent, saveContentItem, unsaveContentItem } from "../../lib/roadmap";

export default function ContentPage() {
  const [me, setMe] = useState("");
  const [sources, setSources] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [status, setStatus] = useState("");

  const refresh = async (uid?: string) => {
    const [featured, latest, saved] = await Promise.all([
      getFeaturedContentSources().catch(() => []),
      getLatestContentItems(12).catch(() => []),
      uid ? getMySavedContent(uid).catch(() => []) : Promise.resolve([]),
    ]);
    setSources(featured);
    setItems(latest);
    setSavedIds(new Set((saved || []).map((row: any) => row.content_item_id)));
  };

  useEffect(() => {
    getCurrentUser().then(async (user) => {
      const uid = user?.id || "";
      setMe(uid);
      await refresh(uid);
    });
  }, []);

  const toggleSave = async (itemId: string) => {
    if (!me) return;
    try {
      if (savedIds.has(itemId)) {
        await unsaveContentItem(me, itemId);
        setStatus("Removed from saved.");
      } else {
        await saveContentItem(me, itemId);
        setStatus("Saved for later.");
      }
      await refresh(me);
    } catch (e: any) {
      setStatus(e.message || "Unable to update saved content.");
    }
  };

  return (
    <ClientShell>
      <section className="hero">
        <h1 style={{ margin: 0, fontSize: 30 }}>Curated Content</h1>
        <p style={{ fontSize: 16, lineHeight: 1.6, opacity: 0.9 }}>
          Fresh picks for members. Stream from official sources when available, save favorites, and come back later.
        </p>
      </section>

      <div className="grid">
        <section style={{ border: "1px solid #e9d7e2", borderRadius: 20, padding: 16, background: "#fff" }}>
          <h3 style={{ marginTop: 0 }}>Featured this week</h3>
          {sources.length ? sources.map((source) => (
            <div key={source.id} style={{ border: "1px solid #f1dfe8", borderRadius: 16, padding: 14, marginBottom: 10 }}>
              <strong>{source.title}</strong>
              <p style={{ margin: "8px 0", opacity: 0.8 }}>{source.editorial_note || source.description || "Fresh curated content."}</p>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <Link className="button secondary" href={`/content/${source.slug}`}>Open feed</Link>
                {source.website_url ? <a className="button secondary" href={source.website_url} target="_blank" rel="noreferrer">Official source</a> : null}
              </div>
            </div>
          )) : <p style={{ margin: 0, opacity: 0.8 }}>No featured sources yet. Add rows to <code>content_sources</code> and mark them featured.</p>}
        </section>

        <section style={{ border: "1px solid #e9d7e2", borderRadius: 20, padding: 16, background: "#fff" }}>
          <h3 style={{ marginTop: 0 }}>Fresh picks</h3>
          {items.length ? items.map((item) => (
            <div key={item.id} style={{ borderBottom: "1px solid #f1dfe8", padding: "10px 0" }}>
              <div style={{ fontSize: 12, opacity: 0.6 }}>{item.content_sources?.title || "Curated source"}</div>
              <strong>{item.title}</strong>
              <p style={{ margin: "8px 0", opacity: 0.8 }}>{item.editorial_summary || item.description || "No description yet."}</p>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                {item.audio_url ? <audio controls src={item.audio_url} style={{ width: "100%" }} /> : null}
                {item.item_url ? <a className="button secondary" href={item.item_url} target="_blank" rel="noreferrer">Open source</a> : null}
                <button className="button secondary" onClick={() => toggleSave(item.id)}>{savedIds.has(item.id) ? "Unsave" : "Save"}</button>
              </div>
            </div>
          )) : <p style={{ margin: 0, opacity: 0.8 }}>No synced items yet. You can still feature source cards above and add RSS syncing later.</p>}
        </section>

        {status ? <p style={{ margin: 0, opacity: 0.8 }}>{status}</p> : null}
      </div>
    </ClientShell>
  );
}

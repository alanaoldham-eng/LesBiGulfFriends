"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { ClientShell } from "../../../components/ClientShell";
import { getContentItemsBySource, getContentSourceBySlug, saveContentItem, unsaveContentItem, getMySavedContent } from "../../../lib/roadmap";
import { getCurrentUser } from "../../../lib/auth";

export default function ContentSourcePage() {
  const params = useParams<{ sourceSlug: string }>();
  const sourceSlug = params.sourceSlug;
  const [me, setMe] = useState("");
  const [source, setSource] = useState<any | null>(null);
  const [items, setItems] = useState<any[]>([]);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [status, setStatus] = useState("");

  const refresh = async (uid?: string) => {
    const sourceRow = await getContentSourceBySlug(sourceSlug).catch(() => null);
    setSource(sourceRow);
    if (sourceRow?.id) setItems(await getContentItemsBySource(sourceRow.id).catch(() => []));
    if (uid) {
      const saved = await getMySavedContent(uid).catch(() => []);
      setSavedIds(new Set((saved || []).map((row: any) => row.content_item_id)));
    }
  };

  useEffect(() => {
    getCurrentUser().then(async (user) => {
      const uid = user?.id || "";
      setMe(uid);
      await refresh(uid);
    });
  }, [sourceSlug]);

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
        <h1 style={{ margin: 0, fontSize: 30 }}>{source?.title || "Curated Source"}</h1>
        <p style={{ fontSize: 16, lineHeight: 1.6, opacity: 0.9 }}>
          {source?.editorial_note || source?.description || "Streaming from the official source when available."}
        </p>
      </section>
      <div className="grid">
        <section style={{ border: "1px solid #e9d7e2", borderRadius: 20, padding: 16, background: "#fff" }}>
          <h3 style={{ marginTop: 0 }}>Episodes and items</h3>
          {items.length ? items.map((item) => (
            <div key={item.id} style={{ borderBottom: "1px solid #f1dfe8", padding: "10px 0" }}>
              <strong>{item.title}</strong>
              <p style={{ margin: "8px 0", opacity: 0.8 }}>{item.editorial_summary || item.description || "No description yet."}</p>
              {item.audio_url ? <audio controls src={item.audio_url} style={{ width: "100%" }} /> : null}
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 8 }}>
                {item.item_url ? <a className="button secondary" href={item.item_url} target="_blank" rel="noreferrer">Open official source</a> : null}
                <button className="button secondary" onClick={() => toggleSave(item.id)}>{savedIds.has(item.id) ? "Unsave" : "Save"}</button>
              </div>
            </div>
          )) : <p style={{ margin: 0, opacity: 0.8 }}>No synced items yet. Seed or sync this source to populate the list.</p>}
        </section>
        {status ? <p style={{ margin: 0, opacity: 0.8 }}>{status}</p> : null}
      </div>
    </ClientShell>
  );
}

"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { ClientShell } from "../../../components/ClientShell";
import { getCurrentUser } from "../../../lib/auth";
import { getMyGameParticipation, listGameInstancesBySlug, listGameParticipation, upsertGameParticipation } from "../../../lib/roadmap";

export default function ThisOrThatPage() {
  const [me, setMe] = useState("");
  const [instances, setInstances] = useState<any[]>([]);
  const [myChoices, setMyChoices] = useState<Record<string, string>>({});
  const [counts, setCounts] = useState<Record<string, { a: number; b: number }>>({});
  const [status, setStatus] = useState("");

  const refresh = async (uid?: string) => {
    const data = await listGameInstancesBySlug("this-or-that").catch(() => ({ instances: [] }));
    setInstances(data.instances || []);
    const nextCounts: Record<string, { a: number; b: number }> = {};
    const nextChoices: Record<string, string> = {};
    for (const instance of data.instances || []) {
      const participation = await listGameParticipation(instance.id).catch(() => []);
      nextCounts[instance.id] = {
        a: participation.filter((row: any) => row.choice_key === "a").length,
        b: participation.filter((row: any) => row.choice_key === "b").length,
      };
      if (uid) {
        const mine = await getMyGameParticipation(instance.id, uid).catch(() => null);
        if (mine?.choice_key) nextChoices[instance.id] = mine.choice_key;
      }
    }
    setCounts(nextCounts);
    setMyChoices(nextChoices);
  };

  useEffect(() => {
    getCurrentUser().then(async (user) => {
      const uid = user?.id || "";
      setMe(uid);
      await refresh(uid);
    });
  }, []);

  const choose = async (gameId: string, choiceKey: "a" | "b") => {
    try {
      await upsertGameParticipation({ game_instance_id: gameId, user_id: me, choice_key: choiceKey, is_anonymous: false });
      setStatus("Vote saved.");
      await refresh(me);
    } catch (e: any) {
      setStatus(e.message || "Unable to save vote.");
    }
  };

  return (
    <ClientShell>
      <section className="hero">
        <h1 style={{ margin: 0, fontSize: 30 }}>This or That</h1>
        <p style={{ fontSize: 16, lineHeight: 1.6, opacity: 0.9 }}>Fast choice games with instant participation.</p>
      </section>
      <div className="grid">
        {instances.map((instance) => (
          <section key={instance.id} style={{ border: "1px solid #e9d7e2", borderRadius: 20, padding: 16, background: "#fff" }}>
            <h3 style={{ marginTop: 0 }}>{instance.title}</h3>
            <p style={{ opacity: 0.8 }}>{instance.body}</p>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button className="button secondary" onClick={() => choose(instance.id, "a")}>{instance.option_a}</button>
              <button className="button secondary" onClick={() => choose(instance.id, "b")}>{instance.option_b}</button>
            </div>
            <div style={{ marginTop: 10, opacity: 0.8 }}>
              Your vote: {myChoices[instance.id] === "a" ? instance.option_a : myChoices[instance.id] === "b" ? instance.option_b : "Not yet voted"}
            </div>
            <div style={{ marginTop: 8, opacity: 0.75 }}>{instance.option_a}: {counts[instance.id]?.a || 0} • {instance.option_b}: {counts[instance.id]?.b || 0}</div>
          </section>
        ))}
        {!instances.length ? <p style={{ margin: 0, opacity: 0.8 }}>No active This or That games yet.</p> : null}
        {status ? <p style={{ margin: 0, opacity: 0.8 }}>{status}</p> : null}
      </div>
    </ClientShell>
  );
}

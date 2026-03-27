"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { ClientShell } from "../../../components/ClientShell";
import { getCurrentUser } from "../../../lib/auth";
import {
  listGameInstancesBySlug,
  listGameParticipation,
  upsertGameParticipation,
  getGameReactionSummary,
  reactToGameParticipation,
  reportGameParticipation,
} from "../../../lib/roadmap";

type HotTakeInstance = {
  id: string;
  title: string;
  body: string;
  is_anonymous: boolean;
};

type HotTakeResponseRow = {
  id: string;
  game_instance_id: string;
  user_id?: string;
  choice_key: string | null;
  response_text: string | null;
  is_anonymous: boolean;
  created_at: string;
};

type ReactionSummary = {
  like: number;
  fun: number;
  agree: number;
  fire: number;
};

const EMPTY_REACTIONS: ReactionSummary = {
  like: 0,
  fun: 0,
  agree: 0,
  fire: 0,
};

export default function HotTakesPage() {
  const [me, setMe] = useState("");
  const [instances, setInstances] = useState<HotTakeInstance[]>([]);
  const [responses, setResponses] = useState<Record<string, HotTakeResponseRow[]>>({});
  const [status, setStatus] = useState("");
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [reactionCounts, setReactionCounts] = useState<Record<string, ReactionSummary>>({});

  const refresh = async () => {
    const data = await listGameInstancesBySlug("hot-takes").catch(() => ({ instances: [] as HotTakeInstance[] }));
    const nextInstances = (data.instances || []) as HotTakeInstance[];
    setInstances(nextInstances);

    const nextResponses: Record<string, HotTakeResponseRow[]> = {};
    const nextCounts: Record<string, ReactionSummary> = {};

    for (const instance of nextInstances) {
      const rows = (await listGameParticipation(instance.id, instance.is_anonymous).catch(
        () => []
      )) as HotTakeResponseRow[];

      nextResponses[instance.id] = rows;

      for (const row of rows) {
        const summary = await getGameReactionSummary(row.id).catch(
          () => EMPTY_REACTIONS
        );

        nextCounts[row.id] = {
          like: Number(summary?.like || 0),
          fun: Number(summary?.fun || 0),
          agree: Number(summary?.agree || 0),
          fire: Number(summary?.fire || 0),
        };
      }
    }

    setResponses(nextResponses);
    setReactionCounts(nextCounts);
  };

  useEffect(() => {
    getCurrentUser().then(async (user) => {
      setMe(user?.id || "");
      await refresh();
    });
  }, []);

  const submit = async (instanceId: string, choiceKey: string) => {
    try {
      await upsertGameParticipation({
        game_instance_id: instanceId,
        user_id: me,
        choice_key: choiceKey,
        response_text: drafts[instanceId] || null,
        is_anonymous: true,
      });
      setDrafts((prev) => ({ ...prev, [instanceId]: "" }));
      setStatus("Hot take response saved.");
      await refresh();
    } catch (e: any) {
      setStatus(e.message || "Unable to save response.");
    }
  };

  const react = async (participationId: string, reactionType: string) => {
    try {
      await reactToGameParticipation(me, participationId, reactionType);
      await refresh();
    } catch (e: any) {
      setStatus(e.message || "Unable to react.");
    }
  };

  const report = async (participationId: string) => {
    try {
      await reportGameParticipation(me, participationId, "Reported from Hot Takes");
      setStatus("Response reported for review.");
    } catch (e: any) {
      setStatus(e.message || "Unable to report response.");
    }
  };

  return (
    <ClientShell>
      <section className="hero">
        <h1 style={{ margin: 0, fontSize: 30 }}>Hot Takes</h1>
        <p style={{ fontSize: 16, lineHeight: 1.6, opacity: 0.9 }}>
          Short opinions, reactions, and discussion. Anonymous mode stays on by default here.
        </p>
      </section>

      <div className="grid">
        {instances.map((instance) => (
          <section
            key={instance.id}
            style={{ border: "1px solid #e9d7e2", borderRadius: 20, padding: 16, background: "#fff" }}
          >
            <h3 style={{ marginTop: 0 }}>{instance.title}</h3>
            <p style={{ opacity: 0.8 }}>{instance.body}</p>

            <textarea
              value={drafts[instance.id] || ""}
              onChange={(e) =>
                setDrafts((prev) => ({ ...prev, [instance.id]: e.target.value }))
              }
              placeholder="Optional short response"
              style={{
                width: "100%",
                minHeight: 100,
                padding: "14px 16px",
                borderRadius: 16,
                border: "1px solid #d7a8bf",
                fontSize: 16,
              }}
            />

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 10 }}>
              <button className="button secondary" onClick={() => submit(instance.id, "agree")}>
                Agree
              </button>
              <button className="button secondary" onClick={() => submit(instance.id, "disagree")}>
                Disagree
              </button>
            </div>

            <h4 style={{ marginTop: 18 }}>Responses</h4>
            {(responses[instance.id] || []).length ? (
              (responses[instance.id] || []).map((row) => (
                <div key={row.id} style={{ borderBottom: "1px solid #f1dfe8", padding: "10px 0" }}>
                  <div style={{ fontSize: 12, opacity: 0.6 }}>
                    {row.is_anonymous ? "Anonymous" : row.user_id || "Member"}
                  </div>
                  <div style={{ fontWeight: 700, marginTop: 4 }}>
                    {row.choice_key === "agree"
                      ? "Agrees"
                      : row.choice_key === "disagree"
                        ? "Disagrees"
                        : "Responded"}
                  </div>
                  {row.response_text ? <div style={{ marginTop: 4 }}>{row.response_text}</div> : null}

                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 }}>
                    <button className="button secondary" onClick={() => react(row.id, "like")}>
                      👍 {reactionCounts[row.id]?.like || ""}
                    </button>
                    <button className="button secondary" onClick={() => react(row.id, "fun")}>
                      😂 {reactionCounts[row.id]?.fun || ""}
                    </button>
                    <button className="button secondary" onClick={() => react(row.id, "agree")}>
                      💬 {reactionCounts[row.id]?.agree || ""}
                    </button>
                    <button className="button secondary" onClick={() => react(row.id, "fire")}>
                      🔥 {reactionCounts[row.id]?.fire || ""}
                    </button>
                    <button className="button secondary" onClick={() => report(row.id)}>
                      Report
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <p style={{ margin: 0, opacity: 0.8 }}>No responses yet.</p>
            )}
          </section>
        ))}

        {!instances.length ? <p style={{ margin: 0, opacity: 0.8 }}>No active hot takes yet.</p> : null}
        {status ? <p style={{ margin: 0, opacity: 0.8 }}>{status}</p> : null}
      </div>
    </ClientShell>
  );
}
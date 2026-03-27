"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { ClientShell } from "../../../components/ClientShell";
import { getCurrentUser } from "../../../lib/auth";
import { getMyGameParticipation, listGameInstancesBySlug, listGameParticipation, upsertGameParticipation } from "../../../lib/roadmap";

export default function DailyPromptPage() {
  const [me, setMe] = useState("");
  const [instances, setInstances] = useState<any[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [responses, setResponses] = useState<Record<string, any[]>>({});
  const [status, setStatus] = useState("");

  const refresh = async (uid?: string) => {
    const data = await listGameInstancesBySlug("daily-prompt").catch(() => ({ instances: [] }));
    setInstances(data.instances || []);
    const nextAnswers: Record<string, string> = {};
    const nextResponses: Record<string, any[]> = {};
    for (const instance of data.instances || []) {
      nextResponses[instance.id] = await listGameParticipation(instance.id).catch(() => []);
      if (uid) {
        const mine = await getMyGameParticipation(instance.id, uid).catch(() => null);
        if (mine?.response_text) nextAnswers[instance.id] = mine.response_text;
      }
    }
    setAnswers(nextAnswers);
    setResponses(nextResponses);
  };

  useEffect(() => {
    getCurrentUser().then(async (user) => {
      const uid = user?.id || "";
      setMe(uid);
      await refresh(uid);
    });
  }, []);

  const save = async (instanceId: string, value: string) => {
    try {
      await upsertGameParticipation({ game_instance_id: instanceId, user_id: me, response_text: value, is_anonymous: false });
      setStatus("Answer saved.");
      await refresh(me);
    } catch (e: any) {
      setStatus(e.message || "Unable to save answer.");
    }
  };

  return (
    <ClientShell>
      <section className="hero">
        <h1 style={{ margin: 0, fontSize: 30 }}>Daily Prompt</h1>
        <p style={{ fontSize: 16, lineHeight: 1.6, opacity: 0.9 }}>A fresh prompt for members each day.</p>
      </section>
      <div className="grid">
        {instances.map((instance) => (
          <section key={instance.id} style={{ border: "1px solid #e9d7e2", borderRadius: 20, padding: 16, background: "#fff" }}>
            <h3 style={{ marginTop: 0 }}>{instance.title}</h3>
            <p style={{ opacity: 0.8 }}>{instance.body}</p>
            <textarea
              defaultValue={answers[instance.id] || ""}
              onBlur={(e) => save(instance.id, e.target.value)}
              placeholder="Write your answer"
              style={{ width: "100%", minHeight: 100, padding: "14px 16px", borderRadius: 16, border: "1px solid #d7a8bf", fontSize: 16 }}
            />
            <h4 style={{ marginTop: 16 }}>Recent answers</h4>
            {(responses[instance.id] || []).length ? (responses[instance.id] || []).slice(0, 8).map((row: any) => (
              <div key={row.id} style={{ borderBottom: "1px solid #f1dfe8", padding: "8px 0" }}>{row.response_text}</div>
            )) : <p style={{ margin: 0, opacity: 0.8 }}>No answers yet.</p>}
          </section>
        ))}
        {!instances.length ? <p style={{ margin: 0, opacity: 0.8 }}>No active prompts yet.</p> : null}
        {status ? <p style={{ margin: 0, opacity: 0.8 }}>{status}</p> : null}
      </div>
    </ClientShell>
  );
}

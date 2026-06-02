"use client";
export const dynamic = "force-dynamic";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ClientShell } from "../../components/ClientShell";
import { StatusModal } from "../../components/StatusModal";
import { getCurrentUser } from "../../lib/auth";
import { getMainGroupId } from "../../lib/db";
import {
  answerDisplay,
  getKreweCompletionStatus,
  listKreweQuestions,
  listMyKreweAnswers,
  saveKreweAnswer,
} from "../../lib/kreweVibe";

function ToggleOption({
  selected,
  label,
  onClick,
}: {
  selected: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button type="button" onClick={onClick} className={selected ? "button" : "button secondary"}>
      {label}
    </button>
  );
}

export default function KreweVibePage() {
  const router = useRouter();
  const [me, setMe] = useState("");
  const [questions, setQuestions] = useState<any[]>([]);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState("");
  const [redirectAfterStatus, setRedirectAfterStatus] = useState(false);
  const [redirecting, setRedirecting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [completion, setCompletion] = useState({ answeredCount: 0, requiredCount: 18, complete: false });

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      const user = await getCurrentUser().catch(() => null);
      if (!user) {
        setLoading(false);
        return;
      }

      setMe(user.id);

      const [qs, rows, complete] = await Promise.all([
        listKreweQuestions(),
        listMyKreweAnswers(user.id).catch(() => []),
        getKreweCompletionStatus(user.id).catch(() => ({ answeredCount: 0, requiredCount: 18, complete: false })),
      ]);

      setQuestions(qs);
      setCompletion(complete);

      const next: Record<string, any> = {};
      for (const row of rows as any[]) {
        next[row.question_id] = row.answer_value ?? row.answer_text ?? "";
      }

      setAnswers(next);
      setLoading(false);
    };

    run();
  }, []);

  const grouped = useMemo(() => {
    const map = new Map<string, any[]>();

    for (const question of questions) {
      map.set(question.section, [...(map.get(question.section) || []), question]);
    }

    return Array.from(map.entries());
  }, [questions]);

  const setAnswer = (question: any, value: any) => {
    setAnswers((current) => ({ ...current, [question.id]: value }));
  };

  const toggleMulti = (question: any, option: string) => {
    const current = Array.isArray(answers[question.id]) ? answers[question.id] : [];
    const next = current.includes(option)
      ? current.filter((item: string) => item !== option)
      : [...current, option];

    setAnswer(question, next);
  };

  const saveAll = async () => {
    if (!me || saving) return;

    if (!questions.length) {
      setStatus("Krewe Vibe questions are not loaded yet. Run the v095.1 SQL patch in Supabase, then refresh this page.");
      return;
    }

    setSaving(true);
    setStatus("");
    setRedirectAfterStatus(false);

    try {
      for (const question of questions) {
        const value = answers[question.id];

        if (
          value === undefined ||
          value === null ||
          value === "" ||
          (Array.isArray(value) && !value.length)
        ) {
          continue;
        }

        await saveKreweAnswer({
          userId: me,
          questionId: question.id,
          answerValue: value,
          answerText: typeof value === "string" ? value : null,
        });
      }

      const nextCompletion = await getKreweCompletionStatus(me).catch(() => completion);
      setCompletion(nextCompletion);

      const completed = !!nextCompletion.complete;
      setRedirectAfterStatus(completed);
      setStatus(
        completed
          ? "Krewe Vibe complete. Redirecting to the Main group..."
          : "Krewe Vibe saved. You can come back and finish the remaining required questions."
      );

      if (completed) {
        window.setTimeout(() => {
          void goToMainGroup();
        }, 900);
      }
    } catch (e: any) {
      setStatus(e.message || "Unable to save Krewe Vibe.");
    } finally {
      setSaving(false);
    }
  };


  const goToMainGroup = async () => {
    if (redirecting) return;

    setRedirecting(true);
    setStatus("");

    const mainGroupId = await getMainGroupId().catch(() => null);
    const href = mainGroupId ? `/groups-app/${mainGroupId}` : "/groups-app";

    router.push(href);

    // Hard fallback for cases where router.push is swallowed by a modal click/event timing.
    window.setTimeout(() => {
      if (window.location.pathname !== href) {
        window.location.assign(href);
      }
    }, 250);
  };

  const closeStatus = () => {
    if (redirectAfterStatus) {
      void goToMainGroup();
      return;
    }

    setStatus("");
  };

  const renderQuestion = (question: any) => {
    const value = answers[question.id];

    return (
      <section
        key={question.id}
        style={{
          border: "1px solid #e9d7e2",
          borderRadius: 20,
          padding: 16,
          background: "#fff",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "flex-start" }}>
          <h3 style={{ marginTop: 0, marginBottom: 8 }}>{question.question_text}</h3>
          {question.required ? (
            <span style={{ fontSize: 12, color: "#8d2d5d", fontWeight: 800 }}>Required</span>
          ) : (
            <span style={{ fontSize: 12, opacity: 0.65 }}>Optional</span>
          )}
        </div>

        {question.answer_type === "single_choice" ? (
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {(question.options || []).map((option: string) => (
              <ToggleOption
                key={option}
                label={option}
                selected={value === option}
                onClick={() => setAnswer(question, option)}
              />
            ))}
          </div>
        ) : null}

        {question.answer_type === "multi_choice" ? (
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {(question.options || []).map((option: string) => (
              <ToggleOption
                key={option}
                label={option}
                selected={Array.isArray(value) && value.includes(option)}
                onClick={() => toggleMulti(question, option)}
              />
            ))}
          </div>
        ) : null}

        {["short_answer", "long_answer", "optional"].includes(question.answer_type) ? (
          <textarea
            value={typeof value === "string" ? value : answerDisplay({ answer_value: value })}
            onChange={(e) => setAnswer(question, e.target.value)}
            placeholder="Write your answer..."
            style={{
              width: "100%",
              minHeight: question.answer_type === "short_answer" ? 82 : 118,
              padding: "14px 16px",
              borderRadius: 16,
              border: "1px solid #d7a8bf",
              fontSize: 16,
            }}
          />
        ) : null}
      </section>
    );
  };

  return (
    <ClientShell>
      <section className="hero">
        <h1 style={{ margin: 0, fontSize: 30 }}>Krewe Vibe</h1>
        <p style={{ fontSize: 16, lineHeight: 1.6, opacity: 0.9 }}>
          Check compatibility
        </p>
      </section>

      <div className="grid">
        <section style={{ border: "1px solid #e9d7e2", borderRadius: 20, padding: 16, background: "#fff7fb" }}>
          <h3 style={{ marginTop: 0 }}>Progress</h3>
          <p style={{ marginBottom: 0, opacity: 0.8 }}>
            {completion.answeredCount} of {completion.requiredCount} required questions answered.
            {completion.complete ? " Your Krewe Vibe is complete." : " You can save and come back anytime."}
          </p>
        </section>

        {loading ? (
          <section style={{ border: "1px solid #e9d7e2", borderRadius: 20, padding: 16, background: "#fff" }}>
            <h3 style={{ marginTop: 0 }}>Loading questions...</h3>
            <p style={{ marginBottom: 0, opacity: 0.75 }}>The Krewe is setting out chairs on the porch.</p>
          </section>
        ) : null}

        {!loading && !questions.length ? (
          <section style={{ border: "1px solid #e9d7e2", borderRadius: 20, padding: 16, background: "#fff7fb" }}>
            <h3 style={{ marginTop: 0 }}>Questions are not loaded</h3>
            <p style={{ marginBottom: 0, opacity: 0.8 }}>
              Run <strong>sql/v095_1_krewe_vibe_bugfix.sql</strong> in Supabase, then refresh this page.
            </p>
          </section>
        ) : null}

        {grouped.map(([section, sectionQuestions]) => (
          <div key={section} className="grid">
            <section style={{ border: "1px solid #e9d7e2", borderRadius: 20, padding: 16, background: "#fff7fb" }}>
              <h2 style={{ margin: 0, fontSize: 22 }}>{section}</h2>
            </section>

            {sectionQuestions.map(renderQuestion)}
          </div>
        ))}

        <button className="button" onClick={saveAll} disabled={saving || !me || loading || !questions.length}>
          {saving ? "Saving..." : "Save Krewe Vibe"}
        </button>
      </div>

      <StatusModal open={!!status} message={status} onClose={closeStatus} />
    </ClientShell>
  );
}

"use client";
export const dynamic = "force-dynamic";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { ClientShell } from "../../../components/ClientShell";
import { getCurrentUser } from "../../../lib/auth";
import { askWaitingRoomQuestion, getWaitingRoomCandidateById, listWaitingRoomAnswers, listWaitingRoomQuestions, approveWaitingRoomCandidate, rejectWaitingRoomCandidate } from "../../../lib/roadmap";

export default function WaitingCandidatePage() {
  const params = useParams<{ candidateId: string }>();
  const candidateId = params.candidateId;
  const [me, setMe] = useState("");
  const [candidate, setCandidate] = useState<any | null>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [answers, setAnswers] = useState<any[]>([]);
  const [question, setQuestion] = useState("");
  const [status, setStatus] = useState("");
  const [rejectReasonKey, setRejectReasonKey] = useState("kyc_failed");
  const [rejectReasonText, setRejectReasonText] = useState("");

  const answerMap = useMemo(() => {
    const map = new Map<string, any[]>();
    for (const answer of answers) map.set(answer.question_id, [...(map.get(answer.question_id) || []), answer]);
    return map;
  }, [answers]);

  const refresh = async () => {
    const [cand, qs, ans] = await Promise.all([
      getWaitingRoomCandidateById(candidateId).catch(() => null),
      listWaitingRoomQuestions(candidateId).catch(() => []),
      listWaitingRoomAnswers(candidateId).catch(() => []),
    ]);
    setCandidate(cand);
    setQuestions(qs);
    setAnswers(ans);
  };

  useEffect(() => {
    getCurrentUser().then(async (user) => {
      if (!user) return;
      setMe(user.id);
      await refresh();
    });
  }, [candidateId]);

  const submitQuestion = async () => {
    if (!question.trim()) return;
    try {
      await askWaitingRoomQuestion(candidateId, me, question);
      setQuestion("");
      setStatus("Question added.");
      await refresh();
    } catch (e: any) {
      setStatus(e.message || "Unable to ask question.");
    }
  };

  const approve = async () => {
    try {
      await approveWaitingRoomCandidate(candidateId, me);
      setStatus("Candidate approved and sponsor reward granted.");
      await refresh();
    } catch (e: any) {
      setStatus(e.message || "Unable to approve candidate.");
    }
  };

  const reject = async () => {
    try {
      const text = rejectReasonKey === "other" ? rejectReasonText : rejectReasonKey === "member_objection" ? (rejectReasonText || "Member objection after Main group discussion.") : null;
      await rejectWaitingRoomCandidate(candidateId, me, rejectReasonKey, text);
      setStatus("Candidate logged and deleted.");
      await refresh();
    } catch (e: any) {
      setStatus(e.message || "Unable to reject candidate.");
    }
  };

  return (
    <ClientShell>
      <section className="hero">
        <h1 style={{ margin: 0, fontSize: 30 }}>Waiting Room Review</h1>
        <p style={{ fontSize: 16, lineHeight: 1.6, opacity: 0.9 }}>
          Ask questions, review the intro video, and either let the candidate in or delete them. There is no alternate path from the waiting room.
        </p>
      </section>
      <div className="grid">
        <section style={{ border: "1px solid #e9d7e2", borderRadius: 20, padding: 16, background: "#fff" }}>
          <h3 style={{ marginTop: 0 }}>{candidate?.profiles?.display_name || "New Member"}</h3>
          <p style={{ opacity: 0.85 }}>{candidate?.profiles?.bio || "No bio yet."}</p>
          {candidate?.intro_video_url ? <a className="button secondary" href={candidate.intro_video_url} target="_blank" rel="noreferrer">Open intro video</a> : <p style={{ opacity: 0.75 }}>No intro video uploaded yet.</p>}
          <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
            <textarea value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="Ask a respectful question" style={{ minHeight: 100, padding: '14px 16px', borderRadius: 16, border: '1px solid #d7a8bf', fontSize: 16 }} />
            <button className="button secondary" onClick={submitQuestion}>Ask question</button>
          </div>
          <div style={{ marginTop: 16, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button className="button" onClick={approve}>Let Her In (+0.2 karma)</button>
          </div>
          <div style={{ marginTop: 16, borderTop: '1px solid #f1dfe8', paddingTop: 16 }}>
            <h4 style={{ marginTop: 0 }}>Reject and delete</h4>
            <label style={{ display: 'block', marginBottom: 8 }}><input type="radio" checked={rejectReasonKey === 'kyc_failed'} onChange={() => setRejectReasonKey('kyc_failed')} /> KYC failed</label>
            <label style={{ display: 'block', marginBottom: 8 }}><input type="radio" checked={rejectReasonKey === 'member_objection'} onChange={() => setRejectReasonKey('member_objection')} /> Member objection after Main group discussion</label>
            <label style={{ display: 'block', marginBottom: 8 }}><input type="radio" checked={rejectReasonKey === 'other'} onChange={() => setRejectReasonKey('other')} /> Other reason</label>
            {(rejectReasonKey === 'member_objection' || rejectReasonKey === 'other') ? <textarea value={rejectReasonText} onChange={(e) => setRejectReasonText(e.target.value)} placeholder={rejectReasonKey === 'member_objection' ? 'State the objection reason' : 'Write the rejection reason'} style={{ width: '100%', minHeight: 100, padding: '14px 16px', borderRadius: 16, border: '1px solid #d7a8bf', fontSize: 16 }} /> : null}
            <div style={{ marginTop: 10 }}><button className="button secondary" onClick={reject}>Reject candidate</button></div>
          </div>
        </section>
        <section style={{ border: "1px solid #e9d7e2", borderRadius: 20, padding: 16, background: "#fff" }}>
          <h3 style={{ marginTop: 0 }}>Questions and answers</h3>
          {questions.length ? questions.map((q) => (
            <div key={q.id} style={{ borderBottom: '1px solid #f1dfe8', padding: '10px 0' }}>
              <div style={{ fontWeight: 700 }}>{q.body}</div>
              {(answerMap.get(q.id) || []).map((a) => (
                <div key={a.id} style={{ marginTop: 8, padding: 10, border: '1px solid #f1dfe8', borderRadius: 14, background: '#fffafc' }}>
                  {a.body ? <div>{a.body}</div> : null}
                  {a.video_url ? <div style={{ marginTop: 6 }}><a href={a.video_url} target="_blank" rel="noreferrer">Open answer video</a></div> : null}
                </div>
              ))}
            </div>
          )) : <p style={{ margin: 0, opacity: 0.8 }}>No questions yet.</p>}
        </section>
        {status ? <p style={{ margin: 0, opacity: 0.8 }}>{status}</p> : null}
      </div>
    </ClientShell>
  );
}

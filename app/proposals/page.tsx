"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { ClientShell } from "../../components/ClientShell";
import { getCurrentUser } from "../../lib/auth";
import { createProposal, listProposals, castProposalVote, listProposalVotes, getMyProfile } from "../../lib/db";

const ADMIN_EMAIL = "alanaoldham@gmail.com";

export default function ProposalsPage() {
  const [me, setMe] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [profileComplete, setProfileComplete] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [electionKey, setElectionKey] = useState("");
  const [items, setItems] = useState<any[]>([]);
  const [votesMap, setVotesMap] = useState<Record<string, any[]>>({});
  const [status, setStatus] = useState("");

  const refresh = async () => {
    const proposals = await listProposals().catch(() => []);
    setItems(proposals);
    const map: Record<string, any[]> = {};
    for (const p of proposals) {
      map[p.id] = await listProposalVotes(p.id).catch(() => []);
    }
    setVotesMap(map);
  };

  useEffect(() => {
    const run = async () => {
      const user = await getCurrentUser();
      if (!user) return;
      setMe(user.id);
      setIsAdmin((user.email?.toLowerCase() || "") === ADMIN_EMAIL);
      const profile = await getMyProfile(user.id).catch(() => null);
      setProfileComplete(Boolean((profile?.display_name || "").trim() && (profile?.bio || "").trim()));
      await refresh();
    };
    run();
  }, []);

  const create = async () => {
    try {
      const proposal = await createProposal({
        title,
        description,
        expires_at: new Date(expiresAt).toISOString(),
        created_by: me,
        election_key: electionKey,
      });
      await fetch("/api/proposals/send-invites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ proposalId: proposal.id, title, expiresAt, electionKey }),
      });
      setStatus("Proposal created and invite emails queued.");
      setTitle("");
      setDescription("");
      setExpiresAt("");
      setElectionKey("");
      await refresh();
    } catch (e: any) {
      setStatus(e.message || "Unable to create proposal.");
    }
  };

  const vote = async (proposalId: string, voteValue: string) => {
    try {
      await castProposalVote({ proposal_id: proposalId, user_id: me, vote_value: voteValue });
      setStatus("Vote cast. You earned 1 karma point and an I Voted badge for this election.");
      await refresh();
    } catch (e: any) {
      setStatus(e.message || "Unable to vote.");
    }
  };

  return (
    <ClientShell>
      <section className="hero">
        <h1 style={{ margin: 0, fontSize: 30 }}>Proposals and voting</h1>
        <p style={{ fontSize: 16, lineHeight: 1.6, opacity: 0.9 }}>
          Members with completed profiles can vote one time on each proposal before the deadline.
        </p>
      </section>

      <div className="grid">
        {isAdmin ? (
          <section style={{ border: "1px solid #e9d7e2", borderRadius: 20, padding: 16, background: "#fff" }}>
            <h3 style={{ marginTop: 0 }}>Create proposal</h3>
            <div style={{ display: "grid", gap: 12 }}>
              <input id="proposal-title" name="proposalTitle" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Proposal title" style={{ padding: "14px 16px", borderRadius: 16, border: "1px solid #d7a8bf", fontSize: 16 }} />
              <textarea id="proposal-description" name="proposalDescription" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Proposal description" style={{ minHeight: 140, padding: "14px 16px", borderRadius: 16, border: "1px solid #d7a8bf", fontSize: 16 }} />
              <input id="proposal-election-key" name="proposalElectionKey" value={electionKey} onChange={(e) => setElectionKey(e.target.value)} placeholder="Election key, e.g. 2026-city-council" style={{ padding: "14px 16px", borderRadius: 16, border: "1px solid #d7a8bf", fontSize: 16 }} />
              <input id="proposal-expires" name="proposalExpires" type="datetime-local" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} style={{ padding: "14px 16px", borderRadius: 16, border: "1px solid #d7a8bf", fontSize: 16 }} />
              <button className="button" onClick={create} disabled={!title || !description || !expiresAt || !electionKey}>Create proposal</button>
            </div>
          </section>
        ) : null}

        <section style={{ border: "1px solid #e9d7e2", borderRadius: 20, padding: 16, background: "#fff" }}>
          <h3 style={{ marginTop: 0 }}>Open proposals</h3>
          <div style={{ display: "grid", gap: 12 }}>
            {items.length ? items.map((item) => {
              const votes = votesMap[item.id] || [];
              const hasVoted = votes.some((v: any) => v.user_id === me);
              const expired = new Date(item.expires_at) <= new Date();
              return (
                <div key={item.id} style={{ border: "1px solid #f1dfe8", borderRadius: 16, padding: 14 }}>
                  <strong>{item.title}</strong>
                  <div style={{ opacity: 0.75, marginTop: 4 }}>Election: {item.election_key}</div>
                  <p style={{ margin: "8px 0", opacity: 0.85 }}>{item.description}</p>
                  <div style={{ opacity: 0.75 }}>Expires: {new Date(item.expires_at).toLocaleString()}</div>
                  <div style={{ opacity: 0.75, marginTop: 4 }}>Votes cast: {votes.length}</div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 10 }}>
                    <button className="button secondary" disabled={!profileComplete || hasVoted || expired} onClick={() => vote(item.id, "yes")}>Vote yes</button>
                    <button className="button secondary" disabled={!profileComplete || hasVoted || expired} onClick={() => vote(item.id, "no")}>Vote no</button>
                    <button className="button secondary" disabled={!profileComplete || hasVoted || expired} onClick={() => vote(item.id, "abstain")}>Abstain</button>
                  </div>
                  {!profileComplete ? <div style={{ marginTop: 8, opacity: 0.75 }}>Complete your profile before voting.</div> : null}
                  {hasVoted ? <div style={{ marginTop: 8, opacity: 0.75 }}>You already voted on this proposal.</div> : null}
                </div>
              );
            }) : <p style={{ margin: 0, opacity: 0.8 }}>No proposals yet.</p>}
          </div>
          {status ? <p style={{ marginTop: 12, opacity: 0.8 }}>{status}</p> : null}
        </section>
      </div>
    </ClientShell>
  );
}

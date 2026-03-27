"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { ClientShell } from "../../../components/ClientShell";
import { getCurrentUser } from "../../../lib/auth";
import {
  createConfessionReply,
  getAnonymousReactionSummary,
  getConfession,
  listConfessionReplies,
  reactToAnonymousPost,
  reactToAnonymousReply,
  reportAnonymousPost,
  reportAnonymousReply,
} from "../../../lib/roadmap";

const REACTIONS = [
  { key: "heart", label: "❤️ Heart" },
  { key: "hug", label: "🫂 Hug" },
  { key: "same", label: "💬 Same" },
  { key: "support", label: "🌷 Support" },
];

export default function ConfessionDetailPage() {
  const params = useParams<{ postId: string }>();
  const postId = params.postId;
  const [me, setMe] = useState("");
  const [post, setPost] = useState<any | null>(null);
  const [replies, setReplies] = useState<any[]>([]);
  const [replyBody, setReplyBody] = useState("");
  const [postSummary, setPostSummary] = useState<Record<string, number>>({ heart: 0, hug: 0, same: 0, support: 0 });
  const [replySummaries, setReplySummaries] = useState<Record<string, Record<string, number>>>({});
  const [status, setStatus] = useState("");

  const refresh = async () => {
    const [postRow, replyRows, summary] = await Promise.all([
      getConfession(postId).catch(() => null),
      listConfessionReplies(postId).catch(() => []),
      getAnonymousReactionSummary({ postId }).catch(() => ({ heart: 0, hug: 0, same: 0, support: 0 })),
    ]);
    setPost(postRow);
    setReplies(replyRows);
    setPostSummary(summary);
    const summaries: Record<string, Record<string, number>> = {};
    for (const reply of replyRows) {
      summaries[reply.id] = await getAnonymousReactionSummary({ replyId: reply.id }).catch(() => ({ heart: 0, hug: 0, same: 0, support: 0 }));
    }
    setReplySummaries(summaries);
  };

  useEffect(() => {
    getCurrentUser().then(async (user) => {
      setMe(user?.id || "");
      await refresh();
    });
  }, [postId]);

  const sendReply = async () => {
    if (!me || !replyBody.trim()) return;
    try {
      await createConfessionReply(me, postId, replyBody);
      setReplyBody("");
      setStatus("Reply posted anonymously.");
      await refresh();
    } catch (e: any) {
      setStatus(e.message || "Unable to reply.");
    }
  };

  const reactPost = async (reactionType: string) => {
    try {
      await reactToAnonymousPost(me, postId, reactionType);
      await refresh();
    } catch (e: any) {
      setStatus(e.message || "Unable to react.");
    }
  };

  const reactReply = async (replyId: string, reactionType: string) => {
    try {
      await reactToAnonymousReply(me, replyId, reactionType);
      await refresh();
    } catch (e: any) {
      setStatus(e.message || "Unable to react.");
    }
  };

  const reportPost = async () => {
    try {
      await reportAnonymousPost(me, postId, "Reported from confessional thread");
      setStatus("Post reported for review.");
    } catch (e: any) {
      setStatus(e.message || "Unable to report post.");
    }
  };

  const reportReply = async (replyId: string) => {
    try {
      await reportAnonymousReply(me, replyId, "Reported from confessional thread");
      setStatus("Reply reported for review.");
    } catch (e: any) {
      setStatus(e.message || "Unable to report reply.");
    }
  };

  return (
    <ClientShell>
      <section className="hero">
        <h1 style={{ margin: 0, fontSize: 30 }}>Confessional thread</h1>
        <p style={{ fontSize: 16, lineHeight: 1.6, opacity: 0.9 }}>Posts and replies are anonymous to members.</p>
      </section>
      <div className="grid">
        <section style={{ border: "1px solid #e9d7e2", borderRadius: 20, padding: 16, background: "#fff" }}>
          {post ? (
            <>
              <div style={{ fontSize: 12, opacity: 0.65 }}>Anonymous</div>
              <div style={{ whiteSpace: "pre-wrap", marginTop: 6 }}>{post.body}</div>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 12 }}>
                {REACTIONS.map((reaction) => (
                  <button key={reaction.key} className="button secondary" onClick={() => reactPost(reaction.key)}>
                    {reaction.label} {postSummary[reaction.key] || ""}
                  </button>
                ))}
                <button className="button secondary" onClick={reportPost}>Report</button>
              </div>
            </>
          ) : <p style={{ margin: 0, opacity: 0.8 }}>This confession is not available.</p>}
        </section>

        <section style={{ border: "1px solid #e9d7e2", borderRadius: 20, padding: 16, background: "#fff" }}>
          <h3 style={{ marginTop: 0 }}>Reply anonymously</h3>
          {!post?.is_locked ? (
            <>
              <textarea value={replyBody} onChange={(e) => setReplyBody(e.target.value)} placeholder="Reply anonymously..." style={{ width: "100%", minHeight: 110, padding: "14px 16px", borderRadius: 16, border: "1px solid #d7a8bf", fontSize: 16 }} />
              <div style={{ marginTop: 12 }}>
                <button className="button" onClick={sendReply}>Post reply</button>
              </div>
            </>
          ) : <p style={{ margin: 0, opacity: 0.8 }}>Replies are locked on this post.</p>}

          <h3 style={{ marginTop: 24 }}>Replies</h3>
          {replies.length ? replies.map((reply) => (
            <div key={reply.id} style={{ borderBottom: "1px solid #f1dfe8", padding: "12px 0" }}>
              <div style={{ fontSize: 12, opacity: 0.65 }}>Anonymous</div>
              <div style={{ whiteSpace: "pre-wrap", marginTop: 4 }}>{reply.body}</div>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 10 }}>
                {REACTIONS.map((reaction) => (
                  <button key={reaction.key} className="button secondary" onClick={() => reactReply(reply.id, reaction.key)}>
                    {reaction.label} {replySummaries[reply.id]?.[reaction.key] || ""}
                  </button>
                ))}
                <button className="button secondary" onClick={() => reportReply(reply.id)}>Report</button>
              </div>
            </div>
          )) : <p style={{ margin: 0, opacity: 0.8 }}>No replies yet.</p>}
        </section>

        {status ? <p style={{ margin: 0, opacity: 0.8 }}>{status}</p> : null}
      </div>
    </ClientShell>
  );
}

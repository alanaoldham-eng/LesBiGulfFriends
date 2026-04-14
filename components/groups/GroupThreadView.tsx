"use client";

import { useEffect, useState } from "react";
import {
  buildGroupThreads,
  createGroupPost,
  createGroupReply,
  getGroupComposerPlaceholder,
  hasUserPostedToGroupBefore,
  listGroupReplies,
  listGroupTopLevelMessages,
  type ThreadedGroupMessage,
} from "../../lib/groupThreads";

type Props = {
  groupId: string;
  groupName: string;
  currentUserId: string;
};

export default function GroupThreadView({
  groupId,
  groupName,
  currentUserId,
}: Props) {
  const [threads, setThreads] = useState<ThreadedGroupMessage[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [postDraft, setPostDraft] = useState("");
  const [replyingToId, setReplyingToId] = useState<string | null>(null);
  const [replyDraft, setReplyDraft] = useState("");
  const [hasPostedBefore, setHasPostedBefore] = useState(false);
  const [busy, setBusy] = useState(false);

  const load = async (nextPage = 1, append = false) => {
    const topLevel = await listGroupTopLevelMessages(groupId, nextPage, 10);
    const replies = await listGroupReplies(
      groupId,
      topLevel.rows.map((p) => p.id)
    );
    const nextThreads = buildGroupThreads(topLevel.rows, replies);
    const postedBefore = await hasUserPostedToGroupBefore(groupId, currentUserId);

    setHasPostedBefore(postedBefore);
    setHasMore(topLevel.hasMore);

    if (append) {
      setThreads((prev) => [...prev, ...nextThreads]);
    } else {
      setThreads(nextThreads);
    }
  };

  useEffect(() => {
    load(1, false);
  }, [groupId]);

  const submitPost = async () => {
    if (!postDraft.trim()) return;
    setBusy(true);
    try {
      await createGroupPost({
        group_id: groupId,
        sender_id: currentUserId,
        body: postDraft,
      });
      setPostDraft("");
      setPage(1);
      await load(1, false);
    } finally {
      setBusy(false);
    }
  };

  const submitReply = async (parentId: string) => {
    if (!replyDraft.trim()) return;
    setBusy(true);
    try {
      await createGroupReply({
        group_id: groupId,
        sender_id: currentUserId,
        parent_message_id: parentId,
        body: replyDraft,
      });
      setReplyDraft("");
      setReplyingToId(null);
      await load(1, false);
    } finally {
      setBusy(false);
    }
  };

  const postPlaceholder = getGroupComposerPlaceholder({
    isReply: false,
    hasPostedBefore,
    groupName,
  });

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <section
        style={{
          border: "1px solid #ead5df",
          borderRadius: 18,
          padding: 16,
          background: "#fff",
        }}
      >
        <textarea
          value={postDraft}
          onChange={(e) => setPostDraft(e.target.value)}
          placeholder={postPlaceholder}
          style={{
            width: "100%",
            minHeight: 120,
            padding: "16px",
            borderRadius: 16,
            border: "1px solid #d7a8bf",
            fontSize: 16,
          }}
        />
        <div style={{ marginTop: 10 }}>
          <button className="button" onClick={submitPost} disabled={busy}>
            Post
          </button>
        </div>
      </section>

      {threads.map((post) => (
        <section
          key={post.id}
          style={{
            border: "1px solid #ead5df",
            borderRadius: 18,
            padding: 16,
            background: "#fff",
          }}
        >
          <div style={{ whiteSpace: "pre-wrap" }}>{post.body}</div>
          <div style={{ marginTop: 8, fontSize: 12, opacity: 0.65 }}>
            {new Date(post.created_at).toLocaleString()}
          </div>

          <div style={{ marginTop: 12 }}>
            <button
              className="button secondary"
              onClick={() => {
                setReplyingToId(replyingToId === post.id ? null : post.id);
                setReplyDraft("");
              }}
            >
              Reply
            </button>
          </div>

          {replyingToId === post.id ? (
            <div
              style={{
                marginTop: 14,
                marginLeft: 18,
                paddingLeft: 14,
                borderLeft: "3px solid #efc5d7",
              }}
            >
              <textarea
                value={replyDraft}
                onChange={(e) => setReplyDraft(e.target.value)}
                placeholder="Reply here"
                style={{
                  width: "100%",
                  minHeight: 110,
                  padding: "16px",
                  borderRadius: 16,
                  border: "1px solid #d7a8bf",
                  fontSize: 16,
                }}
              />
              <div style={{ marginTop: 10, display: "flex", gap: 8 }}>
                <button
                  className="button"
                  onClick={() => submitReply(post.id)}
                  disabled={busy}
                >
                  Send reply
                </button>
                <button
                  className="button secondary"
                  onClick={() => {
                    setReplyingToId(null);
                    setReplyDraft("");
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : null}

          {post.replies.length ? (
            <div
              style={{
                marginTop: 16,
                marginLeft: 18,
                paddingLeft: 14,
                borderLeft: "3px solid #f3d7e3",
                display: "grid",
                gap: 12,
              }}
            >
              {post.replies.map((reply) => (
                <div
                  key={reply.id}
                  style={{
                    padding: 12,
                    borderRadius: 14,
                    background: "#fff8fb",
                    border: "1px solid #f1dfe8",
                  }}
                >
                  <div style={{ whiteSpace: "pre-wrap" }}>{reply.body}</div>
                  <div style={{ marginTop: 6, fontSize: 12, opacity: 0.65 }}>
                    {new Date(reply.created_at).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          ) : null}
        </section>
      ))}

      {hasMore ? (
        <div>
          <button
            className="button secondary"
            onClick={async () => {
              const nextPage = page + 1;
              setPage(nextPage);
              await load(nextPage, true);
            }}
          >
            Load more posts
          </button>
        </div>
      ) : null}
    </div>
  );
}

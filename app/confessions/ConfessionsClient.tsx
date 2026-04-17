"use client";


import Link from "next/link";
import { useEffect, useState } from "react";
import { ClientShell } from "../../components/ClientShell";
import { getCurrentUser } from "../../lib/auth";
import { createConfession, listConfessions } from "../../lib/roadmap";

export default function ConfessionsPage() {
  const [me, setMe] = useState("");
  const [authResolved, setAuthResolved] = useState(false);
  const [body, setBody] = useState("");
  const [posts, setPosts] = useState<any[]>([]);
  const [status, setStatus] = useState("");

  const refresh = async () => setPosts(await listConfessions(100).catch(() => []));

  useEffect(() => {
    getCurrentUser().then(async (user) => {
      setMe(user?.id || "");
      setAuthResolved(true);
      if (user?.id) {
        await refresh();
      } else {
        setPosts([]);
      }
    });
  }, []);

  const submit = async () => {
    if (!me || !body.trim()) return;
    try {
      await createConfession(me, body);
      setBody("");
      setStatus("Anonymous post shared.");
      await refresh();
    } catch (e: any) {
      setStatus(e.message || "Unable to post anonymously.");
    }
  };

  return (
    <ClientShell>
      <section className="hero">
        <h1 style={{ margin: 0, fontSize: 30 }}>Anonymous Confessional</h1>
        <p style={{ fontSize: 16, lineHeight: 1.6, opacity: 0.9 }}>
          Share what’s on your mind. Posts and replies are anonymous to members.
        </p>
      </section>

      {!authResolved ? null : !me ? (
        <div className="grid">
          <section style={{ border: "1px solid #e9d7e2", borderRadius: 20, padding: 16, background: "#fff" }}>
            <h3 style={{ marginTop: 0 }}>Log in to continue</h3>
            <p style={{ marginTop: 0, opacity: 0.85, lineHeight: 1.6 }}>
              Log in to read and post in the Anonymous Confessional.
            </p>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <Link className="button" href="/login">Log in</Link>
              <Link className="button secondary" href="/signup">Sign up</Link>
            </div>
          </section>
        </div>
      ) : (
        <div className="grid">
          <section style={{ border: "1px solid #e9d7e2", borderRadius: 20, padding: 16, background: "#fff" }}>
            <h3 style={{ marginTop: 0 }}>Share anonymously</h3>
            <textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="Share something anonymously..." style={{ width: "100%", minHeight: 120, padding: "14px 16px", borderRadius: 16, border: "1px solid #d7a8bf", fontSize: 16 }} />
            <div style={{ marginTop: 12 }}>
              <button className="button" onClick={submit}>Post anonymously</button>
            </div>
          </section>

          <section style={{ border: "1px solid #e9d7e2", borderRadius: 20, padding: 16, background: "#fff" }}>
            <h3 style={{ marginTop: 0 }}>Recent posts</h3>
            {posts.length ? posts.map((post) => (
              <div key={post.id} style={{ borderBottom: "1px solid #f1dfe8", padding: "12px 0" }}>
                <div style={{ fontSize: 12, opacity: 0.65 }}>Anonymous</div>
                <div style={{ whiteSpace: "pre-wrap", marginTop: 4 }}>{post.body}</div>
                <div style={{ marginTop: 8, display: "flex", gap: 12, flexWrap: "wrap", opacity: 0.8, fontSize: 13 }}>
                  <span>{post.reply_count} replies</span>
                  <span>{post.reaction_count} reactions</span>
                  {post.is_locked ? <span>Replies locked</span> : null}
                </div>
                <div style={{ marginTop: 8 }}>
                  <Link className="button secondary" href={`/confessions/${post.id}`}>Open thread</Link>
                </div>
              </div>
            )) : <p style={{ margin: 0, opacity: 0.8 }}>No confessions yet. Be the first to share something anonymously.</p>}
          </section>

          {status ? <p style={{ margin: 0, opacity: 0.8 }}>{status}</p> : null}
        </div>
      )}
    </ClientShell>
  );
}

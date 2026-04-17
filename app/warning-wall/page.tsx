"use client";

import { useEffect, useState } from "react";
import { ClientShell } from "../../components/ClientShell";
import { getCurrentUser } from "../../lib/auth";
import { uploadPublicImage } from "../../lib/db";
import { createWarningWallPost, listWarningWallPosts } from "../../lib/warningWall";

export default function WarningWallPage() {
  const [me, setMe] = useState("");
  const [body, setBody] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [status, setStatus] = useState("");

  const refresh = async () => {
    try {
      const rows = await listWarningWallPosts();
      setPosts(rows);
      setStatus("");
    } catch (e: any) {
      setPosts([]);
      setStatus(String(e?.message || "").includes("warning_wall_posts") ? "Warning Wall database table is not set up yet." : (e.message || "Unable to load Warning Wall."));
    }
  };

  useEffect(() => {
    getCurrentUser().then(async (user) => {
      if (!user) return;
      setMe(user.id);
      await refresh();
    });
  }, []);

  const submit = async () => {
    if (!me || !body.trim()) return;
    try {
      let photoUrl: string | null = null;
      if (photo) photoUrl = await uploadPublicImage("warning-wall-photos", me, photo);
      await createWarningWallPost({ createdBy: me, body, photoUrl });
      setBody("");
      setPhoto(null);
      setStatus("Warning posted anonymously.");
      await refresh();
    } catch (e: any) {
      setStatus(e.message || "Unable to post warning.");
    }
  };

  return (
    <ClientShell>
      <section className="hero">
        <h1 style={{ margin: 0, fontSize: 30 }}>The Warning Wall</h1>
        <p style={{ fontSize: 16, lineHeight: 1.6, opacity: 0.9 }}>
          Anonymous safety warnings for the community. Keep it factual, safety-focused, and free of addresses, legal names, or anything more identifying than necessary for safety.
        </p>
      </section>
      <div className="grid">
        <section style={{ border: "1px solid #e9d7e2", borderRadius: 20, padding: 16, background: "#fff" }}>
          <h3 style={{ marginTop: 0 }}>Post anonymously</h3>
          <textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="Example: Y'all steer clear of Marla from Prairieville. She has short bleached blonde hair, mid 50s. Likes fishing and getting violent with her partner." style={{ width: "100%", minHeight: 140, padding: "14px 16px", borderRadius: 16, border: "1px solid #d7a8bf", fontSize: 16 }} />
          <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
            <input type="file" accept="image/*" onChange={(e) => setPhoto(e.target.files?.[0] || null)} />
            <button className="button" onClick={submit}>Post to Warning Wall</button>
          </div>
        </section>
        <section style={{ border: "1px solid #e9d7e2", borderRadius: 20, padding: 16, background: "#fff" }}>
          <h3 style={{ marginTop: 0 }}>Recent warnings</h3>
          {posts.length ? posts.map((post) => (
            <div key={post.id} style={{ borderBottom: "1px solid #f1dfe8", padding: "12px 0" }}>
              {post.photo_url ? <img src={post.photo_url} alt="Warning wall upload" style={{ width: "100%", maxWidth: 320, borderRadius: 16, border: "1px solid #ead5df", marginBottom: 10 }} /> : null}
              <div style={{ whiteSpace: "pre-wrap", lineHeight: 1.6 }}>{post.body}</div>
              <div style={{ fontSize: 12, opacity: 0.65, marginTop: 8 }}>{new Date(post.created_at).toLocaleString()}</div>
            </div>
          )) : <p style={{ margin: 0, opacity: 0.75 }}>No warnings posted yet.</p>}
          {status ? <p style={{ marginTop: 12, opacity: 0.8 }}>{status}</p> : null}
        </section>
      </div>
    </ClientShell>
  );
}

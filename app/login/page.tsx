"use client";

import { useState } from "react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setLoading(true);
    setStatus("");
    try {
      const res = await fetch("/api/auth/magic-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Unable to send magic link");
      setStatus("Magic link sent. Check your email and open the link on this device/browser.");
    } catch (e: any) {
      setStatus(e.message || "Unable to send magic link");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="hero">
      <h1 style={{ margin: 0, fontSize: 30 }}>Sign in</h1>
      <p style={{ fontSize: 16, lineHeight: 1.6, opacity: 0.9 }}>
        This MVP uses Supabase magic links. Once signed in, you can create a profile, send friend requests, DM friends, and join groups.
      </p>

      <div style={{ display: "grid", gap: 12, marginTop: 18 }}>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          style={{
            padding: "14px 16px",
            borderRadius: 16,
            border: "1px solid #d7a8bf",
            fontSize: 16,
            width: "100%",
          }}
        />
        <button className="button" onClick={submit} disabled={loading || !email}>
          {loading ? "Sending..." : "Send magic link"}
        </button>
        {status ? <p style={{ margin: 0, opacity: 0.8 }}>{status}</p> : null}
      </div>
    </section>
  );
}

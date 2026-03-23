"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [seenOnboarding, setSeenOnboarding] = useState(true);

  useEffect(() => {
    setSeenOnboarding(localStorage.getItem("lbgf_onboarding_seen") === "1");
  }, []);

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
      setStatus("Magic link sent. Check your email and open the newest link from this device/browser.");
    } catch (e: any) {
      setStatus(e.message || "Unable to send magic link");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="hero">
      <div className="login-card">
        <div className="pill">Private beta access</div>
        <h1 style={{ margin: 0, fontSize: 34, lineHeight: 1.05 }}>Let’s get you inside</h1>
        <p style={{ fontSize: 16, lineHeight: 1.7, opacity: 0.9 }}>
          Use your email magic link to enter the beta. Once you’re in, you can create your profile, make friends, and join groups.
        </p>

        {!seenOnboarding ? (
          <div style={{ marginTop: 12, padding: 12, borderRadius: 16, border: "1px solid #efcad8", background: "#fff" }}>
            <strong>New here?</strong>
            <p style={{ margin: "8px 0 0", opacity: 0.8 }}>Take the onboarding tour first so the app feels easier and more exciting.</p>
            <div style={{ marginTop: 10 }}>
              <Link href="/onboarding" className="button secondary">Start onboarding</Link>
            </div>
          </div>
        ) : null}

        <div style={{ display: "grid", gap: 12, marginTop: 12 }}>
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

        <div style={{ marginTop: 16 }}>
          <Link href="/onboarding" style={{ fontWeight: 700, opacity: 0.8 }}>New here? Take the onboarding tour first.</Link>
        </div>
      </div>
    </section>
  );
}

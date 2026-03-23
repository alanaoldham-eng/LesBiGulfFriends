"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "../../lib/supabase/client";
import { AuthButtons } from "../../components/AuthButtons";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [seenOnboarding, setSeenOnboarding] = useState(true);

  useEffect(() => {
    setSeenOnboarding(localStorage.getItem("lbgf_onboarding_seen") === "1");
  }, []);

  const submitPassword = async () => {
    setLoading(true);
    setStatus("");
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      document.cookie = "lbgf_session=1; Path=/; SameSite=Lax";
      window.location.href = "/auth/callback";
    } catch (e: any) {
      setStatus(e.message || "Unable to sign in.");
    } finally {
      setLoading(false);
    }
  };

  const sendMagicLink = async () => {
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
      setStatus("Magic link sent. Use this only as a backup if you forgot your password.");
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
        <h1 style={{ margin: 0, fontSize: 34, lineHeight: 1.05 }}>Sign in</h1>
        <p style={{ fontSize: 16, lineHeight: 1.7, opacity: 0.9 }}>
          Come back with your email and password, or use a social sign-in. Magic links stay available as a fallback.
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
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com"
            style={{ padding: "14px 16px", borderRadius: 16, border: "1px solid #d7a8bf", fontSize: 16, width: "100%" }} />
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Your password"
            style={{ padding: "14px 16px", borderRadius: 16, border: "1px solid #d7a8bf", fontSize: 16, width: "100%" }} />
          <button className="button" onClick={submitPassword} disabled={loading || !email || !password}>
            {loading ? "Signing in..." : "Sign in"}
          </button>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
            <Link href="/signup" style={{ fontWeight: 700, opacity: 0.8 }}>Create account</Link>
            <Link href="/forgot-password" style={{ fontWeight: 700, opacity: 0.8 }}>Forgot password?</Link>
          </div>
          <button className="button secondary" onClick={sendMagicLink} disabled={loading || !email}>
            Use magic link instead
          </button>
          {status ? <p style={{ margin: 0, opacity: 0.8 }}>{status}</p> : null}
        </div>

        <div style={{ marginTop: 18, opacity: 0.7, fontWeight: 700 }}>or continue with</div>
        <AuthButtons />
      </div>
    </section>
  );
}

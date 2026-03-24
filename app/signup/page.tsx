"use client";

import { useState } from "react";
import Link from "next/link";
import { supabase } from "../../lib/supabase/client";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!email || !password) return setStatus("Email and password are required.");
    if (password !== confirmPassword) return setStatus("Passwords do not match.");

    setLoading(true);
    setStatus("");
    try {
      const redirectTo = `${window.location.origin}/login?verified=1`;
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: redirectTo },
      });
      if (error) throw error;
      setStatus("Account created. Check your email once to verify your address, then come back and log in with your password.");
    } catch (e: any) {
      setStatus(e.message || "Unable to create account.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="hero">
      <div className="login-card">
        <div className="pill">Create your account</div>
        <h1 style={{ margin: 0, fontSize: 34, lineHeight: 1.05 }}>Join the beta</h1>
        <p style={{ fontSize: 16, lineHeight: 1.7, opacity: 0.9 }}>
          Create your account with email and password. After you verify your email once, you can return with your password.
        </p>
        <div style={{ display: "grid", gap: 12, marginTop: 12 }}>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            style={{ padding: "14px 16px", borderRadius: 16, border: "1px solid #d7a8bf", fontSize: 16, width: "100%" }}
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Create a password"
            style={{ padding: "14px 16px", borderRadius: 16, border: "1px solid #d7a8bf", fontSize: 16, width: "100%" }}
          />
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirm password"
            style={{ padding: "14px 16px", borderRadius: 16, border: "1px solid #d7a8bf", fontSize: 16, width: "100%" }}
          />
          <button className="button" onClick={submit} disabled={loading || !email || !password || !confirmPassword}>
            {loading ? "Creating..." : "Create account"}
          </button>
          {status ? <p style={{ margin: 0, opacity: 0.8 }}>{status}</p> : null}
        </div>
        <div style={{ marginTop: 16 }}>
          <Link href="/login" style={{ fontWeight: 700, opacity: 0.8 }}>Already have an account? Log in.</Link>
        </div>
      </div>
    </section>
  );
}

"use client";

import { useState } from "react";
import { supabase } from "../../lib/supabase/client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setLoading(true);
    setStatus("");
    try {
      const redirectTo = `${window.location.origin}/auth/callback`;
      const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
      if (error) throw error;
      setStatus("Password reset email sent. Use the newest email we sent you.");
    } catch (e: any) {
      setStatus(e.message || "Unable to send reset email.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="hero">
      <div className="login-card">
        <div className="pill">Reset password</div>
        <h1 style={{ margin: 0, fontSize: 34, lineHeight: 1.05 }}>Forgot your password?</h1>
        <p style={{ fontSize: 16, lineHeight: 1.7, opacity: 0.9 }}>
          Enter your email and we’ll send you a password reset link.
        </p>
        <div style={{ display: "grid", gap: 12, marginTop: 12 }}>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com"
            style={{ padding: "14px 16px", borderRadius: 16, border: "1px solid #d7a8bf", fontSize: 16, width: "100%" }} />
          <button className="button" onClick={submit} disabled={loading || !email}>
            {loading ? "Sending..." : "Send reset email"}
          </button>
          {status ? <p style={{ margin: 0, opacity: 0.8 }}>{status}</p> : null}
        </div>
      </div>
    </section>
  );
}

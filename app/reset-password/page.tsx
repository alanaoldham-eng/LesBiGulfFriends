"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase/client";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const hash = window.location.hash;
    if (!hash.includes("access_token")) return;

    const params = new URLSearchParams(hash.replace(/^#/, ""));
    const accessToken = params.get("access_token");
    const refreshToken = params.get("refresh_token");

    if (accessToken && refreshToken) {
      supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });
    }
  }, []);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      setStatus("Passwords do not match.");
      return;
    }

    setBusy(true);
    setStatus("");

    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;

      setStatus("Password updated. Redirecting to login...");
      setTimeout(() => router.push("/login"), 1200);
    } catch (e: any) {
      setStatus(e?.message || "Unable to reset password.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="hero">
      <div className="login-card">
        <div className="pill">Reset password</div>
        <h1 style={{ margin: 0, fontSize: 34, lineHeight: 1.05 }}>
          Set a new password
        </h1>
        <div style={{ display: "grid", gap: 12, marginTop: 12 }}>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="New password"
            style={{
              padding: "14px 16px",
              borderRadius: 16,
              border: "1px solid #d7a8bf",
              fontSize: 16,
              width: "100%",
            }}
          />
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirm new password"
            style={{
              padding: "14px 16px",
              borderRadius: 16,
              border: "1px solid #d7a8bf",
              fontSize: 16,
              width: "100%",
            }}
          />
          <button className="button" onClick={onSubmit} disabled={busy || !password || !confirmPassword}>
            {busy ? "Saving..." : "Set new password"}
          </button>
          {status ? <p style={{ margin: 0, opacity: 0.8 }}>{status}</p> : null}
        </div>
      </div>
    </section>
  );
}

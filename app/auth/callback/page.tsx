"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase/client";

export default function AuthCallbackPage() {
  const [message, setMessage] = useState("Signing you in...");

  useEffect(() => {
    const run = async () => {
      const url = new URL(window.location.href);

      // 1) PKCE/code flow
      const code = url.searchParams.get("code");
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
          setMessage(error.message);
          return;
        }

        document.cookie = "lbgf_session=1; Path=/; SameSite=Lax";
        const hasProfile = localStorage.getItem("lbgf_profile_started") === "1";
        window.location.href = hasProfile ? "/app" : "/profile";
        return;
      }

      // 2) Hash token flow
      const hash = window.location.hash.startsWith("#")
        ? window.location.hash.slice(1)
        : "";
      const hashParams = new URLSearchParams(hash);
      const access_token = hashParams.get("access_token");
      const refresh_token = hashParams.get("refresh_token");

      if (access_token && refresh_token) {
        const { error } = await supabase.auth.setSession({
          access_token,
          refresh_token,
        });

        if (error) {
          setMessage(error.message);
          return;
        }

        document.cookie = "lbgf_session=1; Path=/; SameSite=Lax";
        const hasProfile = localStorage.getItem("lbgf_profile_started") === "1";
        window.location.href = hasProfile ? "/app" : "/profile";
        return;
      }

      setMessage("Missing auth code or tokens. Please try the magic link again.");
    };

    run();
  }, []);

  return (
    <section className="hero">
      <h1 style={{ margin: 0, fontSize: 28 }}>Auth callback</h1>
      <p style={{ fontSize: 16, lineHeight: 1.7 }}>{message}</p>
    </section>
  );
}
"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase/client";

export default function AuthCallbackPage() {
  const [message, setMessage] = useState("Signing you in...");

  useEffect(() => {
    const run = async () => {
      const url = new URL(window.location.href);
      const code = url.searchParams.get("code");

      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
          setMessage(error.message);
          return;
        }
        document.cookie = `lbgf_session=1; Path=/; SameSite=Lax`;
        window.location.href = "/app";
        return;
      }

      setMessage("Missing auth code. Please try the magic link again.");
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

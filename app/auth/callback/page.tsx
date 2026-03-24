"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase/client";

export default function AuthCallbackPage() {
  const [message, setMessage] = useState("Finishing sign-in...");

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

        const { data: userData } = await supabase.auth.getUser();
        document.cookie = "lbgf_session=1; Path=/; SameSite=Lax";

        if (userData.user) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("display_name")
            .eq("id", userData.user.id)
            .maybeSingle();

          const hasDisplayName = !!profile?.display_name?.trim();
          localStorage.setItem("lbgf_profile_started", hasDisplayName ? "1" : "0");
          window.location.href = hasDisplayName ? "/app" : "/profile";
          return;
        }
      }

      window.location.href = "/login?verified=1";
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

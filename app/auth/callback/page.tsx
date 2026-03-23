"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase/client";
import { getProfileById } from "../../../lib/db";

export default function AuthCallbackPage() {
  const [message, setMessage] = useState("Signing you in...");

  useEffect(() => {
    const finish = async () => {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData.user) {
        setMessage(userError?.message || "Unable to load user session.");
        return;
      }
      document.cookie = "lbgf_session=1; Path=/; SameSite=Lax";
      const profile = await getProfileById(userData.user.id).catch(() => null);
      const hasDisplayName = !!profile?.display_name?.trim();
      localStorage.setItem("lbgf_profile_started", hasDisplayName ? "1" : "0");
      window.location.href = hasDisplayName ? "/app" : "/profile";
    };

    const run = async () => {
      const url = new URL(window.location.href);
      const code = url.searchParams.get("code");
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) return setMessage(error.message);
        return finish();
      }

      const hash = window.location.hash.startsWith("#") ? window.location.hash.slice(1) : "";
      const hashParams = new URLSearchParams(hash);
      const access_token = hashParams.get("access_token");
      const refresh_token = hashParams.get("refresh_token");
      if (access_token && refresh_token) {
        const { error } = await supabase.auth.setSession({ access_token, refresh_token });
        if (error) return setMessage(error.message);
        return finish();
      }

      const { data } = await supabase.auth.getSession();
      if (data.session) return finish();

      setMessage("Missing auth code or tokens. Please try signing in again.");
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

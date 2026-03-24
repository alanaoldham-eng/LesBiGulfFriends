"use client";

import { supabase } from "./supabase/client";

export async function getCurrentUser() {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  return data.user;
}

export async function signOutEverywhere() {
  await supabase.auth.signOut();
  await fetch("/api/auth/logout", { method: "POST" });
  document.cookie = "lbgf_session=; Path=/; Max-Age=0; SameSite=Lax";
  window.location.href = "/login";
}

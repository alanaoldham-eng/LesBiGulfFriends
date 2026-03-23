"use client";

import { supabase } from "./supabase/client";

export async function requireSession() {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data.session;
}

export async function getCurrentUser() {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  return data.user;
}

export async function signOutEverywhere() {
  await supabase.auth.signOut();
  await fetch("/api/auth/logout", { method: "POST" });
  window.location.href = "/login";
}

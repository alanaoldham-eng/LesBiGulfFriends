"use client";

import { supabase } from "./supabase/client";

export async function listWarningWallPosts(limit = 100) {
  const { data, error } = await supabase
    .from("warning_wall_posts")
    .select("id, body, photo_url, created_at")
    .eq("is_hidden", false)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data || [];
}

export async function createWarningWallPost(args: {
  createdBy: string;
  body: string;
  photoUrl?: string | null;
}) {
  const cleanBody = args.body.trim();
  if (!cleanBody) throw new Error("Please write your warning first.");

  const { data, error } = await supabase
    .from("warning_wall_posts")
    .insert({
      created_by: args.createdBy,
      body: cleanBody,
      photo_url: args.photoUrl || null,
    })
    .select("id")
    .single();

  if (error) throw error;
  return data;
}

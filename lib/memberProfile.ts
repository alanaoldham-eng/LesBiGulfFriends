"use client";

import { supabase } from "./supabase/client";

export async function getPublicMemberProfileFast(userId: string) {
  if (!userId) return null;

  const { data, error } = await supabase
    .from("profiles")
    .select(
      "id, display_name, bio, interests, photo_url, photo_urls, city, relationship_status, karma_points, membership_status, is_banned, is_moderator"
    )
    .eq("id", userId)
    .maybeSingle();

  if (error) throw error;

  if (!data) return null;

  const inactive =
    data.is_banned ||
    ["removed", "banned"].includes(String(data.membership_status || "").toLowerCase());

  return inactive ? null : data;
}

export async function areUsersFriendsFast(me: string, otherUserId: string) {
  if (!me || !otherUserId || me === otherUserId) return false;

  const { data, error } = await supabase
    .from("friends")
    .select("id")
    .or(`and(user_a.eq.${me},user_b.eq.${otherUserId}),and(user_a.eq.${otherUserId},user_b.eq.${me})`)
    .limit(1)
    .maybeSingle();

  if (error) throw error;

  return !!data;
}

export async function listMemberBadgesFast(userId: string, limit = 80) {
  if (!userId) return [];

  const { data, error } = await supabase
    .from("user_badges")
    .select("id, badge_key, badge_label, emoji, election_key, created_at, meta")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;

  return data || [];
}

export async function getMemberDisplayNameFast(userId: string) {
  if (!userId) return "A member";

  const { data, error } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", userId)
    .maybeSingle();

  if (error) throw error;

  return data?.display_name || "A member";
}

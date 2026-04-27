"use client";

import { supabase } from "./supabase/client";

export async function listEventMediaBundle(eventId: string) {
  const { data: media, error } = await supabase
    .from("event_media")
    .select("*")
    .eq("event_id", eventId)
    .neq("moderation_status", "removed")
    .order("created_at", { ascending: false });

  if (error) throw error;
  const rows = media || [];
  if (!rows.length) return [];

  const mediaIds = rows.map((r: any) => r.id);
  const ownerIds = [...new Set(rows.map((r: any) => r.user_id))];

  const [{ data: comments }, { data: reactions }, { data: ownerProfiles }] = await Promise.all([
    supabase.from("event_media_comments").select("*").in("media_id", mediaIds).order("created_at", { ascending: true }),
    supabase.from("event_media_reactions").select("*").in("media_id", mediaIds),
    ownerIds.length
      ? supabase.from("profiles").select("id, display_name, photo_url, photo_urls").in("id", ownerIds)
      : Promise.resolve({ data: [] as any[] }),
  ]);

  const extraProfileIds = [...new Set([
    ...(comments || []).map((c: any) => c.user_id),
    ...(reactions || []).map((r: any) => r.user_id),
  ])].filter((id) => !ownerIds.includes(id));

  let extraProfiles: any[] = [];
  if (extraProfileIds.length) {
    const res = await supabase
      .from("profiles")
      .select("id, display_name, photo_url, photo_urls")
      .in("id", extraProfileIds);
    extraProfiles = res.data || [];
  }

  const profileMap = new Map([...(ownerProfiles || []), ...extraProfiles].map((p: any) => [p.id, p]));
  const commentsByMedia = new Map<string, any[]>();
  const reactionsByMedia = new Map<string, any[]>();

  (comments || []).forEach((c: any) => {
    commentsByMedia.set(c.media_id, [
      ...(commentsByMedia.get(c.media_id) || []),
      { ...c, profile: profileMap.get(c.user_id) || null },
    ]);
  });

  (reactions || []).forEach((r: any) => {
    reactionsByMedia.set(r.media_id, [
      ...(reactionsByMedia.get(r.media_id) || []),
      { ...r, profile: profileMap.get(r.user_id) || null },
    ]);
  });

  return rows.map((row: any) => ({
    ...row,
    profile: profileMap.get(row.user_id) || null,
    comments: commentsByMedia.get(row.id) || [],
    reactions: reactionsByMedia.get(row.id) || [],
  }));
}

export async function addEventMediaComment(eventId: string, mediaId: string, userId: string, body: string) {
  const trimmed = body.trim();
  if (!trimmed) throw new Error("Comment is required.");

  const { error } = await supabase.from("event_media_comments").insert({
    event_id: eventId,
    media_id: mediaId,
    user_id: userId,
    body: trimmed,
  });

  if (error) throw error;
}

export async function toggleEventMediaReaction(eventId: string, mediaId: string, userId: string, emoji: string) {
  const { data: existing, error: readError } = await supabase
    .from("event_media_reactions")
    .select("id")
    .eq("event_id", eventId)
    .eq("media_id", mediaId)
    .eq("user_id", userId)
    .eq("emoji", emoji)
    .maybeSingle();

  if (readError) throw readError;

  if (existing?.id) {
    const { error } = await supabase.from("event_media_reactions").delete().eq("id", existing.id);
    if (error) throw error;
    return;
  }

  const { error } = await supabase.from("event_media_reactions").insert({
    event_id: eventId,
    media_id: mediaId,
    user_id: userId,
    emoji,
  });

  if (error) throw error;
}

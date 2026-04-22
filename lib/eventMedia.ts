"use client";

import { supabase } from "./supabase/client";

export async function listEventMediaBundle(eventId: string) {
  const [{ data: media, error: mediaError }, { data: comments, error: commentsError }, { data: reactions, error: reactionsError }] = await Promise.all([
    supabase.from("event_media").select("*").eq("event_id", eventId).order("created_at", { ascending: false }),
    supabase.from("event_media_comments").select("*").eq("event_id", eventId).order("created_at", { ascending: true }),
    supabase.from("event_media_reactions").select("*").eq("event_id", eventId),
  ]);
  if (mediaError) throw mediaError;
  if (commentsError) throw commentsError;
  if (reactionsError) throw reactionsError;

  const userIds = Array.from(new Set([
    ...(media || []).map((x: any) => x.user_id),
    ...(comments || []).map((x: any) => x.user_id),
    ...(reactions || []).map((x: any) => x.user_id),
  ]));

  let profiles = new Map<string, any>();
  if (userIds.length) {
    const { data: profs, error } = await supabase.from("profiles").select("id, display_name, photo_url, photo_urls").in("id", userIds);
    if (error) throw error;
    profiles = new Map((profs || []).map((p: any) => [p.id, p]));
  }

  const commentsByMedia = new Map<string, any[]>();
  (comments || []).forEach((c: any) => {
    commentsByMedia.set(c.media_id, [...(commentsByMedia.get(c.media_id) || []), { ...c, profile: profiles.get(c.user_id) || null }]);
  });

  const reactionsByMedia = new Map<string, any[]>();
  (reactions || []).forEach((r: any) => {
    reactionsByMedia.set(r.media_id, [...(reactionsByMedia.get(r.media_id) || []), { ...r, profile: profiles.get(r.user_id) || null }]);
  });

  return (media || []).map((m: any) => ({
    ...m,
    profile: profiles.get(m.user_id) || null,
    comments: commentsByMedia.get(m.id) || [],
    reactions: reactionsByMedia.get(m.id) || [],
  }));
}

export async function addEventMediaComment(eventId: string, mediaId: string, userId: string, body: string) {
  const text = String(body || "").trim();
  if (!text) throw new Error("Comment cannot be empty.");
  const { error } = await supabase.from("event_media_comments").insert({
    event_id: eventId,
    media_id: mediaId,
    user_id: userId,
    body: text,
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
    return { toggledOff: true };
  }

  const { error } = await supabase.from("event_media_reactions").insert({
    event_id: eventId,
    media_id: mediaId,
    user_id: userId,
    emoji,
  });
  if (error) throw error;
  return { toggledOff: false };
}

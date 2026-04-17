"use client";

import { supabase } from "./supabase/client";

export async function listGroupMessagesDetailedUnlimited(groupId: string, limit = 5000) {
  const { data: messages, error } = await supabase
    .from("group_messages")
    .select("*")
    .eq("group_id", groupId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;

  const senderIds = [...new Set((messages || []).map((m: any) => m.sender_id))];
  let profileMap = new Map<string, any>();

  if (senderIds.length) {
    const { data: profiles, error: profileError } = await supabase
      .from("profiles")
      .select("id, display_name, photo_url, photo_urls, bio, city, relationship_status")
      .in("id", senderIds);

    if (profileError) throw profileError;
    profileMap = new Map((profiles || []).map((p: any) => [p.id, p]));
  }

  const { data: reactions, error: reactionError } = await supabase
    .from("group_message_reactions")
    .select("*")
    .eq("group_id", groupId);

  if (reactionError) throw reactionError;

  const reactionsByMessage = new Map<string, any[]>();
  (reactions || []).forEach((r: any) => {
    reactionsByMessage.set(r.message_id, [...(reactionsByMessage.get(r.message_id) || []), r]);
  });

  return (messages || []).map((m: any) => ({
    ...m,
    profile: profileMap.get(m.sender_id) || null,
    reactions: reactionsByMessage.get(m.id) || [],
  }));
}

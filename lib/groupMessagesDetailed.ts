"use client";

import { supabase } from "./supabase/client";

export async function listGroupMessagesDetailedUnlimited(groupId: string, limit = 75) {
  const { data: messages, error } = await supabase
    .from("group_messages")
    .select("*")
    .eq("group_id", groupId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;

  const rows = messages || [];
  const messageIds = rows.map((m: any) => m.id);
  const senderIds = [...new Set(rows.map((m: any) => m.sender_id).filter(Boolean))];

  let profileMap = new Map<string, any>();

  if (senderIds.length) {
    const { data: profiles, error: profileError } = await supabase
      .from("profiles")
      .select("id, display_name, photo_url, photo_urls, bio, city, relationship_status, karma_points, membership_status, is_banned")
      .in("id", senderIds);

    if (profileError) throw profileError;

    profileMap = new Map(
      (profiles || [])
        .filter((p: any) => !p.is_banned && !["removed", "banned"].includes(String(p.membership_status || "").toLowerCase()))
        .map((p: any) => [p.id, p])
    );
  }

  let reactions: any[] = [];

  if (messageIds.length) {
    const { data, error: reactionError } = await supabase
      .from("group_message_reactions")
      .select("*")
      .eq("group_id", groupId)
      .in("message_id", messageIds);

    if (reactionError) throw reactionError;
    reactions = data || [];
  }

  const reactionsByMessage = new Map<string, any[]>();

  reactions.forEach((r: any) => {
    reactionsByMessage.set(r.message_id, [...(reactionsByMessage.get(r.message_id) || []), r]);
  });

  return rows
    .filter((m: any) => m.moderation_status !== "removed")
    .map((m: any) => ({
      ...m,
      profile: profileMap.get(m.sender_id) || null,
      reactions: reactionsByMessage.get(m.id) || [],
    }));
}

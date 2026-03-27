"use client";

import { supabase } from "./supabase/client";

export async function getFeaturedContentSources() {
  const { data, error } = await supabase
    .from("content_sources")
    .select("*")
    .eq("is_active", true)
    .eq("is_featured", true)
    .order("featured_rank", { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function getContentSourceBySlug(slug: string) {
  const { data, error } = await supabase
    .from("content_sources")
    .select("*")
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function getContentItemsBySource(sourceId: string) {
  const { data, error } = await supabase
    .from("content_items")
    .select("*")
    .eq("source_id", sourceId)
    .eq("is_published", true)
    .eq("is_hidden", false)
    .order("published_at", { ascending: false })
    .limit(100);
  if (error) throw error;
  return data || [];
}

export async function getLatestContentItems(limit = 10) {
  const { data, error } = await supabase
    .from("content_items")
    .select("*, content_sources(title, slug)")
    .eq("is_published", true)
    .eq("is_hidden", false)
    .order("published_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data || [];
}

export async function getMySavedContent(userId: string) {
  const { data, error } = await supabase
    .from("user_saved_content")
    .select("content_item_id, content_items(*)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function saveContentItem(userId: string, contentItemId: string) {
  const { error } = await supabase.from("user_saved_content").upsert({ user_id: userId, content_item_id: contentItemId });
  if (error) throw error;
}

export async function unsaveContentItem(userId: string, contentItemId: string) {
  const { error } = await supabase.from("user_saved_content").delete().eq("user_id", userId).eq("content_item_id", contentItemId);
  if (error) throw error;
}

export async function listConfessions(limit = 100) {
  const { data, error } = await supabase
    .from("anonymous_posts")
    .select("id, body, created_at, reply_count, reaction_count, is_locked")
    .eq("is_hidden", false)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data || [];
}

export async function getConfession(postId: string) {
  const { data, error } = await supabase
    .from("anonymous_posts")
    .select("id, body, created_at, reply_count, reaction_count, is_locked")
    .eq("id", postId)
    .eq("is_hidden", false)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function createConfession(created_by: string, body: string) {
  const { data, error } = await supabase
    .from("anonymous_posts")
    .insert({ created_by, body: body.trim() })
    .select("id")
    .single();
  if (error) throw error;
  return data;
}

export async function listConfessionReplies(postId: string) {
  const { data, error } = await supabase
    .from("anonymous_replies")
    .select("id, post_id, body, created_at")
    .eq("post_id", postId)
    .eq("is_hidden", false)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function createConfessionReply(created_by: string, post_id: string, body: string) {
  const { data, error } = await supabase
    .from("anonymous_replies")
    .insert({ created_by, post_id, body: body.trim() })
    .select("id")
    .single();
  if (error) throw error;
  return data;
}

export async function reactToAnonymousPost(created_by: string, post_id: string, reaction_type: string) {
  await supabase.from("anonymous_reactions").delete().eq("created_by", created_by).eq("post_id", post_id);
  const { error } = await supabase.from("anonymous_reactions").insert({ created_by, post_id, reaction_type });
  if (error) throw error;
}

export async function reactToAnonymousReply(created_by: string, reply_id: string, reaction_type: string) {
  await supabase.from("anonymous_reactions").delete().eq("created_by", created_by).eq("reply_id", reply_id);
  const { error } = await supabase.from("anonymous_reactions").insert({ created_by, reply_id, reaction_type });
  if (error) throw error;
}

export async function getAnonymousReactionSummary(args: { postId?: string; replyId?: string }) {
  let q = supabase.from("anonymous_reactions").select("reaction_type");
  if (args.postId) q = q.eq("post_id", args.postId);
  if (args.replyId) q = q.eq("reply_id", args.replyId);
  const { data, error } = await q;
  if (error) throw error;
  const summary: Record<string, number> = { heart: 0, hug: 0, same: 0, support: 0 };
  (data || []).forEach((row: any) => {
    summary[row.reaction_type] = (summary[row.reaction_type] || 0) + 1;
  });
  return summary;
}

export async function reportAnonymousPost(reported_by: string, post_id: string, reason: string) {
  const { error } = await supabase.from("anonymous_reports").insert({ reported_by, post_id, reason: reason.trim() });
  if (error) throw error;
}

export async function reportAnonymousReply(reported_by: string, reply_id: string, reason: string) {
  const { error } = await supabase.from("anonymous_reports").insert({ reported_by, reply_id, reason: reason.trim() });
  if (error) throw error;
}

export async function getMyBlindQueueEntry(userId: string) {
  const { data, error } = await supabase
    .from("blind_chat_queue")
    .select("*")
    .eq("user_id", userId)
    .in("status", ["waiting", "matched"])
    .order("created_at", { ascending: false })
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function joinBlindChatQueue(userId: string) {
  const { data, error } = await supabase
    .from("blind_chat_queue")
    .upsert({ user_id: userId, status: "waiting" }, { onConflict: "user_id,status" as any })
    .select("*")
    .maybeSingle();
  if (error && !String(error.message || "").includes("there is no unique or exclusion constraint")) throw error;
  return data;
}

const ALIASES = ["NightOwl", "SoftThunder", "BlueComet", "GoldenFern", "QuietFlame", "NeonMoon", "OceanSpark", "SilverEcho"];
function randomAlias() {
  return ALIASES[Math.floor(Math.random() * ALIASES.length)];
}

export async function tryMatchBlindChat(userId: string) {
  const { data: waiting, error } = await supabase
    .from("blind_chat_queue")
    .select("*")
    .eq("status", "waiting")
    .order("created_at", { ascending: true })
    .limit(10);
  if (error) throw error;
  const mine = (waiting || []).find((row: any) => row.user_id === userId);
  const partner = (waiting || []).find((row: any) => row.user_id !== userId);
  if (!mine || !partner) return null;
  const { data: blockRows } = await supabase
    .from("blind_chat_blocks")
    .select("*")
    .or(`and(user_id.eq.${userId},blocked_user_id.eq.${partner.user_id}),and(user_id.eq.${partner.user_id},blocked_user_id.eq.${userId})`);
  if ((blockRows || []).length) return null;

  const { data: session, error: se } = await supabase.from("blind_chat_sessions").insert({ status: "active" }).select("*").single();
  if (se) throw se;
  let aliasA = randomAlias();
  let aliasB = randomAlias();
  while (aliasA === aliasB) aliasB = randomAlias();
  const { error: pe } = await supabase.from("blind_chat_participants").insert([
    { session_id: session.id, user_id: userId, alias: aliasA },
    { session_id: session.id, user_id: partner.user_id, alias: aliasB },
  ]);
  if (pe) throw pe;
  await supabase.from("blind_chat_queue").update({ status: "matched", matched_at: new Date().toISOString() }).in("id", [mine.id, partner.id]);
  return session;
}

export async function listMyBlindSessions(userId: string) {
  const { data, error } = await supabase
    .from("blind_chat_participants")
    .select("session_id, blind_chat_sessions(*)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function getBlindSession(sessionId: string) {
  const { data, error } = await supabase.from("blind_chat_sessions").select("*").eq("id", sessionId).maybeSingle();
  if (error) throw error;
  return data;
}

export async function getBlindParticipants(sessionId: string) {
  const { data, error } = await supabase
    .from("blind_chat_participants")
    .select("id, session_id, user_id, alias, reveal_requested, reveal_accepted, left_at, created_at")
    .eq("session_id", sessionId);
  if (error) throw error;
  return data || [];
}

export async function listBlindMessages(sessionId: string) {
  const { data, error } = await supabase
    .from("blind_chat_messages")
    .select("id, session_id, sender_id, body, created_at")
    .eq("session_id", sessionId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function sendBlindMessage(session_id: string, sender_id: string, body: string) {
  const { error } = await supabase.from("blind_chat_messages").insert({ session_id, sender_id, body: body.trim() });
  if (error) throw error;
}

export async function requestBlindReveal(sessionId: string, userId: string, accepted = false) {
  const { error } = await supabase
    .from("blind_chat_participants")
    .update({ reveal_requested: true, reveal_accepted: accepted })
    .eq("session_id", sessionId)
    .eq("user_id", userId);
  if (error) throw error;
  const { data } = await supabase.from("blind_chat_participants").select("*").eq("session_id", sessionId);
  const allAccepted = (data || []).length === 2 && (data || []).every((row: any) => row.reveal_requested && row.reveal_accepted);
  if (allAccepted) {
    await supabase.from("blind_chat_sessions").update({ status: "revealed", revealed_at: new Date().toISOString() }).eq("id", sessionId);
  }
}

export async function declineBlindReveal(sessionId: string, userId: string) {
  const { error } = await supabase
    .from("blind_chat_participants")
    .update({ reveal_requested: false, reveal_accepted: false })
    .eq("session_id", sessionId)
    .eq("user_id", userId);
  if (error) throw error;
}

export async function leaveBlindSession(sessionId: string, userId: string) {
  const { error } = await supabase
    .from("blind_chat_participants")
    .update({ left_at: new Date().toISOString() })
    .eq("session_id", sessionId)
    .eq("user_id", userId);
  if (error) throw error;
  const { data } = await supabase.from("blind_chat_participants").select("left_at").eq("session_id", sessionId);
  const allLeft = (data || []).length > 0 && (data || []).every((row: any) => !!row.left_at);
  if (allLeft) await supabase.from("blind_chat_sessions").update({ status: "ended", ended_at: new Date().toISOString() }).eq("id", sessionId);
}

export async function reportBlindSession(sessionId: string, userId: string, reason: string) {
  const { data: participants } = await supabase.from("blind_chat_participants").select("user_id").eq("session_id", sessionId);
  const other = (participants || []).find((row: any) => row.user_id !== userId);
  const { error } = await supabase.from("blind_chat_reports").insert({ session_id: sessionId, reported_by: userId, reported_user_id: other?.user_id || null, reason: reason.trim() });
  if (error) throw error;
  await supabase.from("blind_chat_sessions").update({ status: "reported" }).eq("id", sessionId);
}

export async function blockBlindUser(userId: string, blockedUserId: string) {
  const { error } = await supabase.from("blind_chat_blocks").insert({ user_id: userId, blocked_user_id: blockedUserId });
  if (error) throw error;
}

export async function listGamesHub() {
  const { data, error } = await supabase
    .from("game_definitions")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function listGameInstancesBySlug(slug: string) {
  const { data: def, error: de } = await supabase.from("game_definitions").select("id, slug, name, game_type").eq("slug", slug).maybeSingle();
  if (de) throw de;
  if (!def) return { definition: null, instances: [] };
  const { data, error } = await supabase
    .from("game_instances")
    .select("*")
    .eq("game_definition_id", def.id)
    .eq("is_active", true)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return { definition: def, instances: data || [] };
}

export async function listGameParticipation(game_instance_id: string, anonymous = false) {
  const selectCols = anonymous
    ? "id, game_instance_id, choice_key, response_text, is_anonymous, created_at"
    : "id, game_instance_id, user_id, choice_key, response_text, is_anonymous, created_at";
  const { data, error } = await supabase
    .from("game_participation")
    .select(selectCols)
    .eq("game_instance_id", game_instance_id)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function getMyGameParticipation(game_instance_id: string, user_id: string) {
  const { data, error } = await supabase
    .from("game_participation")
    .select("*")
    .eq("game_instance_id", game_instance_id)
    .eq("user_id", user_id)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function upsertGameParticipation(payload: {
  game_instance_id: string;
  user_id: string;
  choice_key?: string | null;
  response_text?: string | null;
  is_anonymous?: boolean;
}) {
  const { error } = await supabase.from("game_participation").upsert({
    game_instance_id: payload.game_instance_id,
    user_id: payload.user_id,
    choice_key: payload.choice_key || null,
    response_text: payload.response_text || null,
    is_anonymous: payload.is_anonymous ?? false,
    updated_at: new Date().toISOString(),
  });
  if (error) throw error;
}

export async function reactToGameParticipation(user_id: string, participation_id: string, reaction_type: string) {
  const { error } = await supabase.from("game_reactions").insert({ user_id, participation_id, reaction_type });
  if (error) throw error;
}

export async function reportGameParticipation(reported_by: string, participation_id: string, reason: string) {
  const { error } = await supabase.from("game_reports").insert({ reported_by, participation_id, reason: reason.trim() });
  if (error) throw error;
}

export async function getGameReactionSummary(participation_id: string) {
  const { data, error } = await supabase.from("game_reactions").select("reaction_type").eq("participation_id", participation_id);
  if (error) throw error;
  const summary: Record<string, number> = { like: 0, fun: 0, agree: 0, fire: 0 };
  (data || []).forEach((row: any) => {
    summary[row.reaction_type] = (summary[row.reaction_type] || 0) + 1;
  });
  return summary;
}

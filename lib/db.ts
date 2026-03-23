"use client";

import { supabase } from "./supabase/client";

export type Profile = {
  id: string;
  display_name: string;
  bio: string | null;
  interests: string[] | null;
  photo_url: string | null;
  city: string | null;
};

export async function getMyProfile(userId: string) {
  const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).single();
  if (error) throw error;
  return data as Profile;
}

export async function upsertMyProfile(profile: Partial<Profile> & { id: string }) {
  const { error } = await supabase.from("profiles").upsert(profile);
  if (error) throw error;
}

export async function searchProfiles(query: string, me: string) {
  let q = supabase.from("profiles").select("*").neq("id", me).order("display_name");
  if (query.trim()) q = q.ilike("display_name", `%${query.trim()}%`);
  const { data, error } = await q.limit(50);
  if (error) throw error;
  return (data || []) as Profile[];
}

export async function listFriendRequests() {
  const { data, error } = await supabase
    .from("friend_requests")
    .select("id, from_user, to_user, status, created_at")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function sendFriendRequest(from_user: string, to_user: string) {
  const { error } = await supabase.from("friend_requests").insert({ from_user, to_user, status: "pending" });
  if (error) throw error;
}

export async function acceptFriendRequest(requestId: string) {
  const { error } = await supabase.rpc("accept_friend_request", { request_id: requestId });
  if (error) throw error;
}

export async function declineFriendRequest(requestId: string) {
  const { error } = await supabase.from("friend_requests").update({ status: "declined" }).eq("id", requestId);
  if (error) throw error;
}

export async function listFriends(me: string) {
  const { data, error } = await supabase
    .from("friends")
    .select("*")
    .or(`user_a.eq.${me},user_b.eq.${me}`)
    .order("created_at", { ascending: false });
  if (error) throw error;
  const rows = data || [];
  const friendIds = rows.map((r: any) => (r.user_a === me ? r.user_b : r.user_a));
  if (!friendIds.length) return [];
  const { data: profiles, error: pe } = await supabase.from("profiles").select("*").in("id", friendIds);
  if (pe) throw pe;
  return profiles || [];
}

export async function listDmMessages(me: string, other: string) {
  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .or(`and(sender_id.eq.${me},recipient_id.eq.${other}),and(sender_id.eq.${other},recipient_id.eq.${me})`)
    .order("created_at", { ascending: true })
    .limit(200);
  if (error) throw error;
  return data || [];
}

export async function sendDm(sender_id: string, recipient_id: string, body: string) {
  const { error } = await supabase.from("messages").insert({ sender_id, recipient_id, body });
  if (error) throw error;
}

export async function listGroups() {
  const { data, error } = await supabase.from("groups").select("*").order("created_at", { ascending: false }).limit(100);
  if (error) throw error;
  return data || [];
}

export async function joinGroup(group_id: string, user_id: string) {
  const { error } = await supabase.from("group_members").insert({ group_id, user_id, role: "member" });
  if (error) throw error;
}

export async function createGroup(payload: {
  name: string;
  description: string;
  location_tag?: string | null;
  interest_tags?: string[] | null;
  created_by: string;
  is_private?: boolean;
}) {
  const { data, error } = await supabase.from("groups").insert(payload).select("*").single();
  if (error) throw error;
  // auto-join owner
  const { error: e2 } = await supabase.from("group_members").insert({
    group_id: data.id,
    user_id: payload.created_by,
    role: "owner",
  });
  if (e2) throw e2;
  return data;
}

export async function listMyGroups(me: string) {
  const { data, error } = await supabase
    .from("group_members")
    .select("group_id")
    .eq("user_id", me);
  if (error) throw error;
  const ids = (data || []).map((x: any) => x.group_id);
  if (!ids.length) return [];
  const { data: groups, error: ge } = await supabase.from("groups").select("*").in("id", ids).order("created_at", { ascending: false });
  if (ge) throw ge;
  return groups || [];
}

export async function listGroupMessages(group_id: string) {
  const { data, error } = await supabase
    .from("group_messages")
    .select("*")
    .eq("group_id", group_id)
    .order("created_at", { ascending: true })
    .limit(300);
  if (error) throw error;
  return data || [];
}

export async function sendGroupMessage(group_id: string, sender_id: string, body: string) {
  const { error } = await supabase.from("group_messages").insert({ group_id, sender_id, body });
  if (error) throw error;
}

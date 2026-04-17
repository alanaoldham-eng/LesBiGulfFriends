"use client";

import { supabase } from "./supabase/client";

export async function canAccessCommunity(userId: string) {
  const [{ data: profile }, { data: joinedInvite }] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, membership_status, karma_points, display_name, bio, photo_url, photo_urls")
      .eq("id", userId)
      .maybeSingle(),
    supabase
      .from("invites")
      .select("id, status")
      .eq("invitee_user_id", userId)
      .in("status", ["joined", "sent", "pending"])
      .limit(1)
      .maybeSingle(),
  ]);

  const membershipStatus = String(profile?.membership_status || "").toLowerCase();
  const allowedStatuses = new Set(["approved", "active", "member", "accepted", "live"]);
  const invited = Boolean(joinedInvite?.id);
  const approved = allowedStatuses.has(membershipStatus);

  return {
    allowed: approved || invited,
    invited,
    approved,
    profile,
  };
}

export async function ensureCandidateAndRoute(userId: string) {
  const existing = await supabase
    .from("waiting_room_candidates")
    .select("id, status")
    .eq("user_id", userId)
    .maybeSingle();

  if (!existing.error && existing.data?.id) {
    return existing.data;
  }

  const created = await supabase
    .from("waiting_room_candidates")
    .insert({ user_id: userId, status: "waiting" })
    .select("id, status")
    .single();

  if (created.error) throw created.error;
  return created.data;
}

export async function createCommunityGroup(args: {
  name: string;
  description?: string;
  isPrivate?: boolean;
  createdBy: string;
}) {
  const cleanName = args.name.trim();
  if (!cleanName) throw new Error("Group name is required.");

  const { data: group, error: groupError } = await supabase
    .from("groups")
    .insert({
      name: cleanName,
      description: args.description?.trim() || null,
      created_by: args.createdBy,
      is_private: args.isPrivate ?? false,
    })
    .select("*")
    .single();

  if (groupError) throw groupError;

  const { error: membershipError } = await supabase.from("group_members").insert({
    group_id: group.id,
    user_id: args.createdBy,
    role: "owner",
  });

  if (membershipError) throw membershipError;
  return group;
}

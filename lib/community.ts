"use client";

import { supabase } from "./supabase/client";

type CommunityAccessArgs = {
  userId: string;
  email?: string | null;
};

export async function canAccessCommunity(args: CommunityAccessArgs) {
  const email = String(args.email || "").trim().toLowerCase();

  const [
    { data: profile },
    { data: directInvite },
    emailInviteResult,
    candidateResult,
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, membership_status, karma_points, display_name, bio, photo_url, photo_urls")
      .eq("id", args.userId)
      .maybeSingle(),
    supabase
      .from("invites")
      .select("id, status")
      .eq("invitee_user_id", args.userId)
      .in("status", ["joined", "sent", "pending"])
      .limit(1)
      .maybeSingle(),
    email
      ? supabase
          .from("invites")
          .select("id, status, invitee_email")
          .ilike("invitee_email", email)
          .in("status", ["joined", "sent", "pending"])
          .limit(1)
          .maybeSingle()
      : Promise.resolve({ data: null, error: null } as any),
    supabase
      .from("waiting_room_candidates")
      .select("id, status")
      .eq("user_id", args.userId)
      .maybeSingle(),
  ]);

  const membershipStatus = String(profile?.membership_status || "").toLowerCase();
  const allowedStatuses = new Set(["approved", "active", "member", "accepted", "live"]);
  const approvedProfile = allowedStatuses.has(membershipStatus);

  const candidateStatus = String(candidateResult?.data?.status || "").toLowerCase();
  const approvedCandidate = new Set(["approved", "accepted", "live"]).has(candidateStatus);

  const invited = Boolean(directInvite?.id || emailInviteResult?.data?.id);
  const allowed = approvedProfile || approvedCandidate || invited;

  return {
    allowed,
    invited,
    approvedProfile,
    approvedCandidate,
    profile,
    candidate: candidateResult?.data || null,
  };
}

export async function ensureWaitingRoomCandidate(userId: string) {
  const existing = await supabase
    .from("waiting_room_candidates")
    .select("id, status")
    .eq("user_id", userId)
    .maybeSingle();

  if (!existing.error && existing.data?.id) return existing.data;

  const { data, error } = await supabase
    .from("waiting_room_candidates")
    .insert({ user_id: userId, status: "waiting" })
    .select("id, status")
    .single();

  if (error) throw error;
  return data;
}

export async function createCommunityGroup(args: {
  name: string;
  description?: string;
  isPrivate?: boolean;
  createdBy: string;
}) {
  const cleanName = String(args.name || "").trim();
  if (!cleanName) throw new Error("Group name is required.");

  const { data: group, error: groupError } = await supabase
    .from("groups")
    .insert({
      name: cleanName,
      description: String(args.description || "").trim() || null,
      created_by: args.createdBy,
      is_private: Boolean(args.isPrivate),
    })
    .select("*")
    .single();

  if (groupError) throw groupError;

  const { error: memberError } = await supabase.from("group_members").insert({
    group_id: group.id,
    user_id: args.createdBy,
    role: "owner",
  });

  if (memberError) throw memberError;
  return group;
}

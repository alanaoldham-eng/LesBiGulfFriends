"use client";

import { supabase } from "./supabase/client";

export async function canAccessCommunity(_args: { userId: string; email?: string | null }) {
  return {
    allowed: true,
    invited: true,
    approvedProfile: true,
    approvedCandidate: false,
    profile: null,
    candidate: null,
  };
}

export async function ensureWaitingRoomCandidate(_userId: string) {
  return null;
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

"use client";

import { supabase } from "./supabase/client";

export async function setGroupModeratorStatus(args: {
  groupId: string;
  userId: string;
  makeModerator: boolean;
}) {
  const { data, error } = await supabase.rpc("set_group_moderator_status_rpc", {
    _group_id: args.groupId,
    _user_id: args.userId,
    _make_moderator: args.makeModerator,
  });
  if (error) throw error;
  if (!data?.role) throw new Error("Moderator update did not persist.");
  return data;
}

export async function removeMemberFromCommunity(args: {
  groupId: string;
  userId: string;
  removedBy: string;
  reason: string;
}) {
  const reason = String(args.reason || "").trim();
  if (!reason) throw new Error("Removal reason is required.");

  const { data, error } = await supabase.rpc("remove_member_from_group_rpc", {
    _group_id: args.groupId,
    _user_id: args.userId,
    _reason: reason,
  });

  if (error) throw error;
  if (!data?.removed) throw new Error("Member was not removed from the group.");
  return data;
}

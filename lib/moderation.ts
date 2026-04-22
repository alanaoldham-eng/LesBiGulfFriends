"use client";

import { supabase } from "./supabase/client";

export async function setGroupModeratorStatus(args: {
  groupId: string;
  userId: string;
  makeModerator: boolean;
}) {
  const nextRole = args.makeModerator ? "mod" : "member";

  const { data: updated, error } = await supabase
    .from("group_members")
    .update({ role: nextRole })
    .eq("group_id", args.groupId)
    .eq("user_id", args.userId)
    .select("group_id, user_id, role")
    .single();

  if (error) throw error;
  if (!updated || updated.role !== nextRole) {
    throw new Error("Moderator update did not persist.");
  }
  return updated;
}

export async function removeMemberFromCommunity(args: {
  groupId: string;
  userId: string;
  removedBy: string;
  reason: string;
}) {
  const reason = String(args.reason || "").trim();
  if (!reason) throw new Error("Removal reason is required.");

  const { data: deletedRows, error: deleteError } = await supabase
    .from("group_members")
    .delete()
    .eq("group_id", args.groupId)
    .eq("user_id", args.userId)
    .select("group_id, user_id");

  if (deleteError) throw deleteError;
  if (!deletedRows || !deletedRows.length) {
    throw new Error("Member was not removed from the group.");
  }

  const { error: profileError } = await supabase
    .from("profiles")
    .update({
      membership_status: "removed",
      removed_reason: reason,
      removed_at: new Date().toISOString(),
      removed_by: args.removedBy,
    })
    .eq("id", args.userId);

  if (profileError) throw profileError;
}

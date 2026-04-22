"use client";

import { supabase } from "./supabase/client";

export async function removeMemberFromCommunity(args: {
  groupId: string;
  userId: string;
  removedBy: string;
  reason: string;
}) {
  const reason = String(args.reason || "").trim();
  if (!reason) throw new Error("Removal reason is required.");

  const { error: deleteError } = await supabase
    .from("group_members")
    .delete()
    .eq("group_id", args.groupId)
    .eq("user_id", args.userId);

  if (deleteError) throw deleteError;

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

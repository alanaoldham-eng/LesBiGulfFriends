"use client";
import { supabase } from "./supabase/client";
export async function softRemoveContent(targetType: "event_media" | "group_messages" | "event_messages" | "waiting_room_candidates", targetId: string, reason: string) {
  const { data, error } = await supabase.rpc("moderate_remove_content_rpc", { _target_type: targetType, _target_id: targetId, _reason: reason });
  if (error) throw error;
  if (!data?.removed) throw new Error("Content was not removed.");
  return data;
}

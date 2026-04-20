"use client";

import { supabase } from "./supabase/client";

export async function deleteEventByOwner(eventId: string, ownerId: string) {
  const { error } = await supabase
    .from("events")
    .delete()
    .eq("id", eventId)
    .eq("created_by", ownerId);

  if (error) throw error;
}

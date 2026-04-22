"use client";

import { supabase } from "./supabase/client";

function sameUtcDate(a: string | null | undefined, b: Date) {
  if (!a) return false;
  return new Date(a).toISOString().slice(0, 10) === b.toISOString().slice(0, 10);
}

export function canEditPastEventMistake(eventRow: any) {
  const startsAt = eventRow?.starts_at ? new Date(eventRow.starts_at).getTime() : 0;
  const isPast = startsAt < Date.now();
  if (!isPast) return true;
  return sameUtcDate(eventRow?.created_at, new Date());
}

export async function deleteEventByOwner(eventId: string, ownerId: string) {
  const { data: existing, error: readError } = await supabase
    .from("events")
    .select("id, created_by")
    .eq("id", eventId)
    .maybeSingle();

  if (readError) throw readError;
  if (!existing?.id || existing.created_by !== ownerId) {
    throw new Error("Event not found or not owned by you.");
  }

  const { data, error } = await supabase.rpc("delete_owned_event_rpc", {
    _event_id: eventId,
  });

  if (error) throw error;
  if (!data?.deleted) throw new Error("Event was not deleted.");
  return data;
}

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
    .select("id, created_by, created_at, starts_at")
    .eq("id", eventId)
    .maybeSingle();

  if (readError) throw readError;
  if (!existing?.id || existing.created_by !== ownerId) {
    throw new Error("Event not found or not owned by you.");
  }

  // only allow delete for upcoming events or same-day mistake events
  const startsAt = existing.starts_at ? new Date(existing.starts_at).getTime() : 0;
  const isPast = startsAt < Date.now();
  const createdToday = sameUtcDate(existing.created_at, new Date());
  if (isPast && !createdToday) {
    throw new Error("Past events can only be deleted on the day they were created.");
  }

  const { data: deleted, error } = await supabase
    .from("events")
    .delete()
    .eq("id", eventId)
    .eq("created_by", ownerId)
    .select("id");

  if (error) throw error;
  if (!deleted || !deleted.length) {
    throw new Error("Event was not deleted.");
  }
}

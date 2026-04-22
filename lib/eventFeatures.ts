"use client";

import { supabase } from "./supabase/client";
import { validateImageOrVideo } from "./uploadValidation";
import { grantBadge, rewardUserKarma } from "./db";

function safeName(file: File) {
  return `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "-")}`;
}

export async function uploadEventAsset(userId: string, file: File) {
  validateImageOrVideo(file);
  const path = `${userId}/${safeName(file)}`;
  const { error } = await supabase.storage.from("event-media").upload(path, file, {
    cacheControl: "3600",
    upsert: false,
  });
  if (error) throw error;
  const { data } = supabase.storage.from("event-media").getPublicUrl(path);
  return { url: data.publicUrl, type: file.type };
}

export async function updateEventByOwner(eventId: string, ownerId: string, updates: {
  title?: string;
  description?: string | null;
  starts_at?: string;
  location?: string | null;
  cover_image_url?: string | null;
  link_url?: string | null;
  is_public?: boolean;
}) {
  const { data: updated, error } = await supabase
    .from("events")
    .update(updates)
    .eq("id", eventId)
    .eq("created_by", ownerId)
    .select("id")
    .maybeSingle();
  if (error) throw error;
  if (!updated?.id) throw new Error("Event update did not persist.");
}

export async function listEventMedia(eventId: string) {
  const { data, error } = await supabase
    .from("event_media")
    .select("*")
    .eq("event_id", eventId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function attachEventMedia(eventId: string, userId: string, file: File) {
  const uploaded = await uploadEventAsset(userId, file);
  const { error } = await supabase.from("event_media").insert({
    event_id: eventId,
    user_id: userId,
    media_url: uploaded.url,
    media_type: uploaded.type,
  });
  if (error) throw error;
  return uploaded;
}

export async function awardEventBadgeToUser(args: {
  userId: string;
  eventName: string;
  eventDate: string;
  awardedBy?: string | null;
}) {
  const badgeLabel = `Attended ${args.eventName} • ${args.eventDate}`;
  const { data: existing, error: readError } = await supabase
    .from("user_badges")
    .select("id")
    .eq("user_id", args.userId)
    .eq("badge_key", "event_attended")
    .eq("badge_label", badgeLabel)
    .limit(1);
  if (readError) throw readError;
  if ((existing || []).length) throw new Error("User already has that badge.");

  await grantBadge(args.userId, "event_attended", badgeLabel, "🎟️", null);

  await supabase
    .from("user_badges")
    .update({
      meta: {
        eventName: args.eventName,
        eventDate: args.eventDate,
        awardedBy: args.awardedBy || null,
      },
    })
    .eq("user_id", args.userId)
    .eq("badge_key", "event_attended")
    .eq("badge_label", badgeLabel)
    .is("meta", null);
}

export async function checkInToEventWithRewards(args: {
  eventId: string;
  userId: string;
  eventName: string;
  eventDate: string;
  file?: File | null;
  latitude?: number | null;
  longitude?: number | null;
}) {
  const { data: existing, error: existingError } = await supabase
    .from("game_checkins")
    .select("id")
    .eq("user_id", args.userId)
    .eq("event_id", args.eventId)
    .eq("game_key", "event_checkin")
    .limit(1)
    .maybeSingle();
  if (existingError) throw existingError;
  if (existing?.id) throw new Error("You already checked in to this event.");

  let media_url: string | null = null;
  let media_type: string | null = null;

  if (args.file) {
    const uploaded = await uploadEventAsset(args.userId, args.file);
    media_url = uploaded.url;
    media_type = uploaded.type;

    await supabase.from("event_media").insert({
      event_id: args.eventId,
      user_id: args.userId,
      media_url,
      media_type,
    });
  }

  const today = new Date().toISOString().slice(0, 10);
  const { data: todays } = await supabase
    .from("game_checkins")
    .select("id")
    .eq("user_id", args.userId)
    .eq("game_key", "event_checkin")
    .eq("checkin_date", today);

  const todaysCount = (todays || []).length;
  const reward = todaysCount === 0 ? 3 : todaysCount === 1 ? 1 : 0;

  const { error } = await supabase.from("game_checkins").insert({
    user_id: args.userId,
    game_key: "event_checkin",
    event_id: args.eventId,
    checkin_date: today,
    media_url,
    media_type,
    latitude: args.latitude ?? null,
    longitude: args.longitude ?? null,
    verified_method: "manual",
  });
  if (error) throw error;

  if (reward > 0) {
    await rewardUserKarma(args.userId, reward, `event_attendance:${args.eventId}`);
  }

  try {
    await awardEventBadgeToUser({
      userId: args.userId,
      eventName: args.eventName,
      eventDate: args.eventDate,
      awardedBy: null,
    });
  } catch {}

  return { reward };
}

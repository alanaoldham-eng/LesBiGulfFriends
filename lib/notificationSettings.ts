"use client";

import { supabase } from "./supabase/client";

export type EmailNotificationSettings = {
  user_id: string;
  email_friend_requests?: boolean | null;
  email_private_messages?: boolean | null;
  email_breakfast_reminders?: boolean | null;
  email_event_invites?: boolean | null;
};

export async function getEmailNotificationSettings(userId: string) {
  const { data, error } = await supabase
    .from("notification_settings")
    .select("user_id, email_friend_requests, email_private_messages, email_breakfast_reminders, email_event_invites")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw error;

  return data || {
    user_id: userId,
    email_friend_requests: false,
    email_private_messages: false,
    email_breakfast_reminders: false,
    email_event_invites: false,
  };
}

export async function upsertEmailNotificationSettings(settings: EmailNotificationSettings) {
  const payload = {
    user_id: settings.user_id,
    email_friend_requests: settings.email_friend_requests ?? false,
    email_private_messages: settings.email_private_messages ?? false,
    email_breakfast_reminders: settings.email_breakfast_reminders ?? false,
    email_event_invites: settings.email_event_invites ?? false,
  };

  const { data: existing, error: readError } = await supabase
    .from("notification_settings")
    .select("user_id")
    .eq("user_id", settings.user_id)
    .maybeSingle();

  if (readError) throw readError;

  if (existing?.user_id) {
    const { error } = await supabase.from("notification_settings").update(payload).eq("user_id", settings.user_id);
    if (error) throw error;
    return;
  }

  const { error } = await supabase.from("notification_settings").insert(payload);
  if (error) throw error;
}

export async function markNotificationRead(userId: string, notificationId: string) {
  const { error } = await supabase.from("notification_reads").upsert({
    user_id: userId,
    notification_id: notificationId,
    read_at: new Date().toISOString(),
  });
  if (error) throw error;
}


export async function listInAppNotifications(userId: string) {
  const notifications: any[] = [];

  const [{ data: readRows }, { data: storedRows }, { data: reqs }, { data: msgs }, { data: eventInvites }] = await Promise.all([
    supabase.from("notification_reads").select("notification_id").eq("user_id", userId),
    supabase
      .from("in_app_notifications")
      .select("id, type, title, body, href, created_at, read_at")
      .eq("recipient_user_id", userId)
      .is("read_at", null)
      .order("created_at", { ascending: false })
      .limit(50),
    supabase.from("friend_requests").select("id, from_user, created_at, status").eq("to_user", userId).eq("status", "pending").order("created_at", { ascending: false }).limit(20),
    supabase.from("messages").select("id, sender_id, created_at").eq("recipient_id", userId).order("created_at", { ascending: false }).limit(20),
    supabase.from("event_invites").select("id, event_id, inviter_id, created_at, sent_at, status").eq("invitee_user_id", userId).order("created_at", { ascending: false }).limit(30),
  ]);

  const readSet = new Set((readRows || []).map((r: any) => r.notification_id));

  for (const n of storedRows || []) {
    const id = String(n.id);
    if (readSet.has(id)) continue;
    notifications.push({
      id,
      type: n.type,
      text: n.title || n.body || "New notification",
      href: n.href || "/app",
      created_at: n.created_at,
    });
  }

  const profileIds = [...new Set([
    ...(reqs || []).map((r: any) => r.from_user),
    ...(msgs || []).map((m: any) => m.sender_id),
    ...(eventInvites || []).map((e: any) => e.inviter_id),
  ].filter(Boolean))];

  let names = new Map<string, string>();
  if (profileIds.length) {
    const { data: profiles } = await supabase.from("profiles").select("id, display_name").in("id", profileIds);
    names = new Map((profiles || []).map((p: any) => [p.id, p.display_name || "A member"]));
  }

  const eventIds = [...new Set((eventInvites || []).map((e: any) => e.event_id).filter(Boolean))];
  let eventNames = new Map<string, string>();
  if (eventIds.length) {
    const { data: events } = await supabase.from("events").select("id, title").in("id", eventIds);
    eventNames = new Map((events || []).map((e: any) => [e.id, e.title || "an event"]));
  }

  for (const r of reqs || []) {
    const id = `fr-${r.id}`;
    if (readSet.has(id)) continue;
    notifications.push({
      id,
      type: "friend_request",
      text: `${names.get(r.from_user) || "A member"} sent you a friend request`,
      href: "/friends",
      created_at: r.created_at,
    });
  }

  for (const m of msgs || []) {
    const id = `dm-${m.id}`;
    if (readSet.has(id)) continue;
    notifications.push({
      id,
      type: "private_message",
      text: `New message from ${names.get(m.sender_id) || "a member"}`,
      href: `/messages?thread=${encodeURIComponent(m.sender_id)}&notification=${encodeURIComponent(id)}`,
      created_at: m.created_at,
    });
  }

  for (const ev of eventInvites || []) {
    const id = `event-${ev.id}`;
    if (readSet.has(id)) continue;

    // Avoid duplicate display if the durable notification table already has this exact event URL.
    const href = `/events-app?event=${encodeURIComponent(ev.event_id)}&notification=${encodeURIComponent(id)}`;
    const alreadyHasStored = notifications.some((n) => n.href?.includes(`/events-app?event=${encodeURIComponent(ev.event_id)}`));
    if (alreadyHasStored) continue;

    notifications.push({
      id,
      type: "event_invite",
      text: `You're invited to ${eventNames.get(ev.event_id) || "an event"}`,
      href,
      created_at: ev.sent_at || ev.created_at,
    });
  }

  return notifications.sort((a, b) => (a.created_at < b.created_at ? 1 : -1)).slice(0, 25);
}

export async function createStoredInAppNotification(payload: {
  recipient_user_id: string;
  actor_user_id?: string | null;
  type: string;
  title: string;
  body?: string | null;
  href: string;
  event_id?: string | null;
}) {
  const { error } = await supabase.from("in_app_notifications").insert({
    recipient_user_id: payload.recipient_user_id,
    actor_user_id: payload.actor_user_id || null,
    type: payload.type,
    title: payload.title,
    body: payload.body || null,
    href: payload.href,
    event_id: payload.event_id || null,
  });
  if (error) throw error;
}

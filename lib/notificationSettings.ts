"use client";

import { supabase } from "./supabase/client";

export type EmailNotificationSettings = {
  user_id: string;
  email_friend_requests?: boolean | null;
  email_private_messages?: boolean | null;
  email_breakfast_reminders?: boolean | null;
};

export type InAppNotification = {
  id: string;
  type: string;
  text: string;
  href: string;
  created_at: string;
};

export async function getEmailNotificationSettings(userId: string) {
  const { data, error } = await supabase
    .from("notification_settings")
    .select("user_id, email_friend_requests, email_private_messages, email_breakfast_reminders")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw error;

  return (data || {
    user_id: userId,
    email_friend_requests: false,
    email_private_messages: false,
    email_breakfast_reminders: false,
  }) as EmailNotificationSettings;
}

export async function upsertEmailNotificationSettings(settings: EmailNotificationSettings) {
  const payload = {
    user_id: settings.user_id,
    email_friend_requests: settings.email_friend_requests ?? false,
    email_private_messages: settings.email_private_messages ?? false,
    email_breakfast_reminders: settings.email_breakfast_reminders ?? false,
  };

  const { data: existing, error: readError } = await supabase
    .from("notification_settings")
    .select("user_id")
    .eq("user_id", settings.user_id)
    .maybeSingle();

  if (readError) throw readError;

  if (existing?.user_id) {
    const { error } = await supabase
      .from("notification_settings")
      .update(payload)
      .eq("user_id", settings.user_id);
    if (error) throw error;
    return;
  }

  const { error } = await supabase.from("notification_settings").insert(payload);
  if (error) throw error;
}

export async function listInAppNotifications(userId: string) {
  const notifications: InAppNotification[] = [];

  const { data: reqs } = await supabase
    .from("friend_requests")
    .select("id, from_user, created_at, status")
    .eq("to_user", userId)
    .eq("status", "pending")
    .order("created_at", { ascending: false })
    .limit(20);

  const friendSenderIds = (reqs || []).map((r: any) => r.from_user);
  let friendNames = new Map<string, string>();

  if (friendSenderIds.length) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, display_name")
      .in("id", friendSenderIds);
    friendNames = new Map((profiles || []).map((p: any) => [p.id, p.display_name || "A member"]));
  }

  (reqs || []).forEach((r: any) => {
    notifications.push({
      id: `fr-${r.id}`,
      type: "friend_request",
      text: `${friendNames.get(r.from_user) || "A member"} sent you a friend request`,
      href: "/friends",
      created_at: r.created_at,
    });
  });

  const { data: msgs } = await supabase
    .from("messages")
    .select("id, sender_id, created_at")
    .eq("recipient_id", userId)
    .order("created_at", { ascending: false })
    .limit(20);

  const messageSenderIds = [...new Set((msgs || []).map((m: any) => m.sender_id))];
  let messageNames = new Map<string, string>();

  if (messageSenderIds.length) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, display_name")
      .in("id", messageSenderIds);
    messageNames = new Map((profiles || []).map((p: any) => [p.id, p.display_name || "A member"]));
  }

  (msgs || []).forEach((m: any) => {
    notifications.push({
      id: `dm-${m.id}`,
      type: "private_message",
      text: `New message from ${messageNames.get(m.sender_id) || "a member"}`,
      href: "/messages",
      created_at: m.created_at,
    });
  });

  return notifications
    .sort((a, b) => (a.created_at < b.created_at ? 1 : -1))
    .slice(0, 25);
}

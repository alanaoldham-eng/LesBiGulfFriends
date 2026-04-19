"use client";

import { supabase } from "./supabase/client";
import { validateMessageEdit } from "./uploadValidation";

export async function editGroupMessageByAuthor(messageId: string, userId: string, body: string) {
  const clean = validateMessageEdit(body);
  const { error } = await supabase
    .from("group_messages")
    .update({
      body: clean,
      edited_at: new Date().toISOString(),
    })
    .eq("id", messageId)
    .eq("sender_id", userId);

  if (error) throw error;
}

export async function editEventMessageByAuthor(messageId: string, userId: string, body: string) {
  const clean = validateMessageEdit(body);
  const { error } = await supabase
    .from("event_messages")
    .update({
      body: clean,
      edited_at: new Date().toISOString(),
    })
    .eq("id", messageId)
    .eq("sender_id", userId);

  if (error) throw error;
}

"use client";

import { supabase } from "./supabase/client";
import { validateImageOrVideo, validateWarningWallText } from "./uploadValidation";

function safeName(file: File) {
  return `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "-")}`;
}

export async function uploadWarningWallPhoto(userId: string, file: File) {
  const { isImage } = validateImageOrVideo(file, { maxImageMb: 10, maxVideoMb: 10 });
  if (!isImage) throw new Error("Warning Wall only allows photo uploads.");

  const path = `${userId}/${safeName(file)}`;
  const { error } = await supabase.storage.from("warning-wall-photos").upload(path, file, {
    cacheControl: "3600",
    upsert: false,
  });
  if (error) throw error;
  const { data } = supabase.storage.from("warning-wall-photos").getPublicUrl(path);
  return data.publicUrl;
}

export async function createSafeWarningWallPost(args: {
  userId: string;
  body: string;
  photoUrl?: string | null;
}) {
  const clean = validateWarningWallText(args.body);
  const { data, error } = await supabase
    .from("warning_wall_posts")
    .insert({
      created_by: args.userId,
      body: clean,
      photo_url: args.photoUrl || null,
    })
    .select("id")
    .single();

  if (error) throw error;
  return data;
}

export async function reportWarningWallPost(postId: string, reporterId: string, reason: string) {
  const clean = String(reason || "").trim();
  if (!clean) throw new Error("Please enter a reason for reporting.");

  const { error } = await supabase
    .from("warning_wall_reports")
    .insert({
      post_id: postId,
      reporter_id: reporterId,
      reason: clean,
    });

  if (error) throw error;
}

export async function setWarningWallHidden(postId: string, isHidden: boolean, hiddenReason?: string | null) {
  const { error } = await supabase
    .from("warning_wall_posts")
    .update({
      is_hidden: isHidden,
      hidden_reason: hiddenReason || null,
    })
    .eq("id", postId);

  if (error) throw error;
}

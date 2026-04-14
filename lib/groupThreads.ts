import { supabase } from "./supabase/client";

export type GroupMessageRow = {
  id: string;
  group_id: string;
  sender_id: string;
  body: string;
  created_at: string;
  parent_message_id: string | null;
  media_url?: string | null;
  media_type?: string | null;
  link_url?: string | null;
};

export type ThreadedGroupMessage = GroupMessageRow & {
  replies: GroupMessageRow[];
};

export async function listGroupTopLevelMessages(
  groupId: string,
  page = 1,
  pageSize = 10
) {
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data, error, count } = await supabase
    .from("group_messages")
    .select("*", { count: "exact" })
    .eq("group_id", groupId)
    .is("parent_message_id", null)
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) throw error;

  return {
    rows: (data || []) as GroupMessageRow[],
    count: count || 0,
    hasMore: (count || 0) > page * pageSize,
  };
}

export async function listGroupReplies(groupId: string, parentIds: string[]) {
  if (!parentIds.length) return [] as GroupMessageRow[];

  const { data, error } = await supabase
    .from("group_messages")
    .select("*")
    .eq("group_id", groupId)
    .in("parent_message_id", parentIds)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return (data || []) as GroupMessageRow[];
}

export function buildGroupThreads(
  topLevel: GroupMessageRow[],
  replies: GroupMessageRow[]
): ThreadedGroupMessage[] {
  const repliesByParent = new Map<string, GroupMessageRow[]>();

  for (const reply of replies) {
    const key = reply.parent_message_id!;
    const existing = repliesByParent.get(key) || [];
    existing.push(reply);
    repliesByParent.set(key, existing);
  }

  for (const [, rows] of repliesByParent) {
    rows.sort(
      (a, b) =>
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );
  }

  return topLevel.map((post) => ({
    ...post,
    replies: repliesByParent.get(post.id) || [],
  }));
}

export async function hasUserPostedToGroupBefore(
  groupId: string,
  userId: string
) {
  const { data, error } = await supabase
    .from("group_messages")
    .select("id")
    .eq("group_id", groupId)
    .eq("sender_id", userId)
    .is("parent_message_id", null)
    .limit(1);

  if (error) throw error;
  return (data || []).length > 0;
}

export function getGroupComposerPlaceholder(args: {
  isReply: boolean;
  hasPostedBefore: boolean;
  groupName: string;
}) {
  if (args.isReply) return "Reply here";
  if (!args.hasPostedBefore) return "Introduce yourself to the group";
  return `Post to ${args.groupName}`;
}

export async function createGroupPost(input: {
  group_id: string;
  sender_id: string;
  body: string;
}) {
  const { data, error } = await supabase
    .from("group_messages")
    .insert({
      group_id: input.group_id,
      sender_id: input.sender_id,
      body: input.body.trim(),
      parent_message_id: null,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function createGroupReply(input: {
  group_id: string;
  sender_id: string;
  parent_message_id: string;
  body: string;
}) {
  const { data, error } = await supabase
    .from("group_messages")
    .insert({
      group_id: input.group_id,
      sender_id: input.sender_id,
      body: input.body.trim(),
      parent_message_id: input.parent_message_id,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

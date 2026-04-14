create index if not exists group_messages_group_parent_created_idx
  on public.group_messages (group_id, parent_message_id, created_at desc);

create index if not exists group_messages_group_sender_parent_idx
  on public.group_messages (group_id, sender_id, parent_message_id);

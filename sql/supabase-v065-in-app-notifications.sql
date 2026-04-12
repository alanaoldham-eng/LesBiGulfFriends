-- v065 add in-app notification opt-in settings

alter table public.notification_settings
  add column if not exists in_app_friend_requests boolean not null default true,
  add column if not exists in_app_private_messages boolean not null default true;

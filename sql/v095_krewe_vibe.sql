-- v095 Krewe Vibe
-- Uses the existing tables:
--   public.member_questions
--   public.member_answers
-- This script only seeds/updates questions, policies, and completion notifications.

create extension if not exists pgcrypto;

create table if not exists public.member_questions (
  id uuid primary key default gen_random_uuid(),
  question_key text unique not null,
  question_text text not null,
  category text not null,
  is_public boolean not null default false,
  is_active boolean not null default true,
  display_order int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.member_answers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  question_id uuid not null references public.member_questions(id) on delete cascade,
  answer_text text,
  answer_value jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, question_id)
);

create index if not exists idx_member_questions_active_order
on public.member_questions(is_active, display_order);

create index if not exists idx_member_questions_key
on public.member_questions(question_key);

create index if not exists idx_member_answers_user
on public.member_answers(user_id);

create index if not exists idx_member_answers_question
on public.member_answers(question_id);

create index if not exists idx_member_answers_user_question
on public.member_answers(user_id, question_id);

alter table public.member_questions enable row level security;
alter table public.member_answers enable row level security;

do $$
begin
  begin
    create policy "members read active krewe questions"
      on public.member_questions
      for select
      to authenticated
      using (is_active = true);
  exception when duplicate_object then null;
  end;

  begin
    create policy "members read own krewe answers"
      on public.member_answers
      for select
      to authenticated
      using (user_id = auth.uid());
  exception when duplicate_object then null;
  end;

  begin
    create policy "members read public krewe answers"
      on public.member_answers
      for select
      to authenticated
      using (
        exists (
          select 1
          from public.member_questions q
          where q.id = question_id
            and q.is_active = true
            and q.is_public = true
        )
      );
  exception when duplicate_object then null;
  end;

  begin
    create policy "members insert own krewe answers"
      on public.member_answers
      for insert
      to authenticated
      with check (user_id = auth.uid());
  exception when duplicate_object then null;
  end;

  begin
    create policy "members update own krewe answers"
      on public.member_answers
      for update
      to authenticated
      using (user_id = auth.uid())
      with check (user_id = auth.uid());
  exception when duplicate_object then null;
  end;
end $$;

insert into public.member_questions
  (question_key, question_text, category, is_public, is_active, display_order)
values
  ('why_join', 'Why do you want to join Les Bi Gulf Friends?', 'community_values', true, true, 10),
  ('social_energy', 'Which best describes the kind of energy you bring into social spaces?', 'communication_style', true, true, 20),
  ('community_meaning', 'What does “community” mean to you?', 'community_values', true, true, 30),
  ('rsvp_cannot_attend', 'If you RSVP “Going” to an event but can’t make it, what do you usually do?', 'reliability', false, true, 40),
  ('conflict_with_members', 'How do you usually handle conflict with friends or group members?', 'conflict_style', false, true, 50),
  ('removed_or_banned', 'Have you ever been removed or banned from an online group, organization, or social community?', 'accountability', false, true, 60),
  ('event_priority', 'Which of these feels most important at a group event?', 'community_values', true, true, 70),
  ('new_member_nervous', 'A new member arrives alone and looks nervous. What would you most likely do?', 'social_generosity', false, true, 80),
  ('behavior_ruins_community', 'What kind of behavior ruins a community?', 'community_values', false, true, 90),
  ('digital_privacy', 'Which statement do you agree with most?', 'privacy', false, true, 100),
  ('emotional_confidence', 'If another member confides in you emotionally, what is your responsibility?', 'privacy', false, true, 110),
  ('ideal_gathering', 'Which sounds most like your ideal gathering?', 'event_preferences', true, true, 120),
  ('rules_moderators', 'How do you feel about group rules and moderators?', 'moderation_fit', false, true, 130),
  ('classy_meaning', 'What makes someone “classy” to you?', 'community_values', true, true, 140),
  ('scenario_spilled_drink', 'Scenario: At an event, someone accidentally spills a drink on you. What do you do?', 'scenario_conflict', false, true, 150),
  ('scenario_pick_side', 'Scenario: You learn that two members are privately arguing and one asks you to “pick a side.” How do you respond?', 'scenario_conflict', false, true, 160),
  ('scenario_photo_dislike', 'Scenario: Someone posts a photo of you from an event that you dislike. What do you do?', 'scenario_privacy', false, true, 170),
  ('contribution', 'What are you hoping to contribute to this community?', 'community_values', true, true, 180),
  ('anything_else', 'Is there anything else you’d like us to know about you?', 'optional', true, true, 190)
on conflict (question_key) do update set
  question_text = excluded.question_text,
  category = excluded.category,
  is_public = excluded.is_public,
  is_active = excluded.is_active,
  display_order = excluded.display_order;

-- In-app prompt for existing active members who have not started the questionnaire.
-- The app will also show a menu prompt when incomplete.
insert into public.in_app_notifications
  (recipient_user_id, actor_user_id, type, title, body, href)
select
  p.id,
  null,
  'krewe_vibe',
  'Complete your Krewe Vibe',
  'A short front-porch style questionnaire helps us suggest better friends, events, and community matches.',
  '/krewe-vibe'
from public.profiles p
where coalesce(p.is_banned, false) = false
  and coalesce(p.membership_status, 'active') not in ('removed', 'banned')
  and not exists (
    select 1
    from public.member_answers a
    join public.member_questions q on q.id = a.question_id
    where a.user_id = p.id
      and q.question_key = 'why_join'
  )
  and not exists (
    select 1
    from public.in_app_notifications n
    where n.recipient_user_id = p.id
      and n.type = 'krewe_vibe'
      and n.href = '/krewe-vibe'
      and n.read_at is null
  );

create index if not exists idx_in_app_notifications_krewe_vibe
on public.in_app_notifications(recipient_user_id, type, read_at, created_at desc);

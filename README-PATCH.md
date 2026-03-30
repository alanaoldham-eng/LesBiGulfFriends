# Les Bi Gulf Friends — v064 Web Rollup Overlay

This package is an **overlay**, not a full repo export.
Copy these files on top of your current repo, then run the SQL patch:

```bash
sql/supabase-v064-web-rollup.sql
```

## What is included
- safe `admin_users` setup and no-recursion RLS foundation
- group members/profile visibility fix
- group messages newest-first ordering
- Main group default flow
- onboarding profile completion flow with generated heroic usernames
- automatic intro post into Main after onboarding save
- curated content pages + tables
- anonymous confessions + reply/report tables
- blind chat shell + tables
- games framework + starter definitions
- waiting room hard gate + auto post into Main group
- consensual roleplay game (replaces dungeon concept)
- corrected Hot Takes page

## Important notes
- `reject_waiting_candidate_hard_delete()` attempts to delete from `auth.users`; on some Supabase projects this may still require manual cleanup in the dashboard. It logs that case into `moderation_logs`.
- This package assumes your project already has the existing `public.profiles`, `public.groups`, `public.group_members`, `public.group_messages`, `public.karma_ledger`, and related social tables shown in your shared schema.
- The new waiting room and roleplay routes are web-first and compile-safe against the helper files included here, but you should still run a local build before pushing to production.

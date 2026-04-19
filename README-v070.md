# v070 foundation package

This package is the additive, lower-risk foundation for v070.

Included:
- `sql/v070_events_and_abuse.sql`
- `sql/v070_storage.sql`
- `lib/uploadValidation.ts`
- `lib/messageEditing.ts`
- `lib/eventFeatures.ts`
- `lib/warningWallSafety.ts`
- `app/api/events/invite/route.ts`
- `docs/V070-INTEGRATION-CHECKLIST.md`

This package is designed to avoid regression risk by adding:
- schema changes
- storage policies
- helper modules
- invite email route

It does **not** overwrite your large page files automatically.

## Why this packaging choice
Your app has had multiple regression bugs from large page-file replacements. This package gives you the safe v070 backend/base layer first.

## What this enables
1. Public events can create internal invites for all members
2. Email invite delivery only to users who opted in
3. Private events can invite selected friends
4. Event media bucket support using Supabase Storage
5. Event check-in with media, badge, and anti-inflation karma logic
6. Author-only message editing helpers for group/event messages
7. Warning Wall reporting/hide helpers
8. Upload validation for images/videos

## Required SQL order
Run these in Supabase SQL Editor:
1. `sql/v070_events_and_abuse.sql`
2. `sql/v070_storage.sql`

## Required env vars
- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `RESEND_API_KEY` (optional for invite email sending)
- `RESEND_FROM_EMAIL` (optional)

## Next step
After adding these files and running SQL, wire the helpers into:
- `app/events-app/page.tsx`
- `app/groups-app/[groupId]/page.tsx`
- `app/warning-wall/page.tsx`

See `docs/V070-INTEGRATION-CHECKLIST.md`

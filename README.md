# v078 full stable foundation patch

This package is designed to stabilize the missing/shared infrastructure that has been causing
buttons and flows to silently fail across the app.

## Apply order
1. Run `sql/v078_full_stable.sql` in Supabase.
2. Unzip into your repo root and overwrite files.
3. Read `PATCH-INSTRUCTIONS.txt`.
4. Run:

```powershell
npm run build
```

## Included
- SQL: membership/removal RPCs, waiting-room delete RPC, badge dedupe, event media comment/reaction tables
- `lib/moderation.ts`
- `lib/eventCrud.ts`
- `lib/eventMedia.ts`
- `lib/mediaClient.ts`
- `components/ClientShell.tsx`
- `app/messages/page.tsx`
- `app/waiting-room/page.tsx`

## Intent
This patch gives you a consistent foundation so:
- Make Mod / Remove Mod can persist
- Remove Member can persist
- Waiting Room access is restricted correctly
- Messages render in a stable way
- Event media comments/reactions have a backing library
- View Profile points to the public member profile

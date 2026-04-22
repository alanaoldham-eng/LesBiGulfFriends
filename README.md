# v076 bootstrap patch

This patch is for the case where these files were missing locally:
- lib/moderation.ts
- lib/eventCrud.ts
- components/ClientShell.tsx
- app/messages/page.tsx

Apply in this order:
1. Run `sql/v076_patch.sql` in Supabase
2. Unzip into repo root and overwrite files
3. Review `PATCH-INSTRUCTIONS.txt` for your existing `app/events-app/page.tsx`
4. Run `npm run build`

# v074.1 full safe overwrite patch

Included:
- sql/v074_1_member_removal.sql
- lib/moderation.ts
- lib/eventCrud.ts
- app/groups-app/[groupId]/page.tsx
- app/events-app/page.tsx

## Apply
1. Run the SQL in Supabase
2. Unzip into repo root and overwrite files
3. Run:

```powershell
npm run build
```

## What this fixes
- compact admin/mod controls in karma standings
- Make Mod toggles to Remove Mod and works correctly
- member removal prompts for a reason and stores removed status, reason, removed date, removed by
- event badge dropdown loads all users
- delete event moved to Upcoming Events and works
- no delete CTA for past events
- no invite section for past events

# v067a root-level patch

This patch fixes the missing-module regression from v067 and keeps the notification/profile/group UI fixes.

Included files:
- `components/ClientShell.tsx`
- `app/profile/page.tsx`
- `app/members/[id]/page.tsx`
- `app/groups-app/[groupId]/page.tsx`
- `lib/notificationSettings.ts`
- `lib/groupMessagesDetailed.ts`

Apply at repo root, overwrite matching files, then run:

```powershell
npm run build
```

# v068c root-level patch

Fixes build error in:

- `app/groups-app/[groupId]/page.tsx`

Error fixed:
- `Cannot find name 'sendFriendRequestEmailNotification'`

This patch adds the missing helper function back into the file.

After unzip:
1. merge into repo root
2. overwrite matching file
3. run:
   `npm run build`

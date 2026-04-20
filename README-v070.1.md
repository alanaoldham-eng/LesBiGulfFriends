# v070.1 UI wiring patch

This patch wires the v070 foundation helpers into your current UI.

Included:
- `app/events-app/page.tsx`
- `app/groups-app/[groupId]/page.tsx`
- `app/warning-wall/page.tsx`

Before using this patch:
1. Apply the v070 foundation package
2. Run the v070 SQL scripts in Supabase
3. Then overwrite these files and run `npm run build`

What this patch adds:
- event owner edit flow
- event cover image + link fields
- public/private invite wiring
- private friend invite selection
- event media gallery uploads
- event check-in with optional media + badge/karma helper
- author-only edit for event messages
- author-only edit for group messages and replies
- warning wall confirmation checkbox
- warning wall safer photo upload helper
- warning wall report button
- warning wall moderator/admin hide toggle

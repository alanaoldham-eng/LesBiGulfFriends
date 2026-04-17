# v068 root-level patch

Included:
- components/ClientShell.tsx
- app/groups-app/page.tsx
- app/groups-app/[groupId]/page.tsx
- app/warning-wall/page.tsx
- lib/community.ts
- lib/warningWall.ts

Notes:
- Warning Wall expects a `warning_wall_posts` table. The page fails gracefully if it does not exist yet.
- Community access gating checks approved membership status or an invite bound to the user account. Otherwise it redirects the user into `/waiting-room`.

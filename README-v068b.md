# v068b root-level patch

This patch disables waiting-room routing for now so logged-in users can access:
- landing page
- groups page
- direct group links

Included:
- lib/community.ts
- app/app/page.tsx
- app/groups-app/page.tsx
- app/groups-app/[groupId]/page.tsx

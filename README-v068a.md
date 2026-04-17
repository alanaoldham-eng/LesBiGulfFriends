# v068a root-level patch

Included:
- lib/community.ts
- app/app/page.tsx
- app/groups-app/page.tsx
- app/groups-app/[groupId]/page.tsx

Fixes:
1. Uninvited users are routed to waiting room in app/groups flow
2. Main group opens again for invited/approved users
3. Group threads use Read More in chunks of 10
4. Create Group CTA appears for users with at least 1 karma

Note:
True email verification still depends on Supabase Auth settings.

# v074 patch

Included:
- sql/v074_perf_and_notifications.sql
- lib/notificationSettings.ts
- lib/eventCrud.ts
- app/messages/page.tsx
- app/profile/page.tsx
- app/admin-rewards/page.tsx
- app/events-app/page.tsx
- app/groups-app/[groupId]/page.tsx

Fixes:
1. Private-message notifications open the actual DM thread and mark as read
2. Event owners can delete duplicate events
3. Added more performance indexes
4. Added event email notification opt-in in profile
5. Smaller reply/react buttons in groups
6. Admin Magic Wand badge dropdown includes OG and past-event badges
7. Past events no longer show Invite People

Apply:
1. unzip into repo root
2. run sql/v074_perf_and_notifications.sql in Supabase
3. overwrite files
4. run npm run build

# v07.3 patch

Included:
- `sql/v073_notifications_perf_admin.sql`
- `lib/notificationSettings.ts`
- `lib/eventCrud.ts`
- `components/ClientShell.tsx`
- `app/messages/page.tsx`
- `app/profile/page.tsx`
- `app/admin-rewards/page.tsx`
- `app/events-app/page.tsx`

What this patch does:
1. Clicking a private-message notification opens the DM thread and marks the notification read
2. Adds delete-event function for event owners
3. Adds performance indexes and lighter notification queries
4. Adds event email notification setting to profile
5. Improves profile fallback so users can still open/edit their own profile even if bootstrap was incomplete
6. Renames Admin Karma Rewards to Admin Magic Wand and adds badge presets including past-event badges
7. Moves Events directly under Friends & Invites in hamburger menu

Apply order:
1. unzip into repo root
2. run `sql/v073_notifications_perf_admin.sql` in Supabase
3. overwrite files
4. run `npm run build`

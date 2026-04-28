# v083 patch

Apply order:
1. Run `sql/v083_public_events_and_badges.sql` in Supabase.
2. Unzip this patch into the repo root and overwrite files.
3. Run `npm run build`.

Fixes:
- Hamburger menu opens to the left so it is not cut off on mobile.
- Public events are visible to all members on the Events page.
- Public event invite API invites all active members for in-app notifications.
- Email event notifications are still sent only when members opt in.
- SQL backfills all members into all public events, past and future.
- I Voted badges display: `I Voted 🗳️ <Election Title> (<Expiration Date>)`.

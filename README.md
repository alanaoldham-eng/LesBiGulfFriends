# v085 durable public event in-app notifications

Apply order:
1. Run `sql/v085_durable_public_event_notifications.sql` in Supabase.
2. Unzip into repo root and overwrite files.
3. Run `npm run build`.

Fix:
- Every public event created by any member now creates/updates invite rows for all active members.
- Every automatically invited member gets a durable in-app notification in `public.in_app_notifications`.
- The bell reads durable notifications first, then falls back to event_invites.
- Event invitation emails are still sent only when `notification_settings.email_event_invites = true`.
- Public event creation now surfaces an error if notification creation fails, instead of silently passing.

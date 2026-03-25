# Deploy Guide — Vercel + Hostinger Domain + Supabase + Resend

## Recommended architecture
- App hosting: Vercel
- Domain registrar/DNS: Hostinger
- Database/Auth: Supabase
- Auth email delivery: Resend SMTP

## Important clarification
If you deploy the app on Vercel, Vercel is the web host.
Hostinger can still be used for:
- the domain registration
- DNS management
- mailboxes
- backup file storage

If you want Hostinger to host the running Next.js app instead, you would move the app off Vercel onto Hostinger's Node.js hosting.

## 1) Connect your domain from Hostinger to Vercel
In Vercel, add:
- lesbigulffriends.com
- www.lesbigulffriends.com

Vercel will show the required DNS records. Add those exact records in Hostinger DNS. Commonly:
- root/apex `@` → A record to the Vercel IP shown by Vercel
- `www` → CNAME to `cname.vercel-dns.com`

Use Vercel's domain screen as the source of truth.

## 2) Vercel environment variables
Set:
- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY
- NEXT_PUBLIC_SITE_URL=https://lesbigulffriends.com

Redeploy after changing env vars.

## 3) Supabase Auth URL configuration
Set:
- Site URL = https://lesbigulffriends.com
- Redirect URLs:
  - https://lesbigulffriends.com/auth/callback
  - https://www.lesbigulffriends.com/auth/callback
  - http://localhost:3000/auth/callback

## 4) Resend SMTP in Supabase
In Resend:
- add and verify lesbigulffriends.com
- create an API key

In Supabase Authentication email/SMTP settings use:
- Host: smtp.resend.com
- Port: 587
- Username: resend
- Password: YOUR_RESEND_API_KEY
- Sender email: onboarding@lesbigulffriends.com
- Sender name: Les Bi Gulf Friends

## 5) Test flow
- sign up
- verify email once
- log in with password
- forgot password
- profile setup
- create/join group

## Account creation email failed

If signup says "failed to send email", the app code is usually fine and the issue is on the auth email side.

Check these in Supabase:
1. Authentication email confirmation is enabled the way you expect
2. Custom SMTP is configured
3. Resend domain is verified
4. Sender address matches the verified domain
5. Site URL and Redirect URLs are correct

Recommended sender:
- onboarding@lesbigulffriends.com

## v045 storage setup
The new package uploads files directly to Supabase Storage.

Buckets used:
- profile-photos
- chat-media

The included SQL migration creates both buckets and the basic policies:
- `supabase-v045-photo-main-group-attachments.sql`

## v047 invite email sending + events
This version adds:
- server-side invite email API route using Resend
- invite status updates: pending / sent / failed / joined
- retry-send button on the invites page
- events and event invites with email sending
- server-side event invite email API route using Resend

Set these environment variables:
- RESEND_API_KEY=your Resend API key (you said the key is named `invite-friend` in Resend)
- RESEND_FROM_EMAIL=onboarding@lesbigulffriends.com

Run this migration too:
- supabase-v047-invite-email-status-events.sql

## v047.1 fixes
This version adds:
- ids and names on form controls across the app
- better invite email error logging
- Vercel daily cron retry for failed invite emails only

New environment variables:
- RESEND_API_KEY = the actual secret value for your Resend key named `invite-friend`
- RESEND_FROM_EMAIL = onboarding@lesbigulffriends.com
- SUPABASE_SERVICE_ROLE_KEY = required for the daily failed-invite retry job
- CRON_SECRET = optional but recommended for protecting the cron route

The browser console errors referencing:
- chrome-extension://...
- content.js
- runtime.lastError
come from a browser extension, not from your app code.

## v048 invite/event status badge + karma costs
The invite send result badge shows the current delivery state directly in the UI, such as:
- pending
- sent
- failed
- joined

This version also adds:
- cost of 1 karma point to create a group
- cost of 1 karma point to create an event
- +1 karma point to the inviter when an invited friend creates an account and posts an introduction in the Main group chat

Run this migration too:
- supabase-v048-karma-costs-intro-reward.sql

## v049 invite FK + trigger hardening
This version fixes the database error:
- `insert or update on table "invites" violates foreign key constraint "invites_invitee_user_id_fkey"`

Changes:
- `invites.invitee_user_id` now references `auth.users(id)` instead of `profiles(id)`
- `event_invites.invitee_user_id` now references `auth.users(id)` too
- invite join triggers are hardened
- friendship creation is backfilled when the profile row appears
- existing joined invites are backfilled into friendships

Run this migration too:
- `supabase-v049-invite-fk-and-trigger-hardening.sql`

## v050 onboarding, karma visibility, private groups, and moderation
This version adds:
- onboarding no longer mentions magic links
- group/event creation actions are hidden when a member has 0 karma
- groups now clearly mention the 1 karma point creation cost
- private groups are now supported
- group owners/moderators can view members, promote moderators, and remove members

Run this migration too:
- `supabase-v050-private-groups-moderation.sql`

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

## v051 groups visibility + threading + reactions + member profiles
This version adds:
- public groups remain visible even when the user has 0 karma
- group creation and event creation stay hidden when the user has 0 karma
- group message threading with reply
- event message threading with reply
- emoji reactions on group and event messages
- clickable message authors that open member profiles
- Add Friend button from message authors and member profiles
- first profile photo shown next to message authors
- clickable requester names on the Friends page

Run this migration too:
- supabase-v051-threading-reactions-profiles.sql

## v052 reply and profile layout polish
This version adds:
- fixed group Reply button wiring so reply state is clearly attached in group threads
- profile page layout now shows:
  - first profile photo at the top
  - profile details next
  - remaining photos after the profile details

## v053 karma roadmap, public activity rewards, and internal feedback
This version adds:
- in-app explanation for what comes next with karma:
  - phase 1 uses a database ledger
  - phase 2 plans an ERC-20 token on Base
  - embedded wallets by email using Thirdweb
  - intended airdrop path when moving from the database ledger to blockchain
- internal bug report / feature request page that stores records directly in the database
- karma rewards for public activity:
  - 0.3 for a new post in a public group or public event
  - 0.2 for a reply in a public group or public event
  - 0.1 for an emoji reaction in a public group or public event

Run this migration too:
- supabase-v053-karma-roadmap-feedback-public-rewards.sql

## v054 abuse reporting and inviter karma penalty
This version adds:
- a Report abuse option alongside Report bug and Request feature
- abuse reports are stored only in the database, not shown in the web app
- abuse reports can include a reported user id
- when a user is reported for abuse, the inviter loses 1 karma point
- lost karma points are tracked as moving into the future prize wallet for gamification rewards

Run this migration too:
- supabase-v054-abuse-reporting-prize-wallet.sql

## v055 admin rewards, abuse user selector, leaderboard, and profile CTA
This version adds:
- admin-only in-app karma reward panel
- abuse report form can select a user instead of requiring a raw user id
- landing page karma explanation
- landing page karma leaderboard with clickable member names and primary photos
- profile CTA encouraging members to complete their profile and post an introduction in Main

Run this migration too:
- supabase-v055-admin-rewards-landing-standings.sql

## v056 standings, availability, badges, proposals, and voting
This version adds:
- karma standings for all users with more than 0 karma under the member home snapshot
- duplicate-safe Add Friend behavior from member profile and group/event messages
- member availability calendar for the next 3 months
- manual OG badge granting from the admin panel
- proposal system with one vote per member
- completed-profile requirement for voting
- vote reward of 1 karma
- automatic unique "I Voted" badge per election
- proposal email invite route for new proposals

Run this migration too:
- supabase-v056-availability-badges-proposals.sql

## v057 karma decimal refactor and balance rebuild
This version adds:
- decimal-safe karma display formatting in the app
- a migration to rebuild `profiles.karma_points` from the full `karma_ledger`
- support for decimal karma totals after changing the database columns to `numeric`

Run this migration too:
- `supabase-v057-rebuild-karma-balances.sql`

## v058 public badges and group member standings
This version adds:
- badges now load on public member profile pages
- each group now shows member karma standings in descending order
- the member list includes all members regardless of karma amount

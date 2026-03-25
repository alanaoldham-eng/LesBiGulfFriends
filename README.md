# Les Bi Gulf Friends — Vercel + Next.js + Tina + Supabase Starter

This starter removes the Lovable dependency and gives you a simple **mobile-first web app** built for:

- **Next.js App Router**
- **Vercel**
- **Supabase**
- **Tina CMS**
- **GitHub**

The goal is to keep phase one simple:
- content-managed landing pages
- privacy page
- Supabase client wiring
- Tina content editing through Git + GitHub

Native Android and iOS apps can come later.

## 1) What is included

### App stack
- Next.js App Router web app
- Tina config in `/tina/config.ts`
- JSON content files in `/content/...`
- Supabase client setup in `/lib/supabase/client.ts`

### Editable content
- Home page
- Groups page
- Events page
- Privacy page

### Brand assets
- Your logo is included at `public/logo.png`

## 2) Local setup

Use Node 20+.

```bash
npm install
cp .env.example .env.local
```

Fill in:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_TINA_CLIENT_ID=
TINA_TOKEN=
NEXT_PUBLIC_TINA_BRANCH=main
```

Start local dev:

```bash
npm run dev
```

Open:
- site: `http://localhost:3000`
- Tina admin: `http://localhost:3000/admin/index.html`

## 3) Supabase setup

Create a new Supabase project, then copy:
- Project URL
- anon key

Put them into:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Recommended next Supabase steps:
1. Enable email auth / magic links
2. Create your MVP tables
3. Add RLS policies
4. Add profile-photo storage bucket

## 3.5) Supabase auth-enabled starter

This version adds:
- `/login` magic-link sign in
- `/auth/callback` session handler
- protected routes:
  - `/app`
  - `/profile`
  - `/friends`
  - `/messages`

### Extra env variable
Add:

```bash
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

In production, set this to your real Vercel URL or custom domain.

### Auth notes
This starter keeps auth simple for beta:
- sends magic links through Supabase
- sets a lightweight session cookie for route protection
- keeps deeper profile/friend/message data wiring for the next phase

Before production launch, harden the auth/session flow and connect the protected pages to your real Supabase tables.

## 3.6) Connected MVP UI included

This package now includes real connected starter pages for:
- profile create/edit
- friend request search + accept/decline
- direct messages between friends
- public groups
- group join flow
- group chat

### Required database
Run the Supabase MVP SQL + RLS script before testing these pages.

### Important
This is still an MVP starter:
- profile photos are not wired yet
- private group invites are not wired yet
- event flows are not wired yet
- auth/session handling is intentionally simple for beta and should be hardened before public launch

## 3.7) Branded onboarding + clean public landing flow

This version improves first impressions:

- adds `/onboarding` as a fun branded onboarding tour
- removes member-only links from the public landing layout
- keeps logged-in tools inside the protected member area
- makes `/login` feel more guided and less overwhelming

This helps you invite beta testers without showing internal member tools before they sign in.

## 3.8) First-time onboarding persistence + profile-first redirect

This version adds:
- onboarding progress remembered in localStorage
- login page nudges first-time visitors into onboarding
- auth callback redirects first-time users to `/profile`
- returning users land on `/app`

It also disables Tina in `package.json` for simpler deployment:
- `dev`: `next dev`
- `build`: `next build`
- `start`: `next start`

## 4.3) Cleanup package

This version removes the old magic-link API route and strips leftover auth UI from earlier iterations.
The app is now centered on:
- email + password sign-up
- email + password login
- email verification at account creation
- forgot-password flow
- display-name-first profile setup

Tina remains disabled in `package.json`.

## 4.4) Verification and login flow fix

This version fixes the email verification and password login flow:
- signup verification now redirects to `/login?verified=1`
- login no longer redirects password users to `/auth/callback`
- password login now sends users directly to `/profile` or `/app`
- callback no longer mentions magic links and redirects empty verification hits to login

Tina remains disabled in `package.json`.

## 4.5) Photos, Main group auto-join, relationship status, chat attachments

This version adds:
- up to 3 profile photos with ordering and deletion
- relationship status on profiles:
  - single
  - coupled
  - in an open relationship
  - it's complicated
- automatic addition of new users to the Main group
- picture and link support in private messages and group chat

Run the included SQL migration:
- `supabase-v045-photo-main-group-attachments.sql`

After running it, test:
- signup
- profile save with 1–3 photos
- relationship status save
- DM with image/link
- group chat with image/link

## 4.6) Invites + karma + automatic friendships

This version adds:
- invite friends by email from the member area
- automatic friendship creation when the invited friend signs up with that email
- automatic karma point award to the inviter when the invited friend joins
- profile now shows karma points
- fixes the profile relationship-status TypeScript build error from v045

Run both SQL files:
- `supabase-v045-photo-main-group-attachments.sql`
- `supabase-v046-invites-karma.sql`

## 4) Tina setup

This starter already includes a `tina/config.ts`.

### TinaCloud
For production editing, use TinaCloud:
1. Create a TinaCloud project
2. Connect your GitHub repo
3. Copy:
   - `NEXT_PUBLIC_TINA_CLIENT_ID`
   - `TINA_TOKEN`

### Important
Run local Tina dev at least once and commit generated Tina files when they appear, especially:
- `tina/tina-lock.json`

## 5) GitHub workflow

```bash
git init
git add .
git commit -m "Initial Vercel + Tina + Supabase starter"
git branch -M main
git remote add origin https://github.com/YOURNAME/YOUR-REPO.git
git push -u origin main
```

## 6) Vercel deployment

1. Go to Vercel
2. Import your GitHub repo
3. Vercel will detect Next.js automatically

Add these environment variables in Vercel:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_TINA_CLIENT_ID`
- `TINA_TOKEN`
- `NEXT_PUBLIC_TINA_BRANCH`

Build settings:
- Install: `npm install`
- Build: `npm run build`

Whenever you change environment variables, trigger a new deployment.

## 7) Content editing workflow

Editors use Tina at `/admin/index.html`.

Content locations:
- `content/pages/home.json`
- `content/pages/groups.json`
- `content/pages/events.json`
- `content/community/privacy.json`

## 8) What to build next

### Phase 1.5
- Supabase auth screens
- profiles
- privacy modal
- first-run onboarding

### Phase 2
- friend requests
- direct messages
- public/private groups
- group chat

### Phase 3
- events
- check-ins
- vibe mode
- karma

## 9) Notes
- This starter keeps content rendering simple by reading JSON from the filesystem.
- Tina edits those same JSON files through Git.
- Supabase is wired in but not yet used deeply in UI. That comes next.
- This is intentional: deploy content first, then add app logic.

## 10) Recommended next prompt for v0

> Build a mobile-first women-centered community web app homepage for Les Bi Gulf Friends in Next.js App Router. Use a warm lesbian-flag-inspired palette, soft rounded cards, strong typography, and a premium but welcoming feel. Include sections for community values, groups, events, and privacy. Keep it easy to integrate into an existing Next.js + Tina + Supabase project.

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

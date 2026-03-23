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

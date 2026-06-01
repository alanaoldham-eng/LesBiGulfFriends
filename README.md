# v095 Krewe Vibe Patch

Apply order:

1. Run `sql/v095_krewe_vibe.sql` in Supabase.
2. Unzip this patch into your repo root and overwrite files.
3. Run:

```powershell
npm run build
```

Files included:
- `sql/v095_krewe_vibe.sql`
- `lib/kreweVibe.ts`
- `app/krewe-vibe/page.tsx`
- `app/friend-suggestions/page.tsx`
- `components/ClientShell.tsx`

What this implements:
- Seeds the 19 Krewe Vibe questions from the requirements.
- Uses the existing simple `member_questions` and `member_answers` schema.
- Adds RLS policies and performance indexes.
- Adds in-app notifications for existing active members who have not started the questionnaire.
- Adds a highlighted "Complete Krewe Vibe" prompt in navigation/profile menus when incomplete.
- Adds `/krewe-vibe` questionnaire page.
- Adds `/friend-suggestions` matching page.
- Keeps internal scoring hidden from users.

Scoring implemented internally:
- +3 shared community values
- +2 shared event preferences
- +2 compatible communication style
- +1 shared interests
- -5 privacy/conflict red flags

Notes:
- The questionnaire does not alone approve or reject members.
- It is designed to support social observation, gradual trust-building, and moderation.

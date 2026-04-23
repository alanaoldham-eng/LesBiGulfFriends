# v079 patch

Apply:
1. Unzip into repo root and overwrite files
2. Run `npm run build`

Included:
- app/events-app/page.tsx
- app/signup/page.tsx
- components/ReactionRoster.tsx
- PATCH-INSTRUCTIONS.txt

Notes:
- This patch uses the existing `invites` table from your schema for invite bypass logic.
- It uses `lib/eventMedia.ts` for event gallery comments/reactions.
- It does not blindly overwrite your groups page, but includes the exact hover-roster pattern to apply there.

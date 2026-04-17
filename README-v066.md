# v066 root-level patch

This patch is designed to unzip directly into the repo root.

Included:
- `components/ClientShell.tsx`
- `app/confessions/page.tsx`
- `app/profile/page.tsx`

## What it changes
1. Anonymous Confessions are hidden until login
2. Header actions are moved into a hamburger menu
3. Logout moves into a profile dropdown under the user icon
4. Notifications are rendered as a tidier stacked list in the dropdown
5. Profile page shows 2nd and 3rd photos underneath the bio, when present

## Important
This zip does **not** include:
- `package.json`
- `package-lock.json`

## After unzip
1. Merge/overwrite into repo root
2. Run `npm run build`
3. Redeploy

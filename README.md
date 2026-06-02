# v097.4 Landing Podcast Performance Patch

Apply:

```powershell
# unzip into repo root and overwrite files
npm run build
```

Changes:
- Featured Podcasts no longer shows "No featured podcasts yet" while the query is still loading.
- Adds a lightweight loading skeleton for the podcast cards.
- Loads featured podcasts separately from the rest of the landing page data so slower member/reception queries do not block the podcast section.
- Caches featured podcasts in `sessionStorage` so returning to the landing page shows the last loaded podcast list immediately while refreshing in the background.

File changed:
- `app/app/page.tsx`

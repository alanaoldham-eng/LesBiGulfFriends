# v097.3 Featured Podcasts Landing Patch

Apply:

```powershell
# unzip into repo root and overwrite files
npm run build
```

Changes:
- Renames landing page section from "Featured this week" to "Featured Podcasts".
- Shows 5 featured podcast sources on the landing page instead of 2.
- Adds a "Load more podcasts" button when more than 5 featured sources exist.
- Changes empty state copy to "No featured podcasts yet."

File changed:
- `app/app/page.tsx`

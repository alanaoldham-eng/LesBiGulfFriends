# v097.2 Roadmap Build Fix

Apply:

```powershell
# unzip into repo root and overwrite files
npm run build
```

Fix:
- Removes `.catch()` from a Supabase/PostgREST builder chain in `lib/roadmap.ts`.
- Rewrites `getViewerRoleFlags()` so the `admin_users` lookup is handled with normal `try/catch`.

File changed:
- `lib/roadmap.ts`

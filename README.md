# v095.4 Krewe Vibe Redirect Fix

Apply:

```powershell
# unzip into repo root and overwrite files
npm run build
```

Fix:
- After a completed Krewe Vibe save, dismissing the success notice redirects the user to the Main group page.
- If the Main group cannot be found, it falls back to `/groups-app`.

File changed:
- `app/krewe-vibe/page.tsx`

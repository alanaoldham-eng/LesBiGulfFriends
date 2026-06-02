# v095.5 Krewe Vibe Redirect Hard Fix

Apply:

```powershell
# unzip into repo root and overwrite files
npm run build
```

Fix:
- After Krewe Vibe is completed and saved, the page now automatically redirects to the Main group after a short success notice.
- The Dismiss button also redirects.
- Uses `router.push()` plus a `window.location.assign()` fallback in case the modal click timing swallows the client-side navigation.
- If Main group ID cannot be found, fallback is `/groups-app`.

File changed:
- `app/krewe-vibe/page.tsx`

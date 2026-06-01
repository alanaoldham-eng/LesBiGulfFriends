# v095.2 Krewe Vibe Build Fix

Apply:
1. Unzip into repo root and overwrite files.
2. Run:

```powershell
npm run build
```

Fixes:
- `lib/kreweVibe.ts` TypeScript build error:
  - removed `.catch()` from the Supabase RPC builder
  - replaced it with `try/catch` around `await supabase.rpc(...)`
- Changes Krewe Vibe intro text to:
  - `Check compatibility`

# v096.1 Krewe Vibe Syntax Fix

Apply:

```powershell
# unzip into repo root and overwrite files
npm run build
```

Fix:
- Removes the accidental double comma in `lib/kreweVibe.ts`:
  - bad: `},,`
  - fixed: `},`

File changed:
- `lib/kreweVibe.ts`

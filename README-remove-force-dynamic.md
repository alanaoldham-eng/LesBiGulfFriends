# Remove `export const dynamic = "force-dynamic"` from App Router pages

This patch is designed to be unzipped directly into your repo root.

## What it does

It provides a PowerShell script that removes this exact line from **all** `app/**/page.tsx` files:

```ts
export const dynamic = "force-dynamic";
```

It also:
- preserves the rest of each file
- normalizes any accidental triple blank lines back down
- prints each file it changed

## Why

Your build errors have repeatedly pointed at Next.js prerender/export internals.
The fastest repo-wide cleanup is to remove this line from all App Router page components and rebuild.

## How to use

From repo root in PowerShell:

```powershell
.\scripts\remove-force-dynamic-from-pages.ps1
Remove-Item -Recurse -Force .next
npm run build
```

## Safety

The script creates a `.bak` backup next to each changed file before writing the cleaned file.
Once your build is green, you can delete the `.bak` files.

# Dynamic route params null-fix patch

This patch fixes the remaining dynamic route pages identified by your PowerShell search.

Included:
- `app/groups-app/[groupId]/page.tsx`
- `app/members/[id]/page.tsx`
- `app/waiting-room/[candidateId]/page.tsx`

Notes:
- Your `app/reset-password/page.tsx` search hits are for `URLSearchParams.get(...)`, not `useParams()`, so that file does **not** need this fix.
- Each patched page now uses:
  - `const value = params?.value || ""`
  - guards before data loading or actions when the param is empty

After unzip:
1. Merge into repo root
2. Overwrite matching files
3. Run:
   `npm run build`

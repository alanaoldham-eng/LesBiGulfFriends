# Roleplay dynamic route fix patch

This root-level patch fixes the current TypeScript build error in:

- `app/games/roleplay/[sessionId]/page.tsx`

It also applies the same null-safe dynamic-route pattern used in the other patched pages:

- `const value = params?.value || ""`
- guard before data loading if the param is empty

## What this fixes
Current error:
`'params' is possibly 'null'`

## After unzip
1. Merge into repo root
2. Overwrite matching files
3. Run:

```powershell
npm run build
```

## If another dynamic route fails
Patch it with the same pattern:
```tsx
const params = useParams<{ someId: string }>();
const someId = params?.someId || "";

useEffect(() => {
  if (!someId) return;
  // load data
}, [someId]);
```

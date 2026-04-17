# Dynamic route fixes patch

This root-level patch fixes dynamic route pages that were failing TypeScript builds because
`useParams()` can be treated as nullable in App Router type checks.

Included:
- `app/confessions/[postId]/page.tsx`
- `app/content/[sourceSlug]/page.tsx`
- `app/games/blind-chat/[sessionId]/page.tsx`

What changed:
- `params?.value || ""` null-safe route params
- guards before data loading when param is empty
- corrected `useEffect` structure in confession detail page

After unzip:
1. Merge into repo root
2. Run `npm run build`
3. If another dynamic page fails with the same error, patch it with the same pattern

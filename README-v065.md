# v065 root-level patch

This patch package is designed to unzip directly into the repo root.

Included:
- `app/forgot-password/page.tsx` updated reset-email flow
- `app/reset-password/page.tsx` new reset-password screen
- `components/groups/GroupThreadView.tsx` nested replies + inline reply box + pagination
- `lib/groupThreads.ts` group thread helpers
- `sql/v065_admin_users_recursion_fix.sql` confession/admin_users recursion fix
- `sql/v065_group_messages_order_and_main_group.sql` optional SQL helpers

## Important
This package does **not** include `package.json` or `package-lock.json`.

## After unzip
1. Merge/overwrite files into repo root
2. Run the SQL files if needed
3. Wire `GroupThreadView` into your active group detail page
4. Add a link to `/forgot-password` from login if needed
5. Deploy

## Group page wiring
Import:

```ts
import GroupThreadView from "../../../components/groups/GroupThreadView";
```

or adjust path based on your route depth.

Render:

```tsx
<GroupThreadView
  groupId={group.id}
  groupName={group.name}
  currentUserId={currentUser.id}
/>
```

## Notes
- The composer placeholder rules are:
  - first top-level post: `Introduce yourself to the group`
  - later top-level posts: `Post to <group name>`
  - replies: `Reply here`
- Top-level posts are newest-first
- Replies are nested under their parent and oldest-first within each thread
- Pagination is `Load more posts`

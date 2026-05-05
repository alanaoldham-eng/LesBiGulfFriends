# v088.1 Remove Button Build Fix

This patch fixes `app/groups-app/[groupId]/page.tsx`.

The previous patch accidentally placed `removeAndBanMember` and `visibleMessages`
at the top level of the module, outside the React component. This moved
`removeAndBanMember` inside `GroupThreadPage`, where `removeTargetUserId`,
`setStatus`, `refresh`, and `me` exist.

Apply:
1. Unzip into your repo root and overwrite files.
2. Run `npm run build`.

If you have not already run the v088 SQL, run it first.

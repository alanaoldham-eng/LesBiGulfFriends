# v094 Performance Patch

Apply order:

1. Run `sql/v094_performance_indexes_and_rpcs.sql` in Supabase.
2. Unzip this patch into your repo root and overwrite files.
3. Run:

```powershell
npm run build
```

What v094 fixes:

## Database
- Adds corrected indexes for the slow Supabase queries.
- Uses `starts_at`, not `start_at`.
- Uses `invitee_user_id`, not `user_id`, for `event_invites`.
- Uses `recipient_user_id`, not `user_id`, for `in_app_notifications`.

## N+1 fixes
- `listFriends()` now uses `get_friends_with_latest_message_rpc()`.
  - This removes the old pattern where the Messages page loaded one latest-message query per friend.
- `getIncomingFriendRequests()` now uses `get_incoming_friend_requests_rpc()`.
  - This avoids loading all friend requests and filtering client-side.
- `listGroupMembers()` now uses `get_group_members_with_profiles_rpc()`.
  - This returns group member rows and profile data in one DB call.
- `getPublicAndMemberGroups()` now uses `get_public_and_member_groups_rpc()`.
  - This collapses public groups, member groups, and latest group activity into one DB call.

## Payload reduction
- Group/event message fetch limits reduced from 300 to 75 to reduce initial page payload.

## Safety
Each optimized function includes a fallback to the previous query path if the SQL RPC has not been applied yet.

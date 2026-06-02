# v097.6 Member Profile Performance Patch

Apply order:

1. Run in Supabase:

```sql
sql/v097_6_member_profile_performance.sql
```

2. Unzip this patch into your repo root and overwrite files.

3. Build:

```powershell
npm run build
```

## What this fixes

### Confusing unavailable flash

The member profile page used `profile === null` both for:
- "still loading"
- "member unavailable"

That made users briefly see:

> Member unavailable  
> This profile is no longer available.

even when the member existed.

v097.6 adds a real loading state and only shows "Member unavailable" after the profile lookup finishes and confirms the member is gone, banned, or removed.

### Faster profile opening

Before, the page waited for all of this before showing the profile:
- current user
- target member profile
- all friend IDs
- badges
- current user's profile

After, it shows the member profile as soon as the profile query completes.

Then it loads these in the background:
- friendship status
- badges
- current user's display name for friend-request email

### Faster friendship check

Before, the page loaded all friends and profile records just to know if this one member is a friend.

v097.6 adds a focused friendship query:
- checks one friendship pair only
- uses new indexes on both friendship directions

## Files included

- `sql/v097_6_member_profile_performance.sql`
- `lib/memberProfile.ts`
- `app/members/[id]/page.tsx`

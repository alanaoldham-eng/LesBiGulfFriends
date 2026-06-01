# v095.3 Krewe Vibe Permissions + Hint Removal

Apply order:

1. Run this in Supabase:

```sql
sql/v095_3_krewe_vibe_permissions.sql
```

2. Unzip into repo root and overwrite files.

3. Build:

```powershell
npm run build
```

Fixes:

## Save error
Fixes:

```text
permission denied for table member_questions
```

The issue was database permissions. RLS policies existed, but authenticated users also need table privileges.

## Removes answer hints
The Krewe Vibe page no longer displays helper text that revealed the “good” answers. The internal scoring logic still remains hidden.

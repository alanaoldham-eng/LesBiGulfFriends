# Les Bi Gulf Friends v061 overlay package

This overlay is designed to be copied on top of your current `v060` repo.

Included:
- group member standings visibility fix via Supabase SQL
- curated content web pages
- anonymous confessions web pages
- blind chat web pages
- expanded games hub with:
  - This or That
  - Daily Prompt
  - Hot Takes
- homepage links/cards for the new web roadmap features
- member nav links for Curated Content and Confessions

## Apply order
1. Copy these files into your repo.
2. Run the SQL migration in `sql/supabase-v061-web-roadmap.sql`.
3. Deploy.

## Important note
The group standings bug is most likely caused by RLS on `group_members`, not by the React page itself.
The included SQL fixes the select policy so all visible group members are returned to authenticated users.

# v084.1 DB export fix

This restores the missing availability exports in `lib/db.ts` while keeping the v084 fixes for:
- public event visibility through `listMyEvents`
- election badge label display through `listBadgesForUser`
- vote badge creation through `castProposalVote`

Apply by unzipping into repo root and overwriting `lib/db.ts`, then run:

```powershell
npm run build
```

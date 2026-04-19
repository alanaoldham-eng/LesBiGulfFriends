# V070 integration checklist

## Events page
Add these capabilities:
- event owner can edit title, description, starts_at, location
- create/edit event can upload cover image via `uploadEventAsset`
- create/edit event can set `link_url`
- public event create calls `/api/events/invite` with mode `public`
- private event create/edit can invite selected friends via `/api/events/invite` with mode `private`
- event detail page shows gallery from `listEventMedia`
- event check-in calls `checkInToEventWithRewards`

## Groups page
Add author-only edit button for group messages and replies:
- use `editGroupMessageByAuthor`

## Event messages
Add author-only edit button:
- use `editEventMessageByAuthor`

## Warning Wall
Add:
- confirmation checkbox before posting
- optional photo upload through `uploadWarningWallPhoto`
- report button calling `reportWarningWallPost`
- moderator/admin hide toggle calling `setWarningWallHidden`

## Anti-abuse policy choices already reflected
- event invite emails are opt-in via `notification_settings.email_event_invites`
- event karma is capped:
  - 1st event check-in today = 3
  - 2nd = 1
  - 3rd+ = 0
- duplicate event check-ins blocked by unique index
- author-only message editing

# v081 event and groups integration

This package includes full reusable pieces and the Invite Friends page.

## Events page

Add imports:
```tsx
import { StatusModal } from "../../components/StatusModal";
import { DeleteReasonModal } from "../../components/DeleteReasonModal";
import { ReactionRoster } from "../../components/ReactionRoster";
import { PlayableVideo } from "../../components/PlayableVideo";
import { softRemoveContent } from "../../lib/contentModeration";
```

Add state:
```tsx
const [mediaVisibleCount, setMediaVisibleCount] = useState(3);
const [deleteTarget, setDeleteTarget] = useState<{ type: "event_media" | "event_messages"; id: string } | null>(null);
```

Gate future event actions:
```tsx
const selectedEventStarted = selectedEvent
  ? new Date(selectedEvent.starts_at).getTime() <= Date.now()
  : false;
```

Check-in, gallery upload, and award badge should only render when `selectedEventStarted` is true. Event gallery should use `visibleMedia = activeMedia.slice(0, mediaVisibleCount)` and show Load More in groups of 3.

Video rendering:
```tsx
<PlayableVideo src={item.media_url} type={item.media_type} />
```

Soft-delete event media:
```tsx
await softRemoveContent("event_media", item.id, reason);
```

## Groups page
Use `ReactionRoster` anywhere reaction emoji buttons exist, and soft-delete group messages with:
```tsx
await softRemoveContent("group_messages", message.id, reason);
```

"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ClientShell } from "../../components/ClientShell";
import { StatusModal } from "../../components/StatusModal";
import { DeleteReasonModal } from "../../components/DeleteReasonModal";
import { PlayableVideo } from "../../components/PlayableVideo";
import { EmptyState } from "../../components/EmptyState";
import { ReactionRoster } from "../../components/ReactionRoster";
import { getCurrentUser } from "../../lib/auth";
import {
  createEvent,
  listMyEvents,
  listEventInvites,
  getMyProfile,
  updateEventInviteStatus,
  listEventMessagesDetailed,
  sendEventMessage,
  uploadPublicImage,
  reactToEventMessage,
  getFriendIds,
  sendFriendRequest,
  listFriends,
  listBadgesForUser,
} from "../../lib/db";
import {
  attachEventMedia,
  awardEventBadgeToUser,
  checkInToEventWithRewards,
  updateEventByOwner,
  uploadEventAsset,
} from "../../lib/eventFeatures";
import { editEventMessageByAuthor } from "../../lib/messageEditing";
import { getViewerRoleFlags } from "../../lib/roadmap";
import { canEditPastEventMistake, deleteEventByOwner } from "../../lib/eventCrud";
import { supabase } from "../../lib/supabase/client";
import { addEventMediaComment, listEventMediaBundle, toggleEventMediaReaction } from "../../lib/eventMedia";
import { softRemoveContent } from "../../lib/contentModeration";

const EMOJIS = ["❤️", "👍", "😂", "🔥", "👏"];
const REACT_SMALL: React.CSSProperties = {
  padding: "6px 8px",
  borderRadius: 10,
  border: "1px solid #f1dfe8",
  background: "#fff",
  fontSize: 12,
  lineHeight: 1.1,
  cursor: "pointer",
  whiteSpace: "nowrap",
};

function EventMessageCard({
  m,
  me,
  canReview,
  friendIds,
  onAddFriend,
  onReply,
  onReact,
  onEditStart,
  isEditing,
  editBody,
  setEditBody,
  onEditSave,
  onEditCancel,
  onRemove,
}: any) {
  const mainPhoto = m.profile?.photo_urls?.[0] || m.profile?.photo_url || null;
  const isFriend = friendIds.has(m.sender_id);
  const grouped = new Map<string, any[]>();
  (m.reactions || []).forEach((r: any) => grouped.set(r.emoji, [...(grouped.get(r.emoji) || []), r]));
  


  return (
    <div style={{ marginBottom: 14, paddingLeft: m.parent_message_id ? 20 : 0, borderLeft: m.parent_message_id ? "3px solid #f1dfe8" : "none" }}>
      <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
        {mainPhoto ? (
          <img
            src={mainPhoto}
            alt={m.profile?.display_name || "Member"}
            loading="lazy"
            style={{ width: 38, height: 38, borderRadius: 999, objectFit: "cover", border: "1px solid #ead5df" }}
          />
        ) : null}

        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
            <Link href={`/members/${m.sender_id}`} style={{ color: "#8d2d5d", fontWeight: 700 }}>
              {m.sender_id === me ? "You" : (m.profile?.display_name || m.sender_id)}
            </Link>
            {m.sender_id !== me && !isFriend ? <button style={REACT_SMALL} onClick={() => onAddFriend(m.sender_id)}>Add Friend</button> : null}
            {m.sender_id === me ? <button style={REACT_SMALL} onClick={() => onEditStart(m)}>Edit</button> : null}
            {m.edited_at ? <span style={{ opacity: 0.55, fontSize: 12 }}>edited</span> : null}
          </div>

          {isEditing ? (
            <div style={{ marginTop: 10, display: "grid", gap: 10, border: "1px solid #f1dfe8", borderRadius: 14, padding: 10, background: "#fffafc" }}>
              <textarea
                value={editBody}
                onChange={(e) => setEditBody(e.target.value)}
                style={{ minHeight: 90, padding: "12px 14px", borderRadius: 12, border: "1px solid #d7a8bf", fontSize: 15 }}
              />
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <button className="button" onClick={() => onEditSave(m.id)}>Save edit</button>
                <button className="button secondary" onClick={onEditCancel}>Cancel</button>
              </div>
            </div>
          ) : (
            <>
              {m.body ? <div style={{ marginTop: 4, whiteSpace: "pre-wrap" }}>{m.body}</div> : null}
              {m.link_url ? <div style={{ marginTop: 6 }}><a href={m.link_url} target="_blank" rel="noreferrer" style={{ color: "#8d2d5d", textDecoration: "underline" }}>{m.link_url}</a></div> : null}
              {m.media_url ? (
                <div style={{ marginTop: 8 }}>
                  {String(m.media_type || "").startsWith("image/") ? (
                    <img src={m.media_url} alt="Attachment" loading="lazy" style={{ maxWidth: "100%", borderRadius: 14, border: "1px solid #ead5df" }} />
                  ) : (
                    <a href={m.media_url} target="_blank" rel="noreferrer" style={{ color: "#8d2d5d", textDecoration: "underline" }}>
                      Open attachment
                    </a>
                  )}
                </div>
              ) : null}
            </>
          )}

          <div style={{ display: "flex", gap: 6, flexWrap: "nowrap", overflowX: "auto", marginTop: 8 }}>
            <button style={REACT_SMALL} onClick={() => onReply(m.id)}>Reply</button>
            {EMOJIS.map((emoji) => (
              <ReactionRoster
                key={emoji}
                emoji={emoji}
                reactions={grouped.get(emoji) || []}
                onReact={() => onReact(m.id, emoji)}
                buttonStyle={REACT_SMALL}
              />
            ))}
              {m.media_url && (m.sender_id === me || canReview) ? (
              <button type="button" style={REACT_SMALL} onClick={() => onRemove(m.id)} title="Remove content">
                🗑
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

function EventMediaCard({ item, me, eventId, onRefresh, statusSetter, canRemove, onRemove }: any) {
  const [comment, setComment] = useState("");
  const grouped = new Map<string, any[]>();
  (item.reactions || []).forEach((r: any) => grouped.set(r.emoji, [...(grouped.get(r.emoji) || []), r]));

  const react = async (emoji: string) => {
    try {
      await toggleEventMediaReaction(eventId, item.id, me, emoji);
      await onRefresh();
    } catch (e: any) {
      statusSetter(e.message || "Unable to react to media.");
    }
  };

  const sendComment = async () => {
    try {
      await addEventMediaComment(eventId, item.id, me, comment);
      setComment("");
      await onRefresh();
    } catch (e: any) {
      statusSetter(e.message || "Unable to comment on media.");
    }
  };

  return (
    <div style={{ border: "1px solid #f1dfe8", borderRadius: 16, padding: 10, background: "#fff" }}>
      {String(item.media_type || "").startsWith("image/") ? (
        <img src={item.media_url} alt="Event media" loading="lazy" style={{ width: "100%", borderRadius: 12, objectFit: "cover" }} />
      ) : (
        <PlayableVideo src={item.media_url} type={item.media_type} />
      )}

      <div style={{ marginTop: 8, fontSize: 12, opacity: 0.75 }}>
        Uploaded by {item.profile?.display_name || "member"}
      </div>

      <div style={{ display: "flex", gap: 6, flexWrap: "nowrap", overflowX: "auto", marginTop: 8 }}>
        {EMOJIS.map((emoji) => (
          <ReactionRoster
            key={emoji}
            emoji={emoji}
            reactions={grouped.get(emoji) || []}
            onReact={() => react(emoji)}
            buttonStyle={REACT_SMALL}
          />
        ))}
        {canRemove ? (
          <button type="button" style={REACT_SMALL} onClick={() => onRemove(item.id)} title="Remove media">
            🗑
          </button>
        ) : null}
      </div>

      <div style={{ marginTop: 10, display: "grid", gap: 8 }}>
        {(item.comments || []).map((c: any) => (
          <div key={c.id} style={{ borderTop: "1px solid #f5e8ef", paddingTop: 8, fontSize: 13 }}>
            <strong>
              <Link href={`/members/${c.user_id}`} style={{ color: "#8d2d5d", textDecoration: "none" }}>
                {c.profile?.display_name || "Member"}
              </Link>
            </strong>
            {": "} {c.body}
          </div>
        ))}

        <div style={{ display: "grid", gap: 6 }}>
          <input
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Comment on this photo or video"
            style={{ padding: "10px 12px", borderRadius: 12, border: "1px solid #d7a8bf", fontSize: 14 }}
          />
          <button style={REACT_SMALL} onClick={sendComment}>Comment</button>
        </div>
      </div>
    </div>
  );
}

export default function EventsAppPage() {
  const [me, setMe] = useState("");
  const [displayName, setDisplayName] = useState("A member");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [location, setLocation] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [friends, setFriends] = useState<any[]>([]);
  const [selectedFriendIds, setSelectedFriendIds] = useState<string[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<any | null>(null);
  const [inviteEmail, setInviteEmail] = useState("");
  const [eventInvites, setEventInvites] = useState<any[]>([]);
  const [eventMessages, setEventMessages] = useState<any[]>([]);
  const [eventMedia, setEventMedia] = useState<any[]>([]);
  const [friendIds, setFriendIds] = useState<Set<string>>(new Set());
  const [body, setBody] = useState("");
  const [messageLinkUrl, setMessageLinkUrl] = useState("");
  const [attachment, setAttachment] = useState<File | null>(null);
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [checkInFile, setCheckInFile] = useState<File | null>(null);
  const [galleryFile, setGalleryFile] = useState<File | null>(null);
  const [status, setStatus] = useState("");
  const [karmaPoints, setKarmaPoints] = useState(0);
  const [canReview, setCanReview] = useState(false);
  const [formMode, setFormMode] = useState<"closed" | "create" | "edit">("closed");
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingMessageBody, setEditingMessageBody] = useState("");
  const [awardUserId, setAwardUserId] = useState("");
  const [awardOptions, setAwardOptions] = useState<any[]>([]);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [mediaVisibleCount, setMediaVisibleCount] = useState(3);
  const [deleteTarget, setDeleteTarget] = useState<{ type: "event_media" | "event_messages"; id: string } | null>(null);


  const nowTs = Date.now();
  const selectedEventDateLabel = useMemo(() => selectedEvent?.starts_at ? new Date(selectedEvent.starts_at).toLocaleDateString() : "", [selectedEvent]);
  const upcomingEvents = useMemo(
    () => [...events].filter((ev: any) => new Date(ev.starts_at).getTime() >= nowTs).sort((a: any, b: any) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime()),
    [events, nowTs]
  );
  const pastEvents = useMemo(
    () => [...events].filter((ev: any) => new Date(ev.starts_at).getTime() < nowTs).sort((a: any, b: any) => new Date(b.starts_at).getTime() - new Date(a.starts_at).getTime()),
    [events, nowTs]
  );

  const selectedEventIsPast = selectedEvent ? new Date(selectedEvent.starts_at).getTime() < nowTs : false;
  const selectedEventStarted = selectedEvent ? new Date(selectedEvent.starts_at).getTime() <= nowTs : false;
  const activeEventMedia = useMemo(() => (eventMedia || []).filter((item: any) => item.moderation_status !== "removed"), [eventMedia]);
  const visibleEventMedia = useMemo(() => activeEventMedia.slice(0, mediaVisibleCount), [activeEventMedia, mediaVisibleCount]);

  const clearForm = () => {
    setTitle("");
    setDescription("");
    setStartsAt("");
    setLocation("");
    setLinkUrl("");
    setIsPublic(true);
    setCoverFile(null);
    setSelectedFriendIds([]);
  };

  const refreshEvents = async (uid: string) => {
    const [rows, profile, fids, friendRows, roleFlags] = await Promise.all([
      listMyEvents(uid).catch(() => []),
      getMyProfile(uid).catch(() => null),
      getFriendIds(uid).catch(() => new Set<string>()),
      listFriends(uid).catch(() => []),
      getViewerRoleFlags(uid).catch(() => ({ canReview: false })),
    ]);
    setEvents(rows);
    setDisplayName(profile?.display_name || "A member");
    setKarmaPoints(Number(profile?.karma_points || 0));
    setFriendIds(fids);
    setFriends(friendRows || []);
    setCanReview(!!roleFlags?.canReview);
  };

  useEffect(() => {
    (async () => {
      const user = await getCurrentUser().catch(() => null);
      if (!user) return;
      setMe(user.id);
      await refreshEvents(user.id);
    })();
  }, []);

  const loadAwardOptions = async () => {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, display_name")
      .order("display_name", { ascending: true })
      .limit(500);

    setAwardOptions((profiles || []).map((p: any) => ({ id: p.id, label: p.display_name || p.id })));
  };

  const refreshSelectedEventDetails = async (eventId?: string) => {
    const id = eventId || selectedEvent?.id;
    if (!id) return;
    setLoadingDetails(true);
    const [invs, msgs, media] = await Promise.all([
      listEventInvites(id).catch(() => []),
      listEventMessagesDetailed(id).catch(() => []),
      listEventMediaBundle(id).catch(() => []),
      loadAwardOptions(),
    ]);
    setEventInvites(invs);
    setEventMessages(msgs);
    setEventMedia(media);
    setLoadingDetails(false);
  };

  const openEvent = async (ev: any) => {
    setSelectedEvent(ev);
    setEditingMessageId(null);
    setEditingMessageBody("");
    setEventInvites([]);
    setEventMessages([]);
    setEventMedia([]);
    setMediaVisibleCount(3);
    setStatus("");
    setTimeout(() => { refreshSelectedEventDetails(ev.id); }, 0);
  };

  const openCreate = () => {
    clearForm();
    setSelectedEvent(null);
    setFormMode("create");
  };

  const openEdit = async (ev: any) => {
    setSelectedEvent(ev);
    setTitle(ev.title || "");
    setDescription(ev.description || "");
    setStartsAt(ev.starts_at ? String(ev.starts_at).slice(0, 16) : "");
    setLocation(ev.location || "");
    setLinkUrl(ev.link_url || "");
    setIsPublic(ev.is_public ?? true);
    setCoverFile(null);
    setSelectedFriendIds([]);
    setFormMode("edit");
    await openEvent(ev);
  };

  const createOrUpdate = async () => {
    if (!me || !title.trim() || !startsAt) return;

    try {
      let coverImageUrl: string | null = selectedEvent?.cover_image_url || null;
      if (coverFile) {
        const uploaded = await uploadEventAsset(me, coverFile);
        coverImageUrl = uploaded.url;
      }

      if (formMode === "edit" && selectedEvent?.id) {
        await updateEventByOwner(selectedEvent.id, me, {
          title,
          description: description || null,
          starts_at: startsAt,
          location: location || null,
          cover_image_url: coverImageUrl,
          link_url: linkUrl || null,
          is_public: isPublic,
        });
        setStatus("Event updated.");
      } else {
        const ev = await createEvent({
          title,
          description,
          starts_at: startsAt,
          location,
          created_by: me,
        });

        await updateEventByOwner(ev.id, me, {
          cover_image_url: coverImageUrl,
          link_url: linkUrl || null,
          is_public: isPublic,
        });

        if (isPublic) {
          await fetch("/api/events/invite", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ mode: "public", eventId: ev.id, ownerId: me }),
          });
        } else if (selectedFriendIds.length) {
          await fetch("/api/events/invite", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ mode: "private", eventId: ev.id, ownerId: me, friendIds: selectedFriendIds }),
          });
        }

        setStatus("Event created.");
      }

      clearForm();
      setFormMode("closed");
      await refreshEvents(me);
    } catch (e: any) {
      setStatus(e.message || "Unable to save event.");
    }
  };

  const deleteEvent = async (eventId: string) => {
    try {
      await deleteEventByOwner(eventId, me);
      if (selectedEvent?.id === eventId) {
        setSelectedEvent(null);
        setEventInvites([]);
        setEventMessages([]);
        setEventMedia([]);
      }
      await refreshEvents(me);
      setStatus("Event deleted.");
    } catch (e: any) {
      setStatus(e.message || "Unable to delete event.");
    }
  };

  const sendEventInviteEmail = async (email: string, eventTitle: string, eventStartsAt: string, eventLocation: string) => {
    const res = await fetch("/api/events/send-invite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ inviteeEmail: email, inviterName: displayName, eventTitle, startsAt: eventStartsAt, location: eventLocation }),
    });
    const data = await res.json();
    return { ok: res.ok, ...data };
  };

  const inviteSingle = async () => {
    if (!selectedEvent || !inviteEmail.trim() || selectedEventIsPast) return;
    try {
      const localRow = await sendEventInviteEmail(inviteEmail.trim(), selectedEvent.title, selectedEvent.starts_at, selectedEvent.location || "");
      setStatus(localRow.ok ? "Invite email sent." : localRow.error || "Invite email failed.");
      setInviteEmail("");
      await refreshSelectedEventDetails();
    } catch (e: any) {
      setStatus(e.message || "Unable to send event invite.");
    }
  };

  const retryEventInvite = async (row: any) => {
    if (!selectedEvent || selectedEventIsPast) return;
    const sendResult = await sendEventInviteEmail(row.invitee_email, selectedEvent.title, selectedEvent.starts_at, selectedEvent.location || "");
    if (!sendResult.ok) {
      await updateEventInviteStatus(row.id, "failed", null, sendResult.error || "Unable to send email", null);
      setStatus(sendResult.error || "Retry failed.");
    } else {
      await updateEventInviteStatus(row.id, "sent", sendResult.sentAt, null, sendResult.resendMessageId || null);
      setStatus("Event invite email sent.");
    }
    await refreshSelectedEventDetails();
  };

  const sendMessage = async () => {
    if (!selectedEvent || (!body.trim() && !messageLinkUrl.trim() && !attachment)) return;

    try {
      let mediaUrl: string | null = null;
      let mediaType: string | null = null;

      if (attachment) {
        mediaUrl = await uploadPublicImage("chat-media", me, attachment);
        mediaType = attachment.type || "application/octet-stream";
      }

      await sendEventMessage(
        selectedEvent.id,
        me,
        body.trim(),
        replyTo,
        mediaUrl,
        mediaType,
        messageLinkUrl.trim() || null
      );

      setBody("");
      setMessageLinkUrl("");
      setAttachment(null);
      setReplyTo(null);
      await refreshSelectedEventDetails();
    } catch (e: any) {
      setStatus(e.message || "Unable to send event message.");
    }
  };

  const saveEditMessage = async (messageId: string) => {
    try {
      await editEventMessageByAuthor(messageId, me, editingMessageBody);
      setEditingMessageId(null);
      setEditingMessageBody("");
      await refreshSelectedEventDetails();
      setStatus("Message updated.");
    } catch (e: any) {
      setStatus(e.message || "Unable to edit event message.");
    }
  };

  const reactToMessage = async (messageId: string, emoji: string) => {
    if (!selectedEvent) return;
    try {
      await reactToEventMessage(selectedEvent.id, messageId, me, emoji);
      await refreshSelectedEventDetails();
    } catch (e: any) {
      setStatus(e.message || "Unable to react.");
    }
  };



  const addFriend = async (userId: string) => {
    try {
      const result: any = await sendFriendRequest(me, userId);
      setStatus(result?.duplicate ? "Friend request already pending." : "Friend request sent.");
      if (!result?.duplicate) setFriendIds(new Set<string>([...Array.from(friendIds), userId]));
    } catch (e: any) {
      setStatus(e.message || "Unable to send friend request.");
    }
  };

  const uploadGallery = async () => {
    if (!selectedEvent || !galleryFile || !selectedEventStarted) return;
    try {
      await attachEventMedia(selectedEvent.id, me, galleryFile);
      setGalleryFile(null);
      await refreshSelectedEventDetails();
      setStatus("Event media uploaded.");
    } catch (e: any) {
      setStatus(e.message || "Unable to upload event media.");
    }
  };

  const checkIn = async () => {
    if (!selectedEvent || !selectedEventStarted) return;
    try {
      const result = await checkInToEventWithRewards({
        eventId: selectedEvent.id,
        userId: me,
        eventName: selectedEvent.title,
        eventDate: selectedEventDateLabel,
        file: checkInFile,
      });
      setCheckInFile(null);
      await refreshSelectedEventDetails();
      setStatus(result.reward > 0 ? `Checked in. Earned ${result.reward} karma.` : "Checked in. Daily karma cap reached.");
    } catch (e: any) {
      setStatus(e.message || "Unable to check in.");
    }
  };

  const removeSelectedContent = async (reason: string) => {
    if (!deleteTarget) return;

    try {
      await softRemoveContent(deleteTarget.type, deleteTarget.id, reason);
      setDeleteTarget(null);
      setStatus("Content removed from the website and logged.");
      await refreshSelectedEventDetails();
    } catch (e: any) {
      setStatus(e.message || "Unable to remove content.");
    }
    
  };
  const awardBadge = async () => {
    if (!selectedEvent || !awardUserId.trim() || !canReview) return;
    try {
      const existing = await listBadgesForUser(awardUserId).catch(() => []);
      const badgeLabel = `Attended ${selectedEvent.title} • ${selectedEventDateLabel}`;
      const already = (existing || []).some((b: any) => b.badge_key === "event_attended" && b.badge_label === badgeLabel);
      if (already) {
        setStatus("That user already has that badge.");
        return;
      }

      await awardEventBadgeToUser({
        userId: awardUserId.trim(),
        eventName: selectedEvent.title,
        eventDate: selectedEventDateLabel,
        awardedBy: me,
      });
      setAwardUserId("");
      setStatus("Event badge awarded.");
    } catch (e: any) {
      setStatus(e.message || "Unable to award event badge.");
    }
  };

  const renderEventList = (rows: any[], emptyText: string, kind: "upcoming" | "past") =>
    rows.length ? rows.map((ev: any) => {
      const allowPastFixEdit = kind === "past" && canEditPastEventMistake(ev);
      return (
        <div key={ev.id} style={{ borderBottom: "1px solid #f1dfe8", padding: "10px 0" }}>
          <strong>{ev.title}</strong>
          <div style={{ opacity: 0.8 }}>{new Date(ev.starts_at).toLocaleString()}</div>
          <div style={{ marginTop: 8, display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button className="button secondary" onClick={() => openEvent(ev)}>Open event</button>
            {kind === "upcoming" && ev.created_by === me ? <button className="button secondary" onClick={() => openEdit(ev)}>Edit event</button> : null}
            {kind === "upcoming" && ev.created_by === me ? <button className="button secondary" onClick={() => deleteEvent(ev.id)}>Delete event</button> : null}
            {allowPastFixEdit && ev.created_by === me ? <button className="button secondary" onClick={() => openEdit(ev)}>Edit event</button> : null}
          </div>
        </div>
      );
    }) : <p style={{ margin: 0, opacity: 0.8 }}>{emptyText}</p>;

  return (
    <ClientShell>
      <section className="hero">
        <h1 style={{ margin: 0, fontSize: 30 }}>Events</h1>
        <p style={{ fontSize: 16, lineHeight: 1.6, opacity: 0.9 }}>
          Upcoming events are shown first, then create a new event, then review past events. Open any event to view and upload event media.
        </p>
      </section>

      <div className="grid">
        <section style={{ border: "1px solid #e9d7e2", borderRadius: 20, padding: 16, background: "#fff" }}>
          <h3 style={{ marginTop: 0 }}>Upcoming Events</h3>
          {renderEventList(upcomingEvents, "No upcoming events yet.", "upcoming")}
        </section>

        <section style={{ border: "1px solid #e9d7e2", borderRadius: 20, padding: 16, background: "#fff" }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            <h3 style={{ marginTop: 0, marginBottom: 0 }}>{formMode === "edit" ? "Edit event" : "Create event"}</h3>
            {karmaPoints >= 1 && formMode === "closed" ? <button className="button" onClick={openCreate}>Create Event</button> : null}
            {formMode !== "closed" ? <button className="button secondary" onClick={() => { setFormMode("closed"); clearForm(); }}>Close</button> : null}
          </div>

          {formMode !== "closed" ? (
            karmaPoints > 0 || formMode === "edit" ? (
              <div style={{ display: "grid", gap: 12, marginTop: 12 }}>
                <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Event title" style={{ padding: "14px 16px", borderRadius: 16, border: "1px solid #d7a8bf", fontSize: 16 }} />
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description" style={{ minHeight: 100, padding: "14px 16px", borderRadius: 16, border: "1px solid #d7a8bf", fontSize: 16 }} />
                <input type="datetime-local" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} style={{ padding: "14px 16px", borderRadius: 16, border: "1px solid #d7a8bf", fontSize: 16 }} />
                <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Location" style={{ padding: "14px 16px", borderRadius: 16, border: "1px solid #d7a8bf", fontSize: 16 }} />
                <input value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} placeholder="Optional event link" style={{ padding: "14px 16px", borderRadius: 16, border: "1px solid #d7a8bf", fontSize: 16 }} />

                <label style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <input type="checkbox" checked={isPublic} onChange={(e) => setIsPublic(e.target.checked)} />
                  <span>Public event</span>
                </label>

                {!isPublic ? (
                  <div style={{ display: "grid", gap: 8, border: "1px solid #f1dfe8", borderRadius: 16, padding: 12, background: "#fffafc" }}>
                    <strong>Select friends to invite</strong>
                    {friends.length ? friends.map((f: any) => (
                      <label key={f.id} style={{ display: "flex", gap: 10, alignItems: "center" }}>
                        <input
                          type="checkbox"
                          checked={selectedFriendIds.includes(f.id)}
                          onChange={(e) => setSelectedFriendIds((prev) => e.target.checked ? [...prev, f.id] : prev.filter((id) => id !== f.id))}
                        />
                        <span>{f.display_name || f.email || f.id}</span>
                      </label>
                    )) : <div style={{ opacity: 0.75 }}>No friends available yet.</div>}
                  </div>
                ) : null}

                <input type="file" accept="image/*" onChange={(e) => setCoverFile(e.target.files?.[0] || null)} />
                <button className="button" onClick={createOrUpdate} disabled={!me || !title || !startsAt}>
                  {formMode === "edit" ? "Save event" : "Create event"}
                </button>
              </div>
            ) : <EmptyState title="Need 1 karma point" body="Creating an event costs 1 karma point." />
          ) : <p style={{ marginTop: 12, opacity: 0.75 }}>The form stays collapsed until you need it.</p>}
        </section>

        <section style={{ border: "1px solid #e9d7e2", borderRadius: 20, padding: 16, background: "#fff" }}>
          <h3 style={{ marginTop: 0 }}>Past Events</h3>
          {renderEventList(pastEvents, "No past events yet.", "past")}
        </section>

        {selectedEvent ? (
          <section style={{ border: "1px solid #e9d7e2", borderRadius: 20, padding: 16, background: "#fff" }}>
            <h3 style={{ marginTop: 0 }}>{selectedEvent.title}</h3>
            {selectedEvent.cover_image_url ? <img src={selectedEvent.cover_image_url} loading="lazy" alt={selectedEvent.title} style={{ width: "100%", maxWidth: 420, borderRadius: 18, border: "1px solid #ead5df", marginBottom: 12 }} /> : null}
            {selectedEvent.description ? <p style={{ whiteSpace: "pre-wrap", lineHeight: 1.6 }}>{selectedEvent.description}</p> : null}
            {selectedEvent.link_url ? <p><a href={selectedEvent.link_url} target="_blank" rel="noreferrer" style={{ color: "#8d2d5d", textDecoration: "underline" }}>{selectedEvent.link_url}</a></p> : null}
            <p style={{ opacity: 0.8 }}>{new Date(selectedEvent.starts_at).toLocaleString()} • {selectedEvent.location || "Location TBD"}</p>

            {loadingDetails ? <p style={{ opacity: 0.75 }}>Loading event details…</p> : null}

            <div style={{ marginTop: 16, borderTop: "1px solid #f1dfe8", paddingTop: 16, display: "grid", gap: 16 }}>
              <div>
                <h4 style={{ marginTop: 0 }}>Event media</h4>
                {selectedEventStarted ? (
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 10 }}>
                    <input type="file" accept="image/*,video/*" onChange={(e) => setGalleryFile(e.target.files?.[0] || null)} />
                    <button className="button secondary" onClick={uploadGallery} disabled={!galleryFile}>Upload to event gallery</button>
                  </div>
                ) : (
                  <p style={{ marginTop: 0, opacity: 0.75 }}>Gallery uploads open when the event begins.</p>
                )}

                {activeEventMedia.length ? (
                  <>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 12 }}>
                      {visibleEventMedia.map((item: any) => (
                        <EventMediaCard
                          key={item.id}
                          item={item}
                          me={me}
                          eventId={selectedEvent.id}
                          onRefresh={refreshSelectedEventDetails}
                          statusSetter={setStatus}
                          canRemove={canReview || item.user_id === me}
                          onRemove={(id: string) => setDeleteTarget({ type: "event_media", id })}
                        />
                      ))}
                    </div>
                    {activeEventMedia.length > mediaVisibleCount ? (
                      <div style={{ marginTop: 12 }}>
                        <button className="button secondary" onClick={() => setMediaVisibleCount((v) => v + 3)}>Load more</button>
                      </div>
                    ) : null}
                  </>
                ) : <p style={{ margin: 0, opacity: 0.75 }}>No event media yet.</p>}
              </div>

              <div>
                <h4 style={{ marginTop: 0 }}>Check in</h4>
                {selectedEventStarted ? (
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <input type="file" accept="image/*,video/*" onChange={(e) => setCheckInFile(e.target.files?.[0] || null)} />
                    <button className="button" onClick={checkIn}>Check in to event</button>
                  </div>
                ) : (
                  <p style={{ marginTop: 0, opacity: 0.75 }}>Check-in opens when the event begins.</p>
                )}
              </div>

              {!selectedEventIsPast && selectedEvent.created_by === me ? (
                <div>
                  <h4 style={{ marginTop: 0 }}>Invite people</h4>
                  <div style={{ display: "grid", gap: 12 }}>
                    <input type="email" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} placeholder="friend@example.com" style={{ padding: "14px 16px", borderRadius: 16, border: "1px solid #d7a8bf", fontSize: 16 }} />
                    <button className="button secondary" onClick={inviteSingle} disabled={!inviteEmail.trim()}>Send direct invite email</button>
                  </div>

                  <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
                    {eventInvites.length ? eventInvites.map((row: any) => (
                      <div key={row.id} style={{ borderBottom: "1px solid #f1dfe8", padding: "10px 0" }}>
                        <strong>{row.invitee_email}</strong>
                        <div style={{ opacity: 0.8 }}>Status: {row.status}</div>
                        {row.error_message ? <div style={{ opacity: 0.7 }}>Error: {row.error_message}</div> : null}
                        {(row.status === "failed" || row.status === "pending") ? <div style={{ marginTop: 8 }}><button className="button secondary" onClick={() => retryEventInvite(row)}>Retry send</button></div> : null}
                      </div>
                    )) : <p style={{ margin: 0, opacity: 0.8 }}>No event invites yet.</p>}
                  </div>
                </div>
              ) : null}

              {canReview && selectedEventStarted ? (
                <div>
                  <h4 style={{ marginTop: 0 }}>Award event badge</h4>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <select value={awardUserId} onChange={(e) => setAwardUserId(e.target.value)} style={{ padding: "12px 14px", borderRadius: 12, border: "1px solid #d7a8bf", fontSize: 15, background: "#fff" }}>
                      <option value="">Select member</option>
                      {awardOptions.map((opt: any) => <option key={opt.id} value={opt.id}>{opt.label}</option>)}
                    </select>
                    <button className="button secondary" onClick={awardBadge}>Award badge</button>
                  </div>
                </div>
              ) : null}

              <div style={{ borderTop: "1px solid #f1dfe8", paddingTop: 18 }}>
                <h3 style={{ marginTop: 0 }}>Event thread</h3>
                <div style={{ border: "1px solid #f1dfe8", borderRadius: 16, padding: 12, minHeight: 180, background: "#fffafc" }}>
                  {eventMessages.length ? eventMessages.map((m: any) => (
                  <EventMessageCard
                    key={m.id}
                    m={m}
                    me={me}
                    canReview={canReview}
                    friendIds={friendIds}
                    onAddFriend={addFriend}
                    onReply={setReplyTo}
                    onReact={reactToMessage}
                    onEditStart={(msg: any) => {
                      setEditingMessageId(msg.id);
                      setEditingMessageBody(msg.body || "");
                    }}
                    isEditing={editingMessageId === m.id}
                    editBody={editingMessageBody}
                    setEditBody={setEditingMessageBody}
                    onEditSave={saveEditMessage}
                    onEditCancel={() => {
                      setEditingMessageId(null);
                      setEditingMessageBody("");
                    }}
                    onRemove={(messageId: string) =>
                      setDeleteTarget({ type: "event_messages", id: messageId })
                    }
                  />
                  )) : <p style={{ margin: 0, opacity: 0.7 }}>No event messages yet.</p>}
                </div>
                
                <div style={{ display: "grid", gap: 12, marginTop: 12 }}>
                  {replyTo ? <div style={{ opacity: 0.75 }}>Replying to message <code>{replyTo.slice(0, 8)}</code> <button className="button secondary" onClick={() => setReplyTo(null)}>Clear reply</button></div> : null}
                  <textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="Type an event message" style={{ minHeight: 100, padding: "14px 16px", borderRadius: 16, border: "1px solid #d7a8bf", fontSize: 16 }} />
                  <input value={messageLinkUrl} onChange={(e) => setMessageLinkUrl(e.target.value)} placeholder="Optional link" style={{ padding: "14px 16px", borderRadius: 16, border: "1px solid #d7a8bf", fontSize: 16 }} />
                  <input type="file" accept="image/*,.pdf,.doc,.docx,.txt,.zip" onChange={(e) => setAttachment(e.target.files?.[0] || null)} />
                  <button className="button" onClick={sendMessage}>Send to event</button>
                </div>
              </div>
            </div>
          </section>
        ) : null}

      </div>
      <DeleteReasonModal
        open={!!deleteTarget}
        title="Remove event content"
        onCancel={() => setDeleteTarget(null)}
        onConfirm={removeSelectedContent}
      />
      <StatusModal open={!!status} message={status} onClose={() => setStatus("")} />
    </ClientShell>
  );
}

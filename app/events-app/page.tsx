"use client";


import Link from "next/link";
import { useEffect, useState } from "react";
import { ClientShell } from "../../components/ClientShell";
import { EmptyState } from "../../components/EmptyState";
import { getCurrentUser } from "../../lib/auth";
import {
  createEvent,
  listMyEvents,
  createEventInvite,
  listEventInvites,
  getMyProfile,
  updateEventInviteStatus,
  listEventMessagesDetailed,
  sendEventMessage,
  uploadPublicImage,
  reactToEventMessage,
  getFriendIds,
  sendFriendRequest,
} from "../../lib/db";

const EMOJIS = ["❤️", "👍", "😂", "🔥", "👏"];

function EventMessageCard({ m, me, friendIds, onAddFriend, onReply, onReact }: any) {
  const mainPhoto = m.profile?.photo_urls?.[0] || m.profile?.photo_url || null;
  const isFriend = friendIds.has(m.sender_id);
  const grouped = new Map<string, number>();
  (m.reactions || []).forEach((r: any) => grouped.set(r.emoji, (grouped.get(r.emoji) || 0) + 1));
  return (
    <div style={{ marginBottom: 14, paddingLeft: m.parent_message_id ? 20 : 0, borderLeft: m.parent_message_id ? "3px solid #f1dfe8" : "none" }}>
      <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
        {mainPhoto ? <img src={mainPhoto} alt={m.profile?.display_name || "Member"} style={{ width: 38, height: 38, borderRadius: 999, objectFit: "cover", border: "1px solid #ead5df" }} /> : null}
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
            <Link href={`/members/${m.sender_id}`} style={{ color: "#8d2d5d", fontWeight: 700 }}>
              {m.sender_id === me ? "You" : (m.profile?.display_name || m.sender_id)}
            </Link>
            {m.sender_id !== me && !isFriend ? <button className="button secondary" onClick={() => onAddFriend(m.sender_id)}>Add Friend</button> : null}
            {m.parent_message_id ? <span style={{ opacity: 0.6, fontSize: 12 }}>Reply</span> : null}
          </div>
          {m.body ? <div style={{ marginTop: 4, whiteSpace: "pre-wrap" }}>{m.body}</div> : null}
          {m.link_url ? <div style={{ marginTop: 6 }}><a href={m.link_url} target="_blank" rel="noreferrer" style={{ color: "#8d2d5d", textDecoration: "underline" }}>{m.link_url}</a></div> : null}
          {m.media_url ? <div style={{ marginTop: 8 }}>{String(m.media_type || "").startsWith("image/") ? <img src={m.media_url} alt="Attachment" style={{ maxWidth: "100%", borderRadius: 14, border: "1px solid #ead5df" }} /> : <a href={m.media_url} target="_blank" rel="noreferrer" style={{ color: "#8d2d5d", textDecoration: "underline" }}>Open attachment</a>}</div> : null}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 }}>
            <button className="button secondary" onClick={() => onReply(m.id)}>Reply</button>
            {EMOJIS.map((emoji) => <button key={emoji} className="button secondary" onClick={() => onReact(m.id, emoji)}>{emoji} {grouped.get(emoji) || ""}</button>)}
          </div>
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
  const [events, setEvents] = useState<any[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<any | null>(null);
  const [inviteEmail, setInviteEmail] = useState("");
  const [eventInvites, setEventInvites] = useState<any[]>([]);
  const [eventMessages, setEventMessages] = useState<any[]>([]);
  const [friendIds, setFriendIds] = useState<Set<string>>(new Set());
  const [body, setBody] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [attachment, setAttachment] = useState<File | null>(null);
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [status, setStatus] = useState("");
  const [karmaPoints, setKarmaPoints] = useState(0);

  const refreshEvents = async (uid: string) => {
    const rows = await listMyEvents(uid).catch(() => []);
    setEvents(rows);
    if (selectedEvent) {
      const [invs, msgs] = await Promise.all([
        listEventInvites(selectedEvent.id).catch(() => []),
        listEventMessagesDetailed(selectedEvent.id).catch(() => []),
      ]);
      setEventInvites(invs);
      setEventMessages(msgs);
    }
  };

  useEffect(() => {
    const run = async () => {
      const user = await getCurrentUser();
      if (!user) return;
      setMe(user.id);
      const [profile, fids] = await Promise.all([
        getMyProfile(user.id).catch(() => null),
        getFriendIds(user.id).catch(() => new Set<string>()),
      ]);
      setDisplayName(profile?.display_name || "A member");
      setKarmaPoints(Number(profile?.karma_points || 0));
      setFriendIds(fids);
      await refreshEvents(user.id);
    };
    run();
  }, []);

  const create = async () => {
    try {
      const ev = await createEvent({
        title,
        description,
        starts_at: startsAt,
        location,
        created_by: me,
      });
      setTitle("");
      setDescription("");
      setStartsAt("");
      setLocation("");
      setStatus("Event created.");
      await refreshEvents(me);
      setSelectedEvent(ev);
      setEventInvites([]);
      setEventMessages([]);
    } catch (e: any) {
      setStatus(e.message || "Unable to create event.");
    }
  };

  const openEvent = async (ev: any) => {
    setSelectedEvent(ev);
    const [invs, msgs] = await Promise.all([
      listEventInvites(ev.id).catch(() => []),
      listEventMessagesDetailed(ev.id).catch(() => []),
    ]);
    setEventInvites(invs);
    setEventMessages(msgs);
  };

  const sendEventInvite = async (email: string, eventTitle: string, eventStartsAt: string, eventLocation: string) => {
    const res = await fetch("/api/events/send-invite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ inviteeEmail: email, inviterName: displayName, eventTitle, startsAt: eventStartsAt, location: eventLocation }),
    });
    const data = await res.json();
    return { ok: res.ok, ...data };
  };

  const invite = async () => {
    if (!selectedEvent || !inviteEmail.trim()) return;
    try {
      const row = await createEventInvite(selectedEvent.id, me, inviteEmail.trim());
      const sendResult = await sendEventInvite(inviteEmail.trim(), selectedEvent.title, selectedEvent.starts_at, selectedEvent.location || "");
      if (!sendResult.ok) {
        await updateEventInviteStatus(row.id, "failed", null, sendResult.error || "Unable to send email", null);
        setStatus(sendResult.error || "Event invite created, but email failed.");
      } else {
        await updateEventInviteStatus(row.id, "sent", sendResult.sentAt, null, sendResult.resendMessageId || null);
        setStatus("Event invite email sent.");
      }
      setInviteEmail("");
      await openEvent(selectedEvent);
    } catch (e: any) {
      setStatus(e.message || "Unable to send event invite.");
    }
  };

  const retryEventInvite = async (row: any) => {
    const sendResult = await sendEventInvite(row.invitee_email, selectedEvent.title, selectedEvent.starts_at, selectedEvent.location || "");
    if (!sendResult.ok) {
      await updateEventInviteStatus(row.id, "failed", null, sendResult.error || "Unable to send email", null);
      setStatus(sendResult.error || "Retry failed.");
    } else {
      await updateEventInviteStatus(row.id, "sent", sendResult.sentAt, null, sendResult.resendMessageId || null);
      setStatus("Event invite email sent.");
    }
    await openEvent(selectedEvent);
  };

  const sendMessage = async () => {
    if (!selectedEvent || (!body.trim() && !linkUrl.trim() && !attachment)) return;
    try {
      let mediaUrl: string | null = null;
      let mediaType: string | null = null;
      if (attachment) {
        mediaUrl = await uploadPublicImage("chat-media", me, attachment);
        mediaType = attachment.type || "application/octet-stream";
      }
      await sendEventMessage(selectedEvent.id, me, body.trim(), replyTo, mediaUrl, mediaType, linkUrl.trim() || null);
      setBody("");
      setLinkUrl("");
      setAttachment(null);
      setReplyTo(null);
      await openEvent(selectedEvent);
    } catch (e: any) {
      setStatus(e.message || "Unable to send event message.");
    }
  };

  const react = async (messageId: string, emoji: string) => {
    if (!selectedEvent) return;
    try {
      await reactToEventMessage(selectedEvent.id, messageId, me, emoji);
      await openEvent(selectedEvent);
    } catch (e: any) {
      setStatus(e.message || "Unable to react.");
    }
  };

  const addFriend = async (userId: string) => {
    try {
      const result: any = await sendFriendRequest(me, userId);
      setStatus(result?.duplicate ? "Friend request already pending." : "Friend request sent.");
      if (!result?.duplicate) {
        setFriendIds(new Set<string>([...Array.from(friendIds), userId]));
      }
    } catch (e: any) {
      setStatus(e.message || "Unable to send friend request.");
    }
  };

  return (
    <ClientShell>
      <section className="hero">
        <h1 style={{ margin: 0, fontSize: 30 }}>Events</h1>
        <p style={{ fontSize: 16, lineHeight: 1.6, opacity: 0.9 }}>
          Browse your events, invite people by email, and chat in event threads. Creating an event costs 1 karma point.
        </p>
      </section>

      <div className="grid">
        <section style={{ border: "1px solid #e9d7e2", borderRadius: 20, padding: 16, background: "#fff" }}>
          <h3 style={{ marginTop: 0 }}>Create event</h3>
          {karmaPoints > 0 ? (
            <div style={{ display: "grid", gap: 12 }}>
              <input id="event-title" name="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Event title" style={{ padding: "14px 16px", borderRadius: 16, border: "1px solid #d7a8bf", fontSize: 16 }} />
              <textarea id="event-description" name="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description" style={{ minHeight: 100, padding: "14px 16px", borderRadius: 16, border: "1px solid #d7a8bf", fontSize: 16 }} />
              <input id="event-starts-at" name="startsAt" type="datetime-local" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} style={{ padding: "14px 16px", borderRadius: 16, border: "1px solid #d7a8bf", fontSize: 16 }} />
              <input id="event-location" name="location" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Location" style={{ padding: "14px 16px", borderRadius: 16, border: "1px solid #d7a8bf", fontSize: 16 }} />
              <div style={{ opacity: 0.75 }}>Karma available: {karmaPoints}</div>
              <button className="button" onClick={create} disabled={!me || !title || !startsAt}>Create event</button>
            </div>
          ) : (
            <EmptyState title="Need 1 karma point" body="Creating an event costs 1 karma point. You can still view your existing events below." />
          )}
        </section>

        <section style={{ border: "1px solid #e9d7e2", borderRadius: 20, padding: 16, background: "#fff" }}>
          <h3 style={{ marginTop: 0 }}>Your events</h3>
          {events.length ? events.map((ev) => (
            <div key={ev.id} style={{ borderBottom: "1px solid #f1dfe8", padding: "10px 0" }}>
              <strong>{ev.title}</strong>
              <div style={{ opacity: 0.8 }}>{ev.starts_at}</div>
              <div style={{ marginTop: 8 }}>
                <button className="button secondary" onClick={() => openEvent(ev)}>Open event</button>
              </div>
            </div>
          )) : <p style={{ margin: 0, opacity: 0.8 }}>No events yet.</p>}
        </section>

        {selectedEvent ? (
          <section style={{ border: "1px solid #e9d7e2", borderRadius: 20, padding: 16, background: "#fff" }}>
            <h3 style={{ marginTop: 0 }}>Invite people to {selectedEvent.title}</h3>
            <div style={{ display: "grid", gap: 12 }}>
              <input id="event-invite-email" name="inviteEmail" type="email" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} placeholder="friend@example.com" style={{ padding: "14px 16px", borderRadius: 16, border: "1px solid #d7a8bf", fontSize: 16 }} />
              <button className="button" onClick={invite} disabled={!inviteEmail.trim()}>Send event invite</button>
            </div>
            <div style={{ marginTop: 16, display: "grid", gap: 10 }}>
              {eventInvites.length ? eventInvites.map((row) => (
                <div key={row.id} style={{ borderBottom: "1px solid #f1dfe8", padding: "10px 0" }}>
                  <strong>{row.invitee_email}</strong>
                  <div style={{ opacity: 0.8 }}>Status: {row.status}</div>
                  {row.error_message ? <div style={{ opacity: 0.7 }}>Error: {row.error_message}</div> : null}
                  {(row.status === "failed" || row.status === "pending") ? <div style={{ marginTop: 8 }}><button className="button secondary" onClick={() => retryEventInvite(row)}>Retry send</button></div> : null}
                </div>
              )) : <p style={{ margin: 0, opacity: 0.8 }}>No event invites yet.</p>}
            </div>

            <div style={{ marginTop: 18, borderTop: "1px solid #f1dfe8", paddingTop: 18 }}>
              <h3 style={{ marginTop: 0 }}>Event thread</h3>
              <div style={{ border: "1px solid #f1dfe8", borderRadius: 16, padding: 12, minHeight: 180, background: "#fffafc" }}>
                {eventMessages.length ? eventMessages.map((m) => (
                  <EventMessageCard key={m.id} m={m} me={me} friendIds={friendIds} onAddFriend={addFriend} onReply={setReplyTo} onReact={react} />
                )) : <p style={{ margin: 0, opacity: 0.7 }}>No event messages yet.</p>}
              </div>
              <div style={{ display: "grid", gap: 12, marginTop: 12 }}>
                {replyTo ? <div style={{ opacity: 0.75 }}>Replying to message <code>{replyTo.slice(0, 8)}</code> <button className="button secondary" onClick={() => setReplyTo(null)}>Clear reply</button></div> : null}
                <textarea id="event-message-body" name="eventMessageBody" value={body} onChange={(e) => setBody(e.target.value)} placeholder="Type an event message" style={{ minHeight: 100, padding: "14px 16px", borderRadius: 16, border: "1px solid #d7a8bf", fontSize: 16 }} />
                <input id="event-link-url" name="eventLinkUrl" value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} placeholder="Optional link" style={{ padding: "14px 16px", borderRadius: 16, border: "1px solid #d7a8bf", fontSize: 16 }} />
                <input id="event-attachment" name="eventAttachment" type="file" accept="image/*,.pdf,.doc,.docx,.txt,.zip" onChange={(e) => setAttachment(e.target.files?.[0] || null)} />
                <button className="button" onClick={sendMessage}>Send to event</button>
              </div>
            </div>
          </section>
        ) : null}

        {status ? <p style={{ margin: 0, opacity: 0.8 }}>{status}</p> : null}
      </div>
    </ClientShell>
  );
}

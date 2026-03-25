"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { ClientShell } from "../../components/ClientShell";
import { getCurrentUser } from "../../lib/auth";
import { createEvent, listMyEvents, createEventInvite, listEventInvites, getMyProfile, updateEventInviteStatus } from "../../lib/db";

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
  const [status, setStatus] = useState("");

  const refreshEvents = async (uid: string) => {
    const rows = await listMyEvents(uid).catch(() => []);
    setEvents(rows);
    if (selectedEvent) {
      const invs = await listEventInvites(selectedEvent.id).catch(() => []);
      setEventInvites(invs);
    }
  };

  useEffect(() => {
    const run = async () => {
      const user = await getCurrentUser();
      if (!user) return;
      setMe(user.id);
      const profile = await getMyProfile(user.id).catch(() => null);
      setDisplayName(profile?.display_name || "A member");
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
    } catch (e: any) {
      setStatus(e.message || "Unable to create event.");
    }
  };

  const openEvent = async (ev: any) => {
    setSelectedEvent(ev);
    const invs = await listEventInvites(ev.id).catch(() => []);
    setEventInvites(invs);
  };

  const sendEventInvite = async (eventInviteId: string, email: string, eventTitle: string, eventStartsAt: string, eventLocation: string) => {
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
      const sendResult = await sendEventInvite(row.id, inviteEmail.trim(), selectedEvent.title, selectedEvent.starts_at, selectedEvent.location || "");
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
    const sendResult = await sendEventInvite(row.id, row.invitee_email, selectedEvent.title, selectedEvent.starts_at, selectedEvent.location || "");
    if (!sendResult.ok) {
      await updateEventInviteStatus(row.id, "failed", null, sendResult.error || "Unable to send email", null);
      setStatus(sendResult.error || "Retry failed.");
    } else {
      await updateEventInviteStatus(row.id, "sent", sendResult.sentAt, null, sendResult.resendMessageId || null);
      setStatus("Event invite email sent.");
    }
    await openEvent(selectedEvent);
  };

  return (
    <ClientShell>
      <section className="hero">
        <h1 style={{ margin: 0, fontSize: 30 }}>Events</h1>
        <p style={{ fontSize: 16, lineHeight: 1.6, opacity: 0.9 }}>
          Create events and invite people by email.
        </p>
      </section>

      <div className="grid">
        <section style={{ border: "1px solid #e9d7e2", borderRadius: 20, padding: 16, background: "#fff" }}>
          <h3 style={{ marginTop: 0 }}>Create event</h3>
          <div style={{ display: "grid", gap: 12 }}>
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Event title"
              style={{ padding: "14px 16px", borderRadius: 16, border: "1px solid #d7a8bf", fontSize: 16 }} />
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description"
              style={{ minHeight: 100, padding: "14px 16px", borderRadius: 16, border: "1px solid #d7a8bf", fontSize: 16 }} />
            <input type="datetime-local" value={startsAt} onChange={(e) => setStartsAt(e.target.value)}
              style={{ padding: "14px 16px", borderRadius: 16, border: "1px solid #d7a8bf", fontSize: 16 }} />
            <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Location"
              style={{ padding: "14px 16px", borderRadius: 16, border: "1px solid #d7a8bf", fontSize: 16 }} />
            <button className="button" onClick={create} disabled={!me || !title || !startsAt}>Create event</button>
          </div>
        </section>

        <section style={{ border: "1px solid #e9d7e2", borderRadius: 20, padding: 16, background: "#fff" }}>
          <h3 style={{ marginTop: 0 }}>Your events</h3>
          {events.length ? events.map((ev) => (
            <div key={ev.id} style={{ borderBottom: "1px solid #f1dfe8", padding: "10px 0" }}>
              <strong>{ev.title}</strong>
              <div style={{ opacity: 0.8 }}>{ev.starts_at}</div>
              <div style={{ marginTop: 8 }}>
                <button className="button secondary" onClick={() => openEvent(ev)}>Open invites</button>
              </div>
            </div>
          )) : <p style={{ margin: 0, opacity: 0.8 }}>No events yet.</p>}
        </section>

        {selectedEvent ? (
          <section style={{ border: "1px solid #e9d7e2", borderRadius: 20, padding: 16, background: "#fff" }}>
            <h3 style={{ marginTop: 0 }}>Invite people to {selectedEvent.title}</h3>
            <div style={{ display: "grid", gap: 12 }}>
              <input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="friend@example.com"
                style={{ padding: "14px 16px", borderRadius: 16, border: "1px solid #d7a8bf", fontSize: 16 }}
              />
              <button className="button" onClick={invite} disabled={!inviteEmail.trim()}>Send event invite</button>
            </div>

            <div style={{ marginTop: 16, display: "grid", gap: 10 }}>
              {eventInvites.length ? eventInvites.map((row) => (
                <div key={row.id} style={{ borderBottom: "1px solid #f1dfe8", padding: "10px 0" }}>
                  <strong>{row.invitee_email}</strong>
                  <div style={{ opacity: 0.8 }}>Status: {row.status}</div>
                  {row.error_message ? <div style={{ opacity: 0.7 }}>Error: {row.error_message}</div> : null}
                  {(row.status === "failed" || row.status === "pending") ? (
                    <div style={{ marginTop: 8 }}>
                      <button className="button secondary" onClick={() => retryEventInvite(row)}>Retry send</button>
                    </div>
                  ) : null}
                </div>
              )) : <p style={{ margin: 0, opacity: 0.8 }}>No event invites yet.</p>}
            </div>
          </section>
        ) : null}

        {status ? <p style={{ margin: 0, opacity: 0.8 }}>{status}</p> : null}
      </div>
    </ClientShell>
  );
}

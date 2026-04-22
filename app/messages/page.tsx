"use client";
export const dynamic = "force-dynamic";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { ClientShell } from "../../components/ClientShell";
import { EmptyState } from "../../components/EmptyState";
import { getCurrentUser } from "../../lib/auth";
import { listFriends, getMyProfile, getProfileById } from "../../lib/db";
import { markNotificationRead } from "../../lib/notificationSettings";
import { supabase } from "../../lib/supabase/client";

const PAGE_SIZE = 8;

async function loadDmPage(me: string, otherId: string, before?: string | null) {
  let q = supabase
    .from("messages")
    .select("id, sender_id, recipient_id, body, media_url, media_type, link_url, created_at")
    .or(`and(sender_id.eq.${me},recipient_id.eq.${otherId}),and(sender_id.eq.${otherId},recipient_id.eq.${me})`)
    .order("created_at", { ascending: false })
    .limit(PAGE_SIZE);

  if (before) q = q.lt("created_at", before);
  const { data, error } = await q;
  if (error) throw error;
  return data || [];
}

function MessageItem({ m, mine, onEdit, onDelete }: any) {
  return (
    <div style={{ marginBottom: 12, borderBottom: "1px solid #f3e6ed", paddingBottom: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
        <strong>{mine ? "You" : "Them"}</strong>
        {mine ? (
          <div style={{ display: "flex", gap: 8 }}>
            <button className="button secondary" onClick={onEdit}>Edit</button>
            <button className="button secondary" onClick={onDelete}>Delete</button>
          </div>
        ) : null}
      </div>
      {m.body ? <div style={{ whiteSpace: "pre-wrap" }}>{m.body}</div> : null}
      {m.link_url ? <div style={{ marginTop: 6 }}><a href={m.link_url} target="_blank" rel="noreferrer" style={{ color: "#8d2d5d", textDecoration: "underline" }}>{m.link_url}</a></div> : null}
      <div style={{ marginTop: 6, fontSize: 12, opacity: 0.65 }}>{new Date(m.created_at).toLocaleString()}</div>
    </div>
  );
}

function MessagesInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const threadId = searchParams?.get("thread") || "";
  const notificationId = searchParams?.get("notification") || "";

  const [me, setMe] = useState("");
  const [friends, setFriends] = useState<any[]>([]);
  const [selected, setSelected] = useState<any | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [body, setBody] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [status, setStatus] = useState("");
  const [hasMore, setHasMore] = useState(false);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);

  const friendsById = useMemo(() => new Map(friends.map((f: any) => [f.id, f])), [friends]);

  const openThread = async (friend: any, shouldMarkRead = false) => {
    setSelected(friend);
    const firstPage = await loadDmPage(me, friend.id).catch(() => []);
    setMessages(firstPage);
    setHasMore(firstPage.length === PAGE_SIZE);

    if (shouldMarkRead && me && notificationId) {
      await markNotificationRead(me, notificationId).catch(() => null);
      router.replace(`/messages?thread=${encodeURIComponent(friend.id)}`);
    }
  };

  useEffect(() => {
    (async () => {
      const user = await getCurrentUser().catch(() => null);
      if (!user) return;
      setMe(user.id);
      const [frs] = await Promise.all([
        listFriends(user.id).catch(() => []),
        getMyProfile(user.id).catch(() => null),
      ]);
      setFriends(frs);
    })();
  }, []);

  useEffect(() => {
    (async () => {
      if (!me || !threadId) return;
      let friend = friendsById.get(threadId);
      if (!friend) {
        const profile = await getProfileById(threadId).catch(() => null);
        if (profile) friend = { id: profile.id, display_name: profile.display_name || "Member" };
      }
      if (friend) await openThread(friend, Boolean(notificationId));
    })();
  }, [me, threadId, notificationId, friendsById]);

  const loadMore = async () => {
    if (!selected || !messages.length) return;
    try {
      const older = await loadDmPage(me, selected.id, messages[messages.length - 1].created_at);
      setMessages((prev) => [...prev, ...older]);
      setHasMore(older.length === PAGE_SIZE);
    } catch (e: any) {
      setStatus(e.message || "Unable to load older messages.");
    }
  };

  const saveOrSend = async () => {
    if (!selected) return;
    if (!body.trim() && !linkUrl.trim()) return;

    try {
      if (editingMessageId) {
        const { error } = await supabase
          .from("messages")
          .update({ body: body.trim() || null, link_url: linkUrl.trim() || null })
          .eq("id", editingMessageId)
          .eq("sender_id", me);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("messages").insert({
          sender_id: me,
          recipient_id: selected.id,
          body: body.trim() || null,
          link_url: linkUrl.trim() || null,
        });
        if (error) throw error;
      }

      setBody("");
      setLinkUrl("");
      setEditingMessageId(null);

      const firstPage = await loadDmPage(me, selected.id).catch(() => []);
      setMessages(firstPage);
      setHasMore(firstPage.length === PAGE_SIZE);
    } catch (e: any) {
      setStatus(e.message || "Unable to save message.");
    }
  };

  const beginEdit = (m: any) => {
    setEditingMessageId(m.id);
    setBody(m.body || "");
    setLinkUrl(m.link_url || "");
  };

  const removeMessage = async (id: string) => {
    try {
      const { error } = await supabase.from("messages").delete().eq("id", id).eq("sender_id", me);
      if (error) throw error;
      setMessages((prev) => prev.filter((x: any) => x.id !== id));
    } catch (e: any) {
      setStatus(e.message || "Unable to delete message.");
    }
  };

  return (
    <ClientShell>
      <section className="hero">
        <h1 style={{ margin: 0, fontSize: 30 }}>Messages</h1>
        <p style={{ fontSize: 16, lineHeight: 1.6, opacity: 0.9 }}>Direct messages show newest first. Use Load more to reveal older messages.</p>
      </section>

      <div className="grid">
        {selected ? (
          <section style={{ border: "1px solid #e9d7e2", borderRadius: 20, padding: 16, background: "#fff" }}>
            <h3 style={{ marginTop: 0 }}>Chat with {selected.display_name}</h3>
            <div style={{ border: "1px solid #f1dfe8", borderRadius: 16, padding: 12, minHeight: 180, background: "#fffafc" }}>
              {messages.length ? messages.map((m: any) => <MessageItem key={m.id} m={m} mine={m.sender_id === me} onEdit={() => beginEdit(m)} onDelete={() => removeMessage(m.id)} />) : <p style={{ margin: 0, opacity: 0.7 }}>No messages yet.</p>}
              {hasMore ? <button className="button secondary" onClick={loadMore}>Load more</button> : null}
            </div>

            <div style={{ display: "grid", gap: 10, marginTop: 12 }}>
              <textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="Type a message" style={{ minHeight: 100, padding: "14px 16px", borderRadius: 16, border: "1px solid #d7a8bf", fontSize: 16 }} />
              <input value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} placeholder="Optional link" style={{ padding: "14px 16px", borderRadius: 16, border: "1px solid #d7a8bf", fontSize: 16 }} />
              <button className="button" onClick={saveOrSend}>{editingMessageId ? "Save message" : "Send message"}</button>
            </div>
          </section>
        ) : null}

        <section style={{ border: "1px solid #e9d7e2", borderRadius: 20, padding: 16, background: "#fff" }}>
          <h3 style={{ marginTop: 0 }}>Friends</h3>
          {friends.length ? friends.map((f: any) => (
            <div key={f.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, marginBottom: 10 }}>
              <span>{f.display_name}</span>
              <button className="button secondary" onClick={() => openThread(f)}>Open thread</button>
            </div>
          )) : <EmptyState title="No DM threads yet" body="Add friends first, then come back here to chat." />}
        </section>

        {status ? <p style={{ margin: 0, opacity: 0.8 }}>{status}</p> : null}
      </div>
    </ClientShell>
  );
}

export default function MessagesPage() {
  return (
    <Suspense fallback={<ClientShell><section className="hero"><h1 style={{ margin: 0, fontSize: 30 }}>Messages</h1></section></ClientShell>}>
      <MessagesInner />
    </Suspense>
  );
}

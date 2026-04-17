"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ClientShell } from "../../../components/ClientShell";
import { getCurrentUser } from "../../../lib/auth";
import {
  getGroupById,
  getMyGroupMembership,
  listGroupMembers,
  removeGroupMember,
  sendGroupReply,
  updateGroupMemberRole,
  uploadPublicImage,
  getFriendIds,
  sendFriendRequest,
  reactToGroupMessage,
  getMyProfile,
  getPublicAndMemberGroups,
  isProfileComplete,
} from "../../../lib/db";
import { listGroupMessagesDetailedUnlimited } from "../../../lib/groupMessagesDetailed";
import { createCommunityGroup } from "../../../lib/community";

async function sendFriendRequestEmailNotification(recipientUserId: string, requesterName: string) {
  try {
    await fetch("/api/notifications/friend-request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ recipientUserId, requesterName }),
    });
  } catch {}
}

const EMOJIS = ["❤️", "👍", "😂", "🔥", "👏"];
const PAGE_SIZE = 10;

function formatKarma(value: any) {
  const num = Number(value || 0);
  return Number.isInteger(num) ? String(num) : num.toFixed(1).replace(/\.0$/, "");
}

function MessageCard({ m, me, friendIds, onAddFriend, onReplyStart, onReplyCancel, onReplySend, onReact, openReplyId, draftReply, setDraftReply, setAttachment, linkUrl, setLinkUrl }: any) {
  const mainPhoto = m.profile?.photo_urls?.[0] || m.profile?.photo_url || null;
  const isFriend = friendIds.has(m.sender_id);
  const grouped = new Map<string, number>();
  (m.reactions || []).forEach((r: any) => grouped.set(r.emoji, (grouped.get(r.emoji) || 0) + 1));
  const isOpen = openReplyId === String(m.id);

  return (
    <div style={{ marginBottom: 14, paddingLeft: m.parent_message_id ? 20 : 0, borderLeft: m.parent_message_id ? "3px solid #f1dfe8" : "none" }}>
      <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
        {mainPhoto ? <img src={mainPhoto} alt={m.profile?.display_name || "Member"} style={{ width: 38, height: 38, borderRadius: 999, objectFit: "cover", border: "1px solid #ead5df" }} /> : null}
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <Link href={`/members/${m.sender_id}`} style={{ color: "#8d2d5d", fontWeight: 700 }}>{m.sender_id === me ? "You" : (m.profile?.display_name || m.sender_id)}</Link>
            {m.sender_id !== me && !isFriend ? <button className="button secondary" onClick={() => onAddFriend(m.sender_id)}>Add Friend</button> : null}
          </div>
          {m.body ? <div style={{ whiteSpace: "pre-wrap", marginTop: 4 }}>{m.body}</div> : null}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 }}>
            <button type="button" className="button secondary" onClick={() => onReplyStart(String(m.id))}>Reply</button>
            {EMOJIS.map((emoji) => <button key={emoji} className="button secondary" onClick={() => onReact(m.id, emoji)}>{emoji} {grouped.get(emoji) || ""}</button>)}
          </div>
          {isOpen ? (
            <div style={{ marginTop: 10, display: "grid", gap: 10, border: "1px solid #f1dfe8", borderRadius: 14, padding: 10, background: "#fffafc" }}>
              <textarea value={draftReply} onChange={(e) => setDraftReply(e.target.value)} placeholder="Reply here" style={{ minHeight: 90, padding: "12px 14px", borderRadius: 12, border: "1px solid #d7a8bf", fontSize: 15 }} />
              <input value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} placeholder="Optional link" style={{ padding: "10px 12px", borderRadius: 12, border: "1px solid #d7a8bf", fontSize: 14 }} />
              <input type="file" accept="image/*,.pdf,.doc,.docx,.txt,.zip" onChange={(e) => setAttachment(e.target.files?.[0] || null)} />
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <button className="button" onClick={() => onReplySend(String(m.id))}>Send reply</button>
                <button className="button secondary" onClick={onReplyCancel}>Cancel</button>
              </div>
            </div>
          ) : null}
          {(m.children || []).map((child: any) => (
            <div key={child.id} style={{ marginTop: 12 }}>
              <MessageCard m={child} me={me} friendIds={friendIds} onAddFriend={onAddFriend} onReplyStart={onReplyStart} onReplyCancel={onReplyCancel} onReplySend={onReplySend} onReact={onReact} openReplyId={openReplyId} draftReply={draftReply} setDraftReply={setDraftReply} setAttachment={setAttachment} linkUrl={linkUrl} setLinkUrl={setLinkUrl} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function GroupThreadPage() {
  const params = useParams<{ groupId: string }>();
  const router = useRouter();
  const groupId = params?.groupId || "";

  const [me, setMe] = useState("");
  const [group, setGroup] = useState<any | null>(null);
  const [membership, setMembership] = useState<any | null>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [friendIds, setFriendIds] = useState<Set<string>>(new Set());
  const [body, setBody] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [attachment, setAttachment] = useState<File | null>(null);
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyBody, setReplyBody] = useState("");
  const [replyLinkUrl, setReplyLinkUrl] = useState("");
  const [replyAttachment, setReplyAttachment] = useState<File | null>(null);
  const [status, setStatus] = useState("");
  const [myName, setMyName] = useState("A member");
  const [myKarma, setMyKarma] = useState(0);
  const [allGroups, setAllGroups] = useState<any[]>([]);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [createGroupOpen, setCreateGroupOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupDescription, setNewGroupDescription] = useState("");
  const [newGroupPrivate, setNewGroupPrivate] = useState(false);

  const canModerate = membership?.role === "owner" || membership?.role === "mod";
  const isOwner = membership?.role === "owner";

  const refresh = async (uid: string) => {
    const [groupRow, membershipRow, memberRows, messageRows, fids, myProfile, groups] = await Promise.all([
      getGroupById(groupId).catch(() => null),
      getMyGroupMembership(groupId, uid).catch(() => null),
      listGroupMembers(groupId).catch(() => []),
      listGroupMessagesDetailedUnlimited(groupId).catch(() => []),
      getFriendIds(uid).catch(() => new Set<string>()),
      getMyProfile(uid).catch(() => null),
      getPublicAndMemberGroups(uid).catch(() => []),
    ]);
    setGroup(groupRow); setMembership(membershipRow); setMembers(memberRows); setMessages(messageRows); setFriendIds(fids);
    setMyName(myProfile?.display_name || "A member"); setMyKarma(Number(myProfile?.karma_points || 0)); setNeedsOnboarding(!isProfileComplete(myProfile)); setAllGroups(groups);
  };

  useEffect(() => {
    const run = async () => {
      const user = await getCurrentUser().catch(() => null);
      if (!user) return;
      setMe(user.id);
      await refresh(user.id);
    };
    run();
  }, [groupId]);

  const messageTree = useMemo(() => {
    const nodes = new Map<string, any>();
    messages.forEach((m: any) => nodes.set(String(m.id), { ...m, children: [] }));
    const roots: any[] = [];
    nodes.forEach((node: any) => {
      const parentId = node.parent_message_id ? String(node.parent_message_id) : null;
      if (parentId && nodes.has(parentId)) nodes.get(parentId).children.push(node); else roots.push(node);
    });
    const sortDesc = (arr: any[]) => { arr.sort((a, b) => (a.created_at < b.created_at ? 1 : -1)); arr.forEach((item) => sortDesc(item.children || [])); };
    sortDesc(roots);
    return roots;
  }, [messages]);

  const visibleRoots = useMemo(() => messageTree.slice(0, visibleCount), [messageTree, visibleCount]);

  const send = async () => {
    if (!groupId || !me || (!body.trim() && !linkUrl.trim() && !attachment)) return;
    try {
      let mediaUrl: string | null = null, mediaType: string | null = null;
      if (attachment) { mediaUrl = await uploadPublicImage("chat-media", me, attachment); mediaType = attachment.type || "application/octet-stream"; }
      await sendGroupReply(groupId, me, body.trim(), null, mediaUrl, mediaType, linkUrl.trim() || null);
      setBody(""); setLinkUrl(""); setAttachment(null); await refresh(me);
    } catch (e: any) { setStatus(e.message || "Unable to send group message."); }
  };

  const sendReply = async (parentMessageId: string) => {
    if (!groupId || !me || (!replyBody.trim() && !replyLinkUrl.trim() && !replyAttachment)) return;
    try {
      let mediaUrl: string | null = null, mediaType: string | null = null;
      if (replyAttachment) { mediaUrl = await uploadPublicImage("chat-media", me, replyAttachment); mediaType = replyAttachment.type || "application/octet-stream"; }
      await sendGroupReply(groupId, me, replyBody.trim(), parentMessageId, mediaUrl, mediaType, replyLinkUrl.trim() || null);
      setReplyTo(null); setReplyBody(""); setReplyLinkUrl(""); setReplyAttachment(null); await refresh(me);
    } catch (e: any) { setStatus(e.message || "Unable to send group reply."); }
  };

  const addFriend = async (userId: string) => {
    try {
      const result: any = await sendFriendRequest(me, userId);
      setStatus(result?.duplicate ? "Friend request already pending." : "Friend request sent.");
      if (!result?.duplicate) { setFriendIds(new Set<string>([...Array.from(friendIds), userId])); await sendFriendRequestEmailNotification(userId, myName); }
    } catch (e: any) { setStatus(e.message || "Unable to send friend request."); }
  };

  const react = async (messageId: string, emoji: string) => {
    if (!groupId || !me) return;
    try { await reactToGroupMessage(groupId, messageId, me, emoji); await refresh(me); } catch (e: any) { setStatus(e.message || "Unable to react to message."); }
  };

  const createGroup = async () => {
    if (!me || myKarma < 1) return setStatus("You need at least 1 karma to create a group.");
    try {
      const created = await createCommunityGroup({ name: newGroupName, description: newGroupDescription, isPrivate: newGroupPrivate, createdBy: me });
      setCreateGroupOpen(false); setNewGroupName(""); setNewGroupDescription(""); setNewGroupPrivate(false); router.push(`/groups-app/${created.id}`);
    } catch (e: any) { setStatus(e.message || "Unable to create group."); }
  };

  const postPlaceholder = String(group?.name || "").toLowerCase() === "main" ? "Introduce yourself to the Main group" : `Post to ${group?.name || "group"}`;

  return (
    <ClientShell>
      <section className="hero">
        <h1 style={{ margin: 0, fontSize: 30 }}>{group?.name || "Group"}</h1>
        <p style={{ fontSize: 16, lineHeight: 1.6, opacity: 0.9 }}>{group?.is_private ? "Private group." : "Public group."}</p>
      </section>

      <div className="grid">
        {needsOnboarding ? (
          <section style={{ border: "1px solid #e9d7e2", borderRadius: 20, padding: 16, background: "#fff7fb" }}>
            <h3 style={{ marginTop: 0 }}>Finish your profile first</h3>
            <button className="button" onClick={() => router.push("/onboarding/profile")}>Complete profile</button>
          </section>
        ) : null}

        <section style={{ border: "1px solid #e9d7e2", borderRadius: 20, padding: 16, background: "#fff" }}>
          <h3 style={{ marginTop: 0 }}>Groups</h3>
          <div style={{ display: "grid", gap: 8 }}>
            {allGroups.map((g: any) => <Link key={g.id} className="button secondary" href={`/groups-app/${g.id}`}>{String(g.name || "").toLowerCase() === "main" ? "⭐ Main" : g.name}</Link>)}
            {myKarma >= 1 ? <button className="button" onClick={() => setCreateGroupOpen((v) => !v)}>{createGroupOpen ? "Close Create Group" : "Create Group"}</button> : null}
          </div>
          {createGroupOpen ? (
            <div style={{ marginTop: 12, display: "grid", gap: 10, border: "1px solid #f1dfe8", borderRadius: 16, padding: 12, background: "#fffafc" }}>
              <input value={newGroupName} onChange={(e) => setNewGroupName(e.target.value)} placeholder="Group name" style={{ padding: "12px 14px", borderRadius: 12, border: "1px solid #d7a8bf", fontSize: 15 }} />
              <textarea value={newGroupDescription} onChange={(e) => setNewGroupDescription(e.target.value)} placeholder="Group description" style={{ minHeight: 90, padding: "12px 14px", borderRadius: 12, border: "1px solid #d7a8bf", fontSize: 15 }} />
              <label style={{ display: "flex", gap: 10, alignItems: "center" }}><input type="checkbox" checked={newGroupPrivate} onChange={(e) => setNewGroupPrivate(e.target.checked)} /><span>Private group</span></label>
              <button className="button" onClick={createGroup}>Create this group</button>
            </div>
          ) : null}
        </section>

        <section style={{ border: "1px solid #e9d7e2", borderRadius: 20, padding: 16, background: "#fff" }}>
          <h3 style={{ marginTop: 0 }}>New post</h3>
          <div style={{ display: "grid", gap: 12 }}>
            <textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder={postPlaceholder} style={{ minHeight: 100, padding: "14px 16px", borderRadius: 16, border: "1px solid #d7a8bf", fontSize: 16 }} />
            <input value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} placeholder="Optional link" style={{ padding: "14px 16px", borderRadius: 16, border: "1px solid #d7a8bf", fontSize: 16 }} />
            <input type="file" accept="image/*,.pdf,.doc,.docx,.txt,.zip" onChange={(e) => setAttachment(e.target.files?.[0] || null)} />
            <button className="button" onClick={send}>Send to group</button>
          </div>
        </section>

        <section style={{ border: "1px solid #e9d7e2", borderRadius: 20, padding: 16, background: "#fff" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <h3 style={{ margin: 0 }}>Threads</h3>
            <div style={{ opacity: 0.75 }}>{Math.min(visibleCount, messageTree.length)} of {messageTree.length} shown</div>
          </div>
          <div style={{ border: "1px solid #f1dfe8", borderRadius: 16, padding: 12, minHeight: 220, background: "#fffafc", marginTop: 10 }}>
            {visibleRoots.length ? visibleRoots.map((m) => <MessageCard key={m.id} m={m} me={me} friendIds={friendIds} onAddFriend={addFriend} onReplyStart={setReplyTo} onReplyCancel={() => { setReplyTo(null); setReplyBody(""); setReplyLinkUrl(""); setReplyAttachment(null); }} onReplySend={sendReply} onReact={react} openReplyId={replyTo} draftReply={replyBody} setDraftReply={setReplyBody} setAttachment={setReplyAttachment} linkUrl={replyLinkUrl} setLinkUrl={setReplyLinkUrl} />) : <p style={{ margin: 0, opacity: 0.7 }}>No group messages yet.</p>}
          </div>
          {visibleCount < messageTree.length ? <div style={{ marginTop: 12 }}><button className="button secondary" onClick={() => setVisibleCount((v) => v + PAGE_SIZE)}>Read more</button></div> : null}
        </section>

        <section style={{ border: "1px solid #e9d7e2", borderRadius: 20, padding: 16, background: "#fff" }}>
          <h3 style={{ marginTop: 0 }}>Member karma standings</h3>
          <p style={{ marginTop: 0, opacity: 0.8 }}>All group members are listed below in descending karma order.</p>
          {members.map((m, index) => (
            <div key={m.user_id} style={{ borderBottom: "1px solid #f1dfe8", padding: "10px 0" }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  {(m.profile?.photo_urls?.[0] || m.profile?.photo_url) ? <img src={m.profile?.photo_urls?.[0] || m.profile?.photo_url} alt={m.profile?.display_name || m.user_id} style={{ width: 36, height: 36, borderRadius: 999, objectFit: "cover" }} /> : null}
                  <div><div style={{ fontSize: 12, opacity: 0.65 }}>#{index + 1}</div><Link href={`/members/${m.user_id}`} style={{ color: "#8d2d5d", fontWeight: 700 }}>{m.profile?.display_name || m.user_id}</Link><div style={{ opacity: 0.75 }}>{m.role} • {formatKarma(m.profile?.karma_points)} karma</div></div>
                </div>
                {canModerate && m.user_id !== me ? <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>{isOwner && m.role === "member" ? <button className="button secondary" onClick={() => updateGroupMemberRole(groupId, m.user_id, "mod").then(() => refresh(me))}>Make mod</button> : null}{isOwner && m.role === "mod" ? <button className="button secondary" onClick={() => updateGroupMemberRole(groupId, m.user_id, "member").then(() => refresh(me))}>Make member</button> : null}{(isOwner || (membership?.role === "mod" && m.role === "member")) ? <button className="button secondary" onClick={() => removeGroupMember(groupId, m.user_id).then(() => refresh(me))}>Remove</button> : null}</div> : null}
              </div>
            </div>
          ))}
          {!members.length ? <p style={{ margin: 0, opacity: 0.75 }}>No members yet.</p> : null}
        </section>
        {status ? <p style={{ margin: 0, opacity: 0.8 }}>{status}</p> : null}
      </div>
    </ClientShell>
  );
}

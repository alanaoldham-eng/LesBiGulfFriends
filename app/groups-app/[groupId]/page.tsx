"use client";
export const dynamic = "force-dynamic";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { ClientShell } from "../../../components/ClientShell";
import { getCurrentUser } from "../../../lib/auth";
import {
  getGroupById,
  getMyGroupMembership,
  listGroupMembers,
  listGroupMessagesDetailed,
  removeGroupMember,
  sendGroupReply,
  updateGroupMemberRole,
  uploadPublicImage,
  getFriendIds,
  sendFriendRequest,
  reactToGroupMessage,
} from "../../../lib/db";

const EMOJIS = ["❤️", "👍", "😂", "🔥", "👏"];

function MessageCard({ m, me, friendIds, onAddFriend, onReply, onReact }: any) {
  const mainPhoto = m.profile?.photo_urls?.[0] || m.profile?.photo_url || null;
  const isFriend = friendIds.has(m.sender_id);
  const grouped = new Map<string, number>();
  (m.reactions || []).forEach((r: any) => grouped.set(r.emoji, (grouped.get(r.emoji) || 0) + 1));
  return (
    <div style={{ marginBottom: 14, paddingLeft: m.parent_message_id ? 20 : 0, borderLeft: m.parent_message_id ? "3px solid #f1dfe8" : "none" }}>
      <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
        {mainPhoto ? <img src={mainPhoto} alt={m.profile?.display_name || "Member"} style={{ width: 38, height: 38, borderRadius: 999, objectFit: "cover", border: "1px solid #ead5df" }} /> : null}
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <Link href={`/members/${m.sender_id}`} style={{ color: "#8d2d5d", fontWeight: 700 }}>
              {m.sender_id === me ? "You" : (m.profile?.display_name || m.sender_id)}
            </Link>
            {m.sender_id !== me && !isFriend ? (
              <button className="button secondary" onClick={() => onAddFriend(m.sender_id)}>Add Friend</button>
            ) : null}
            {m.parent_message_id ? <span style={{ opacity: 0.6, fontSize: 12 }}>Reply</span> : null}
          </div>
          {m.body ? <div style={{ whiteSpace: "pre-wrap", marginTop: 4 }}>{m.body}</div> : null}
          {m.link_url ? <div style={{ marginTop: 6 }}><a href={m.link_url} target="_blank" rel="noreferrer" style={{ color: "#8d2d5d", textDecoration: "underline" }}>{m.link_url}</a></div> : null}
          {m.media_url ? (
            <div style={{ marginTop: 8 }}>
              {String(m.media_type || "").startsWith("image/") ? <img src={m.media_url} alt="Attachment" style={{ maxWidth: "100%", borderRadius: 14, border: "1px solid #ead5df" }} /> : <a href={m.media_url} target="_blank" rel="noreferrer" style={{ color: "#8d2d5d", textDecoration: "underline" }}>Open attachment</a>}
            </div>
          ) : null}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8, alignItems: "center" }}>
            <button type="button" className="button secondary" onClick={() => onReply(String(m.id))}>Reply</button>
            {EMOJIS.map((emoji) => (
              <button key={emoji} className="button secondary" onClick={() => onReact(m.id, emoji)}>{emoji} {grouped.get(emoji) || ""}</button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function GroupThreadPage() {
  const params = useParams<{ groupId: string }>();
  const groupId = params.groupId;
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
  const [replyPreview, setReplyPreview] = useState<any | null>(null);
  const [status, setStatus] = useState("");

  const canModerate = membership?.role === "owner" || membership?.role === "mod";
  const isOwner = membership?.role === "owner";

  const refresh = async (uid: string) => {
    const [groupRow, membershipRow, memberRows, messageRows, fids] = await Promise.all([
      getGroupById(groupId).catch(() => null),
      getMyGroupMembership(groupId, uid).catch(() => null),
      listGroupMembers(groupId).catch(() => []),
      listGroupMessagesDetailed(groupId).catch(() => []),
      getFriendIds(uid).catch(() => new Set<string>()),
    ]);
    setGroup(groupRow);
    setMembership(membershipRow);
    setMembers(memberRows);
    setMessages(messageRows);
    setFriendIds(fids);
  };

  useEffect(() => {
    const run = async () => {
      const user = await getCurrentUser();
      if (!user) return;
      setMe(user.id);
      await refresh(user.id);
    };
    run();
  }, [groupId]);

  const handleReply = (messageId: string) => {
    setReplyTo(messageId);
    const msg = messages.find((m: any) => String(m.id) === String(messageId)) || null;
    setReplyPreview(msg);
    setStatus("Reply attached.");
  };

  const send = async () => {
    if (!body.trim() && !linkUrl.trim() && !attachment) return;
    try {
      let mediaUrl: string | null = null;
      let mediaType: string | null = null;
      if (attachment) {
        mediaUrl = await uploadPublicImage("chat-media", me, attachment);
        mediaType = attachment.type || "application/octet-stream";
      }
      await sendGroupReply(groupId, me, body.trim(), replyTo, mediaUrl, mediaType, linkUrl.trim() || null);
      setBody("");
      setLinkUrl("");
      setAttachment(null);
      setReplyTo(null);
      setReplyPreview(null);
      await refresh(me);
    } catch (e: any) {
      setStatus(e.message || "Unable to send group message.");
    }
  };

  const addFriend = async (userId: string) => {
    try {
      await sendFriendRequest(me, userId);
      setStatus("Friend request sent.");
    } catch (e: any) {
      setStatus(e.message || "Unable to send friend request.");
    }
  };

  const react = async (messageId: string, emoji: string) => {
    try {
      await reactToGroupMessage(groupId, messageId, me, emoji);
      await refresh(me);
    } catch (e: any) {
      setStatus(e.message || "Unable to react to message.");
    }
  };

  const promoteToMod = async (userId: string) => { try { await updateGroupMemberRole(groupId, userId, "mod"); setStatus("Member promoted to moderator."); await refresh(me); } catch (e: any) { setStatus(e.message || "Unable to update role."); } };
  const demoteToMember = async (userId: string) => { try { await updateGroupMemberRole(groupId, userId, "member"); setStatus("Moderator changed to member."); await refresh(me); } catch (e: any) { setStatus(e.message || "Unable to update role."); } };
  const removeMemberFromGroup = async (userId: string) => { try { await removeGroupMember(groupId, userId); setStatus("Member removed."); await refresh(me); } catch (e: any) { setStatus(e.message || "Unable to remove member."); } };

  return (
    <ClientShell>
      <section className="hero">
        <h1 style={{ margin: 0, fontSize: 30 }}>{group?.name || "Group"}</h1>
        <p style={{ fontSize: 16, lineHeight: 1.6, opacity: 0.9 }}>
          {group?.is_private ? "Private group." : "Public group."} Group messages support replies and emoji reactions.
        </p>
      </section>

      <div className="grid">
        <section style={{ border: "1px solid #e9d7e2", borderRadius: 20, padding: 16, background: "#fff" }}>
          <div style={{ border: "1px solid #f1dfe8", borderRadius: 16, padding: 12, minHeight: 220, background: "#fffafc" }}>
            {messages.length ? messages.map((m) => (
              <MessageCard key={m.id} m={m} me={me} friendIds={friendIds} onAddFriend={addFriend} onReply={handleReply} onReact={react} />
            )) : <p style={{ margin: 0, opacity: 0.7 }}>No group messages yet.</p>}
          </div>
          <div style={{ display: "grid", gap: 12, marginTop: 12 }}>
            {replyTo ? <div style={{ opacity: 0.85, border: "1px solid #f1dfe8", borderRadius: 14, padding: 10, background: "#fffafc" }}>Replying to <strong>{replyPreview?.profile?.display_name || (replyPreview?.sender_id === me ? "You" : "member")}</strong>{replyPreview?.body ? <div style={{ marginTop: 4, opacity: 0.75, whiteSpace: "pre-wrap" }}>{replyPreview.body}</div> : null}<div style={{ marginTop: 8 }}><button type="button" className="button secondary" onClick={() => { setReplyTo(null); setReplyPreview(null); }}>Clear reply</button></div></div> : null}
            <textarea id="message-body" name="messageBody" value={body} onChange={(e) => setBody(e.target.value)} placeholder="Type a group message" style={{ minHeight: 100, padding: "14px 16px", borderRadius: 16, border: "1px solid #d7a8bf", fontSize: 16 }} />
            <input id="link-url" name="linkUrl" value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} placeholder="Optional link" style={{ padding: "14px 16px", borderRadius: 16, border: "1px solid #d7a8bf", fontSize: 16 }} />
            <input id="group-attachment" name="groupAttachment" type="file" accept="image/*,.pdf,.doc,.docx,.txt,.zip" onChange={(e) => setAttachment(e.target.files?.[0] || null)} />
            <button className="button" onClick={send}>Send to group</button>
          </div>
        </section>

        <section style={{ border: "1px solid #e9d7e2", borderRadius: 20, padding: 16, background: "#fff" }}>
          <h3 style={{ marginTop: 0 }}>Members</h3>
          {members.map((m) => (
            <div key={m.user_id} style={{ borderBottom: "1px solid #f1dfe8", padding: "10px 0" }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  {(m.profile?.photo_urls?.[0] || m.profile?.photo_url) ? <img src={m.profile?.photo_urls?.[0] || m.profile?.photo_url} alt={m.profile?.display_name || m.user_id} style={{ width: 36, height: 36, borderRadius: 999, objectFit: "cover" }} /> : null}
                  <div>
                    <Link href={`/members/${m.user_id}`} style={{ color: "#8d2d5d", fontWeight: 700 }}>{m.profile?.display_name || m.user_id}</Link>
                    <div style={{ opacity: 0.75 }}>{m.role}</div>
                  </div>
                </div>
                {canModerate && m.user_id !== me ? (
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {isOwner && m.role === "member" ? <button className="button secondary" onClick={() => promoteToMod(m.user_id)}>Make mod</button> : null}
                    {isOwner && m.role === "mod" ? <button className="button secondary" onClick={() => demoteToMember(m.user_id)}>Make member</button> : null}
                    {(isOwner || (membership?.role === "mod" && m.role === "member")) ? <button className="button secondary" onClick={() => removeMemberFromGroup(m.user_id)}>Remove</button> : null}
                  </div>
                ) : null}
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

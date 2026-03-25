"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { ClientShell } from "../../../components/ClientShell";
import { getCurrentUser } from "../../../lib/auth";
import { getGroupById, getMyGroupMembership, listGroupMembers, listGroupMessages, removeGroupMember, sendGroupMessage, updateGroupMemberRole, uploadPublicImage } from "../../../lib/db";

function ChatAttachment({ m, isMe }: { m: any; isMe: boolean }) {
  return (
    <div key={m.id} style={{ marginBottom: 12 }}>
      <strong>{isMe ? "You" : m.sender_id}</strong>
      {m.body ? <div style={{ whiteSpace: "pre-wrap" }}>{m.body}</div> : null}
      {m.link_url ? (
        <div style={{ marginTop: 6 }}>
          <a href={m.link_url} target="_blank" rel="noreferrer" style={{ color: "#8d2d5d", textDecoration: "underline" }}>
            {m.link_url}
          </a>
        </div>
      ) : null}
      {m.media_url ? (
        <div style={{ marginTop: 8 }}>
          {String(m.media_type || "").startsWith("image/") ? (
            <img src={m.media_url} alt="Attachment" style={{ maxWidth: "100%", borderRadius: 14, border: "1px solid #ead5df" }} />
          ) : (
            <a href={m.media_url} target="_blank" rel="noreferrer" style={{ color: "#8d2d5d", textDecoration: "underline" }}>
              Open attachment
            </a>
          )}
        </div>
      ) : null}
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
  const [body, setBody] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [attachment, setAttachment] = useState<File | null>(null);
  const [status, setStatus] = useState("");

  const canModerate = membership?.role === "owner" || membership?.role === "mod";
  const isOwner = membership?.role === "owner";

  const refresh = async (uid: string) => {
    const [groupRow, membershipRow, memberRows, messageRows] = await Promise.all([
      getGroupById(groupId).catch(() => null),
      getMyGroupMembership(groupId, uid).catch(() => null),
      listGroupMembers(groupId).catch(() => []),
      listGroupMessages(groupId).catch(() => []),
    ]);
    setGroup(groupRow);
    setMembership(membershipRow);
    setMembers(memberRows);
    setMessages(messageRows);
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

  const send = async () => {
    if (!body.trim() && !linkUrl.trim() && !attachment) return;
    try {
      let mediaUrl: string | null = null;
      let mediaType: string | null = null;
      if (attachment) {
        mediaUrl = await uploadPublicImage("chat-media", me, attachment);
        mediaType = attachment.type || "application/octet-stream";
      }
      await sendGroupMessage(groupId, me, body.trim(), mediaUrl, mediaType, linkUrl.trim() || null);
      setBody("");
      setLinkUrl("");
      setAttachment(null);
      await refresh(me);
    } catch (e: any) {
      setStatus(e.message || "Unable to send group message.");
    }
  };

  const promoteToMod = async (userId: string) => {
    try {
      await updateGroupMemberRole(groupId, userId, "mod");
      setStatus("Member promoted to moderator.");
      await refresh(me);
    } catch (e: any) {
      setStatus(e.message || "Unable to update role.");
    }
  };

  const demoteToMember = async (userId: string) => {
    try {
      await updateGroupMemberRole(groupId, userId, "member");
      setStatus("Moderator changed to member.");
      await refresh(me);
    } catch (e: any) {
      setStatus(e.message || "Unable to update role.");
    }
  };

  const removeMemberFromGroup = async (userId: string) => {
    try {
      await removeGroupMember(groupId, userId);
      setStatus("Member removed.");
      await refresh(me);
    } catch (e: any) {
      setStatus(e.message || "Unable to remove member.");
    }
  };

  return (
    <ClientShell>
      <section className="hero">
        <h1 style={{ margin: 0, fontSize: 30 }}>{group?.name || "Group"}</h1>
        <p style={{ fontSize: 16, lineHeight: 1.6, opacity: 0.9 }}>
          {group?.is_private ? "Private group." : "Public group."} Send text, pictures, and links in your groups.
        </p>
      </section>

      <div className="grid">
        <section style={{ border: "1px solid #e9d7e2", borderRadius: 20, padding: 16, background: "#fff" }}>
          <div style={{ border: "1px solid #f1dfe8", borderRadius: 16, padding: 12, minHeight: 220, background: "#fffafc" }}>
            {messages.length ? messages.map((m) => (
              <ChatAttachment key={m.id} m={m} isMe={m.sender_id === me} />
            )) : <p style={{ margin: 0, opacity: 0.7 }}>No group messages yet.</p>}
          </div>
          <div style={{ display: "grid", gap: 12, marginTop: 12 }}>
            <textarea
              id="message-body"
              name="messageBody"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Type a group message"
              style={{ minHeight: 100, padding: "14px 16px", borderRadius: 16, border: "1px solid #d7a8bf", fontSize: 16 }}
            />
            <input
              id="link-url"
              name="linkUrl"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              placeholder="Optional link"
              style={{ padding: "14px 16px", borderRadius: 16, border: "1px solid #d7a8bf", fontSize: 16 }}
            />
            <input id="group-attachment" name="groupAttachment" type="file" accept="image/*,.pdf,.doc,.docx,.txt,.zip" onChange={(e) => setAttachment(e.target.files?.[0] || null)} />
            <button className="button" onClick={send}>Send to group</button>
          </div>
        </section>

        <section style={{ border: "1px solid #e9d7e2", borderRadius: 20, padding: 16, background: "#fff" }}>
          <h3 style={{ marginTop: 0 }}>Members</h3>
          {members.map((m) => (
            <div key={m.user_id} style={{ borderBottom: "1px solid #f1dfe8", padding: "10px 0" }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
                <div>
                  <strong>{m.profile?.display_name || m.user_id}</strong>
                  <div style={{ opacity: 0.75 }}>{m.role}</div>
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

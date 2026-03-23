"use client";

import { useEffect, useState } from "react";
import { ClientShell } from "../../components/ClientShell";
import { EmptyState } from "../../components/EmptyState";
import { getCurrentUser } from "../../lib/auth";
import { listGroups, joinGroup, createGroup, listMyGroups } from "../../lib/db";
import Link from "next/link";

export default function GroupsAppPage() {
  const [me, setMe] = useState("");
  const [groups, setGroups] = useState<any[]>([]);
  const [myGroups, setMyGroups] = useState<any[]>([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [locationTag, setLocationTag] = useState("");
  const [interestTags, setInterestTags] = useState("");
  const [status, setStatus] = useState("");

  const refresh = async (uid: string) => {
    const [all, mine] = await Promise.all([
      listGroups().catch(() => []),
      listMyGroups(uid).catch(() => []),
    ]);
    setGroups(all);
    setMyGroups(mine);
  };

  useEffect(() => {
    const run = async () => {
      const user = await getCurrentUser();
      if (!user) return;
      setMe(user.id);
      await refresh(user.id);
    };
    run();
  }, []);

  const doJoin = async (groupId: string) => {
    try {
      await joinGroup(groupId, me);
      setStatus("Joined group.");
      await refresh(me);
    } catch (e: any) {
      setStatus(e.message || "Unable to join group.");
    }
  };

  const doCreate = async () => {
    try {
      await createGroup({
        name,
        description,
        location_tag: locationTag || null,
        interest_tags: interestTags.split(",").map((x) => x.trim()).filter(Boolean),
        created_by: me,
        is_private: false,
      });
      setName("");
      setDescription("");
      setLocationTag("");
      setInterestTags("");
      setStatus("Group created.");
      await refresh(me);
    } catch (e: any) {
      setStatus(e.message || "Unable to create group.");
    }
  };

  const myIds = new Set(myGroups.map((g: any) => g.id));

  return (
    <ClientShell>
      <section className="hero">
        <h1 style={{ margin: 0, fontSize: 30 }}>Groups</h1>
        <p style={{ fontSize: 16, lineHeight: 1.6, opacity: 0.9 }}>
          Public groups are part of the MVP. Private groups and admin moderation can come next.
        </p>
      </section>

      <div className="grid">
        <section style={{ border: "1px solid #e9d7e2", borderRadius: 20, padding: 16, background: "#fff" }}>
          <h3 style={{ marginTop: 0 }}>Create a group</h3>
          <div style={{ display: "grid", gap: 12 }}>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Group name"
              style={{ padding: "14px 16px", borderRadius: 16, border: "1px solid #d7a8bf", fontSize: 16 }} />
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description"
              style={{ minHeight: 100, padding: "14px 16px", borderRadius: 16, border: "1px solid #d7a8bf", fontSize: 16 }} />
            <input value={locationTag} onChange={(e) => setLocationTag(e.target.value)} placeholder="Location tag"
              style={{ padding: "14px 16px", borderRadius: 16, border: "1px solid #d7a8bf", fontSize: 16 }} />
            <input value={interestTags} onChange={(e) => setInterestTags(e.target.value)} placeholder="Interest tags (comma separated)"
              style={{ padding: "14px 16px", borderRadius: 16, border: "1px solid #d7a8bf", fontSize: 16 }} />
            <button className="button" onClick={doCreate} disabled={!me || !name}>Create group</button>
          </div>
        </section>

        <section style={{ border: "1px solid #e9d7e2", borderRadius: 20, padding: 16, background: "#fff" }}>
          <h3 style={{ marginTop: 0 }}>Browse groups</h3>
          {groups.length ? groups.map((g) => (
            <div key={g.id} style={{ border: "1px solid #f1dfe8", borderRadius: 16, padding: 14, marginBottom: 10 }}>
              <strong>{g.name}</strong>
              <p style={{ margin: "8px 0", opacity: 0.8 }}>{g.description || "No description yet."}</p>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                {myIds.has(g.id) ? (
                  <Link className="button secondary" href={`/groups-app/${g.id}`}>Open chat</Link>
                ) : (
                  <button className="button secondary" onClick={() => doJoin(g.id)}>Join</button>
                )}
              </div>
            </div>
          )) : <EmptyState title="No groups yet" body="Create the first public group to get the community talking." />}
        </section>

        {status ? <p style={{ margin: 0, opacity: 0.8 }}>{status}</p> : null}
      </div>
    </ClientShell>
  );
}

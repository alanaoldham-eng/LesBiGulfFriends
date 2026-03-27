"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ClientShell } from "../../components/ClientShell";
import { EmptyState } from "../../components/EmptyState";
import { getCurrentUser } from "../../lib/auth";
import { getMyProfile, createGroup, joinGroup, listMyGroups, getPublicAndMemberGroups } from "../../lib/db";

export default function GroupsAppPage() {
  const [me, setMe] = useState("");
  const [karmaPoints, setKarmaPoints] = useState(0);
  const [groups, setGroups] = useState<any[]>([]);
  const [myGroups, setMyGroups] = useState<any[]>([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [locationTag, setLocationTag] = useState("");
  const [interestTags, setInterestTags] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [status, setStatus] = useState("");

  const refresh = async (uid: string) => {
    try {
      const [all, mine, profile] = await Promise.all([
        getPublicAndMemberGroups(uid),
        listMyGroups(uid),
        getMyProfile(uid),
      ]);

      console.log("groups all", all);
      console.log("groups mine", mine);
      console.log("profile", profile);

      setGroups(all);
      setMyGroups(mine);
      setKarmaPoints(Number(profile?.karma_points || 0));
      setStatus("");
    } catch (e: any) {
      console.error("Groups refresh failed:", e);
      setStatus(e?.message || JSON.stringify(e) || "Unable to load groups.");
      setGroups([]);
      setMyGroups([]);
    }
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
        is_private: isPrivate,
      });
      setName("");
      setDescription("");
      setLocationTag("");
      setInterestTags("");
      setIsPrivate(false);
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
          Browse all public groups any time. You can also create public or private groups. Group owners can moderate members, promote moderators, and remove people when needed. Creating a group costs 1 karma point.
        </p>
      </section>

      <div className="grid">
        <section style={{ border: "1px solid #e9d7e2", borderRadius: 20, padding: 16, background: "#fff" }}>
          <h3 style={{ marginTop: 0 }}>Create a group</h3>
          {karmaPoints > 0 ? (
            <div style={{ display: "grid", gap: 12 }}>
              <input id="group-name" name="groupName" value={name} onChange={(e) => setName(e.target.value)} placeholder="Group name"
                style={{ padding: "14px 16px", borderRadius: 16, border: "1px solid #d7a8bf", fontSize: 16 }} />
              <textarea id="group-description" name="groupDescription" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description"
                style={{ minHeight: 100, padding: "14px 16px", borderRadius: 16, border: "1px solid #d7a8bf", fontSize: 16 }} />
              <input id="group-location-tag" name="locationTag" value={locationTag} onChange={(e) => setLocationTag(e.target.value)} placeholder="Location tag"
                style={{ padding: "14px 16px", borderRadius: 16, border: "1px solid #d7a8bf", fontSize: 16 }} />
              <input id="group-interest-tags" name="interestTags" value={interestTags} onChange={(e) => setInterestTags(e.target.value)} placeholder="Interest tags (comma separated)"
                style={{ padding: "14px 16px", borderRadius: 16, border: "1px solid #d7a8bf", fontSize: 16 }} />
              <label style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <input id="group-private" name="isPrivate" type="checkbox" checked={isPrivate} onChange={(e) => setIsPrivate(e.target.checked)} />
                <span>Private group</span>
              </label>
              <div style={{ opacity: 0.75 }}>Karma available: {karmaPoints}</div>
              <button className="button" onClick={doCreate} disabled={!me || !name}>Create group</button>
            </div>
          ) : (
            <EmptyState title="Need 1 karma point" body="Creating a group costs 1 karma point. Public groups are still visible below even if you have 0 karma." />
          )}
        </section>

        <section style={{ border: "1px solid #e9d7e2", borderRadius: 20, padding: 16, background: "#fff" }}>
          <h3 style={{ marginTop: 0 }}>Browse groups</h3>
          {groups.length ? groups.map((g) => (
            <div key={g.id} style={{ border: "1px solid #f1dfe8", borderRadius: 16, padding: 14, marginBottom: 10 }}>
              <strong>{g.name}</strong>
              <div style={{ marginTop: 6, opacity: 0.75 }}>{g.is_private ? "Private group" : "Public group"}</div>
              <p style={{ margin: "8px 0", opacity: 0.8 }}>{g.description || "No description yet."}</p>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                {myIds.has(g.id) ? (
                  <Link className="button secondary" href={`/groups-app/${g.id}`}>Open group</Link>
                ) : !g.is_private ? (
                  <button className="button secondary" onClick={() => doJoin(g.id)}>Join</button>
                ) : (
                  <span style={{ opacity: 0.7 }}>Private — invite only</span>
                )}
              </div>
            </div>
          )) : <EmptyState title="No groups yet" body="Public groups will appear here even if you have 0 karma." />}
        </section>

        {status ? <p style={{ margin: 0, opacity: 0.8 }}>{status}</p> : null}
      </div>
    </ClientShell>
  );
}

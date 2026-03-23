"use client";

import { useEffect, useState } from "react";
import { ClientShell } from "../../components/ClientShell";
import { EmptyState } from "../../components/EmptyState";
import { getCurrentUser } from "../../lib/auth";
import { searchProfiles, sendFriendRequest, listFriendRequests, acceptFriendRequest, declineFriendRequest, listFriends } from "../../lib/db";

export default function FriendsPage() {
  const [me, setMe] = useState("");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [friends, setFriends] = useState<any[]>([]);
  const [status, setStatus] = useState("");

  const refresh = async (userId: string) => {
    const [reqs, frs] = await Promise.all([
      listFriendRequests().catch(() => []),
      listFriends(userId).catch(() => []),
    ]);
    setRequests(reqs);
    setFriends(frs);
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

  const doSearch = async () => {
    if (!me) return;
    const data = await searchProfiles(query, me);
    setResults(data);
  };

  const requestFriend = async (to: string) => {
    try {
      await sendFriendRequest(me, to);
      setStatus("Friend request sent.");
      await refresh(me);
    } catch (e: any) {
      setStatus(e.message || "Unable to send request.");
    }
  };

  const accept = async (id: string) => {
    try {
      await acceptFriendRequest(id);
      setStatus("Friend request accepted.");
      await refresh(me);
    } catch (e: any) {
      setStatus(e.message || "Unable to accept request.");
    }
  };

  const decline = async (id: string) => {
    try {
      await declineFriendRequest(id);
      setStatus("Friend request declined.");
      await refresh(me);
    } catch (e: any) {
      setStatus(e.message || "Unable to decline request.");
    }
  };

  const incoming = requests.filter((r) => r.to_user === me && r.status === "pending");

  return (
    <ClientShell>
      <section className="hero">
        <h1 style={{ margin: 0, fontSize: 30 }}>Friends</h1>
        <p style={{ fontSize: 16, lineHeight: 1.6, opacity: 0.9 }}>
          Search profiles, send friend requests, and accept incoming requests. DMs only work after friendship.
        </p>
      </section>

      <div className="grid">
        <section style={{ border: "1px solid #e9d7e2", borderRadius: 20, padding: 16, background: "#fff" }}>
          <h3 style={{ marginTop: 0 }}>Find people</h3>
          <div style={{ display: "grid", gap: 12 }}>
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by display name"
              style={{ padding: "14px 16px", borderRadius: 16, border: "1px solid #d7a8bf", fontSize: 16 }} />
            <button className="button" onClick={doSearch}>Search</button>
          </div>
          <div className="grid" style={{ marginTop: 14 }}>
            {results.map((p) => (
              <section key={p.id} style={{ border: "1px solid #f1dfe8", borderRadius: 18, padding: 14 }}>
                <strong>{p.display_name}</strong>
                <p style={{ margin: "8px 0", opacity: 0.8 }}>{p.bio || "No bio yet."}</p>
                <button className="button secondary" onClick={() => requestFriend(p.id)}>Send friend request</button>
              </section>
            ))}
          </div>
        </section>

        <section style={{ border: "1px solid #e9d7e2", borderRadius: 20, padding: 16, background: "#fff" }}>
          <h3 style={{ marginTop: 0 }}>Incoming requests</h3>
          {incoming.length ? incoming.map((r) => (
            <div key={r.id} style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 10, flexWrap: "wrap" }}>
              <span style={{ opacity: 0.8 }}>Request from {r.from_user}</span>
              <button className="button secondary" onClick={() => accept(r.id)}>Accept</button>
              <button className="button secondary" onClick={() => decline(r.id)}>Decline</button>
            </div>
          )) : <EmptyState title="No incoming requests" body="When someone sends you a request, it will show up here." />}
        </section>

        <section style={{ border: "1px solid #e9d7e2", borderRadius: 20, padding: 16, background: "#fff" }}>
          <h3 style={{ marginTop: 0 }}>Your friends</h3>
          {friends.length ? (
            <ul style={{ lineHeight: 1.8, paddingLeft: 18, margin: 0 }}>
              {friends.map((f) => <li key={f.id}>{f.display_name}</li>)}
            </ul>
          ) : (
            <EmptyState title="No friends yet" body="Start by searching and sending your first request." />
          )}
        </section>

        {status ? <p style={{ margin: 0, opacity: 0.8 }}>{status}</p> : null}
      </div>
    </ClientShell>
  );
}

"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { ClientShell } from "../../components/ClientShell";
import { EmptyState } from "../../components/EmptyState";
import { getCurrentUser } from "../../lib/auth";
import { getMyProfile, upsertMyProfile } from "../../lib/db";

export default function ProfilePage() {
  const [userId, setUserId] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [interests, setInterests] = useState("");
  const [city, setCity] = useState("");
  const [status, setStatus] = useState("Loading...");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const run = async () => {
      try {
        const user = await getCurrentUser();
        if (!user) {
          setStatus("You need to sign in again.");
          return;
        }
        setUserId(user.id);
        try {
          const profile = await getMyProfile(user.id);
          setDisplayName(profile.display_name || "");
          setBio(profile.bio || "");
          setInterests((profile.interests || []).join(", "));
          setCity(profile.city || "");
          setStatus("");
        } catch {
          setStatus("Create your profile to get started.");
        }
      } finally {
        setLoading(false);
      }
    };
    run();
  }, []);

  const save = async () => {
    setStatus("Saving...");
    try {
      await upsertMyProfile({
        id: userId,
        display_name: displayName,
        bio,
        interests: interests.split(",").map((x) => x.trim()).filter(Boolean),
        city,
      });
      localStorage.setItem("lbgf_profile_started", "1");
      setStatus("Profile saved.");
    } catch (e: any) {
      setStatus(e.message || "Unable to save profile.");
    }
  };

  return (
    <ClientShell>
      <section className="hero">
        <h1 style={{ margin: 0, fontSize: 30 }}>Create your public profile</h1>
        <p style={{ fontSize: 16, lineHeight: 1.6, opacity: 0.9 }}>
          Set a nickname or display name so the app shows that instead of your email address. This is your public identity inside the community.
        </p>
      </section>

      {loading ? (
        <EmptyState title="Loading profile" body="Checking your session and pulling your profile..." />
      ) : (
        <div className="grid">
          <section style={{ border: "1px solid #e9d7e2", borderRadius: 20, padding: 16, background: "#fff" }}>
            <div style={{ display: "grid", gap: 12 }}>
              <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Nickname or display name"
                style={{ padding: "14px 16px", borderRadius: 16, border: "1px solid #d7a8bf", fontSize: 16 }} />
              <textarea value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Bio"
                style={{ minHeight: 120, padding: "14px 16px", borderRadius: 16, border: "1px solid #d7a8bf", fontSize: 16 }} />
              <input value={interests} onChange={(e) => setInterests(e.target.value)} placeholder="Interests (comma separated)"
                style={{ padding: "14px 16px", borderRadius: 16, border: "1px solid #d7a8bf", fontSize: 16 }} />
              <input value={city} onChange={(e) => setCity(e.target.value)} placeholder="City"
                style={{ padding: "14px 16px", borderRadius: 16, border: "1px solid #d7a8bf", fontSize: 16 }} />
              <button className="button" onClick={save} disabled={!userId || !displayName}>Save profile</button>
              {status ? <p style={{ margin: 0, opacity: 0.8 }}>{status}</p> : null}
            </div>
          </section>
        </div>
      )}
    </ClientShell>
  );
}

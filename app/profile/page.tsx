"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { ClientShell } from "../../components/ClientShell";
import { EmptyState } from "../../components/EmptyState";
import { getCurrentUser } from "../../lib/auth";
import Link from "next/link";
import { deletePublicImage, getMainGroupId, getMyProfile, hasPostedIntroduction, upsertMyProfile, uploadPublicImage, listBadgesForUser, type RelationshipStatus } from "../../lib/db";

function formatKarma(value: any) {
  const num = Number(value || 0);
  return Number.isInteger(num) ? String(num) : num.toFixed(1).replace(/\.0$/, "");
}

const RELATIONSHIP_OPTIONS = [
  "single",
  "coupled",
  "in an open relationship",
  "it's complicated",
] as const;

export default function ProfilePage() {
  const [userId, setUserId] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [interests, setInterests] = useState("");
  const [city, setCity] = useState("");
  const [relationshipStatus, setRelationshipStatus] = useState<RelationshipStatus | "">("");
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [status, setStatus] = useState("Loading...");
  const [karmaPoints, setKarmaPoints] = useState(0);
  const [loading, setLoading] = useState(true);
  const [badges, setBadges] = useState<any[]>([]);
  const [mainGroupId, setMainGroupId] = useState<string | null>(null);
  const [hasIntro, setHasIntro] = useState(false);
  const canAddMorePhotos = photoUrls.length < 3;

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
          setDisplayName(profile.display_name === "New Member" ? "" : profile.display_name || "");
          setBio(profile.bio || "");
          setInterests((profile.interests || []).join(", "));
          setCity(profile.city || "");
          setRelationshipStatus((profile.relationship_status as RelationshipStatus | null) || "");
          setPhotoUrls(profile.photo_urls || (profile.photo_url ? [profile.photo_url] : []));
          setKarmaPoints(Number(profile.karma_points || 0));
          const [mainId, introPosted, badgeRows] = await Promise.all([
            getMainGroupId().catch(() => null),
            hasPostedIntroduction(user.id).catch(() => false),
            listBadgesForUser(user.id).catch(() => []),
          ]);
          setMainGroupId(mainId);
          setHasIntro(introPosted);
          setBadges(badgeRows);
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
        relationship_status: relationshipStatus === "" ? null : relationshipStatus,
        photo_urls: photoUrls,
        photo_url: photoUrls[0] || null,
      });
      localStorage.setItem("lbgf_profile_started", "1");
      setStatus("Profile saved.");
    } catch (e: any) {
      setStatus(e.message || "Unable to save profile.");
    }
  };

  const uploadPhoto = async (file?: File | null) => {
    if (!file || !userId) return;
    if (photoUrls.length >= 3) return setStatus("You can upload up to 3 profile photos.");
    setStatus("Uploading photo...");
    try {
      const publicUrl = await uploadPublicImage("profile-photos", userId, file);
      setPhotoUrls((prev) => [...prev, publicUrl].slice(0, 3));
      setStatus("Photo uploaded. Save profile to keep the new order.");
    } catch (e: any) {
      setStatus(e.message || "Unable to upload photo.");
    }
  };

  const movePhoto = (index: number, direction: -1 | 1) => {
    const next = [...photoUrls];
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= next.length) return;
    [next[index], next[newIndex]] = [next[newIndex], next[index]];
    setPhotoUrls(next);
  };

  const removePhoto = async (index: number) => {
    const url = photoUrls[index];
    setStatus("Removing photo...");
    try {
      await deletePublicImage("profile-photos", url);
    } catch {}
    setPhotoUrls((prev) => prev.filter((_, i) => i !== index));
    setStatus("Photo removed. Save profile to update your profile order.");
  };

  return (
    <ClientShell>
      <section className="hero">
        <h1 style={{ margin: 0, fontSize: 30 }}>Create your public profile</h1>
        <p style={{ fontSize: 16, lineHeight: 1.6, opacity: 0.9 }}>
          Set a nickname or display name so the app shows that instead of your email address. Add up to 3 photos, choose their order, and tell people a little about yourself.
        </p>
{badges.length ? <div style={{ marginTop: 12, display: "flex", gap: 8, flexWrap: "wrap" }}>{badges.map((badge) => <span key={badge.id} style={{ padding: "6px 10px", borderRadius: 999, background: "#fff7fb", border: "1px solid #f1dfe8" }}>{badge.emoji} {badge.badge_label}</span>)}</div> : null}
        <div style={{ marginTop: 12, padding: 12, borderRadius: 16, border: "1px solid #efcad8", background: "#fff" }}>
          <strong>Karma points:</strong> {formatKarma(karmaPoints)}
        </div>
        {(!bio || !city || !photoUrls[0] || !hasIntro) ? (
          <div style={{ marginTop: 12, padding: 14, borderRadius: 16, border: "1px solid #efcad8", background: "#fff" }}>
            <strong>Complete your profile and say hello</strong>
            <p style={{ margin: "8px 0 0", opacity: 0.85, lineHeight: 1.6 }}>
              A fuller profile helps people trust you and connect. Then post an introduction in Main so the community can welcome you.
            </p>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 10 }}>
              <button className="button secondary" onClick={save}>Save profile</button>
              {mainGroupId ? <Link className="button" href={`/groups-app/${mainGroupId}`}>Go to Main group</Link> : <Link className="button" href="/groups-app">Go to Groups</Link>}
            </div>
          </div>
        ) : null}
      </section>

      {loading ? (
        <EmptyState title="Loading profile" body="Checking your session and pulling your profile..." />
      ) : (
        <div className="grid">
          <section style={{ border: "1px solid #e9d7e2", borderRadius: 20, padding: 16, background: "#fff" }}>
            {photoUrls[0] ? (
              <div style={{ marginBottom: 16 }}>
                <img
                  src={photoUrls[0]}
                  alt="Main profile"
                  style={{ width: "100%", maxWidth: 360, aspectRatio: "1 / 1", objectFit: "cover", borderRadius: 20, border: "1px solid #ead5df" }}
                />
                <div style={{ marginTop: 8, fontWeight: 700, opacity: 0.85 }}>Primary profile photo</div>
              </div>
            ) : null}

            <div style={{ display: "grid", gap: 12 }}>
              <input
                id="display-name"
                name="displayName"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Nickname or display name"
                style={{ padding: "14px 16px", borderRadius: 16, border: "1px solid #d7a8bf", fontSize: 16 }}
              />
              <textarea
                id="bio"
                name="bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Bio"
                style={{ minHeight: 120, padding: "14px 16px", borderRadius: 16, border: "1px solid #d7a8bf", fontSize: 16 }}
              />
              <input
                id="interests"
                name="interests"
                value={interests}
                onChange={(e) => setInterests(e.target.value)}
                placeholder="Interests (comma separated)"
                style={{ padding: "14px 16px", borderRadius: 16, border: "1px solid #d7a8bf", fontSize: 16 }}
              />
              <input
                id="city"
                name="city"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="City"
                style={{ padding: "14px 16px", borderRadius: 16, border: "1px solid #d7a8bf", fontSize: 16 }}
              />
              <select
                id="relationship-status"
                name="relationshipStatus"
                value={relationshipStatus}
                onChange={(e) => setRelationshipStatus(e.target.value as RelationshipStatus | "")}
                style={{ padding: "14px 16px", borderRadius: 16, border: "1px solid #d7a8bf", fontSize: 16, background: "#fff" }}
              >
                <option value="">Relationship status</option>
                {RELATIONSHIP_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>

              <div style={{ display: "grid", gap: 10 }}>
                <strong>Profile photos</strong>
                <p style={{ margin: 0, opacity: 0.75 }}>Upload up to 3 profile photos. The first one appears at the top of your profile.</p>
                {canAddMorePhotos ? (
                  <input
                    id="profile-photo-upload"
                    name="profilePhotoUpload"
                    type="file"
                    accept="image/*"
                    onChange={(e) => uploadPhoto(e.target.files?.[0])}
                    style={{ padding: "10px 0" }}
                  />
                ) : (
                  <p style={{ margin: 0, opacity: 0.75 }}>You have reached the 3 photo limit. Remove a photo to upload another.</p>
                )}

                {photoUrls[0] ? (
                  <div style={{ border: "1px solid #f1dfe8", borderRadius: 18, padding: 12, background: "#fffafc" }}>
                    <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
                      <img src={photoUrls[0]} alt="Primary profile" style={{ width: 88, height: 88, objectFit: "cover", borderRadius: 16, border: "1px solid #ead5df" }} />
                      <div style={{ display: "grid", gap: 8 }}>
                        <strong>Main profile photo</strong>
                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                          <button className="button secondary" onClick={() => movePhoto(0, 1)} disabled={photoUrls.length < 2}>Move down</button>
                          <button className="button secondary" onClick={() => removePhoto(0)}>Delete</button>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : null}

                {photoUrls.length > 1 ? (
                  <div style={{ display: "grid", gap: 12 }}>
                    <div style={{ fontWeight: 700, opacity: 0.85 }}>Additional photos</div>
                    {photoUrls.slice(1).map((url, extraIndex) => {
                      const index = extraIndex + 1;
                      return (
                        <div key={url} style={{ border: "1px solid #f1dfe8", borderRadius: 18, padding: 12, background: "#fffafc" }}>
                          <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
                            <img src={url} alt={`Profile ${index + 1}`} style={{ width: 88, height: 88, objectFit: "cover", borderRadius: 16, border: "1px solid #ead5df" }} />
                            <div style={{ display: "grid", gap: 8 }}>
                              <strong>{`Photo ${index + 1}`}</strong>
                              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                                <button className="button secondary" onClick={() => movePhoto(index, -1)}>Move up</button>
                                <button className="button secondary" onClick={() => movePhoto(index, 1)} disabled={index === photoUrls.length - 1}>Move down</button>
                                <button className="button secondary" onClick={() => removePhoto(index)}>Delete</button>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : null}
              </div>

              <button className="button" onClick={save} disabled={!userId || !displayName}>Save profile</button>
              {status ? <p style={{ margin: 0, opacity: 0.8 }}>{status}</p> : null}
            </div>
          </section>
        </div>
      )}
    </ClientShell>
  );
}

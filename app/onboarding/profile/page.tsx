"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ClientShell } from "../../../components/ClientShell";
import { getCurrentUser } from "../../../lib/auth";
import { generateHeroicUsername, getMyProfile, getPublicAndMemberGroups, isProfileComplete, sendGroupReply, updateGroupMemberRole, upsertMyProfile, uploadPublicImage } from "../../../lib/db";

export default function OnboardingProfilePage() {
  const router = useRouter();
  const [me, setMe] = useState("");
  const [displayName, setDisplayName] = useState(generateHeroicUsername());
  const [bio, setBio] = useState("");
  const [city, setCity] = useState("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [status, setStatus] = useState("");

  useEffect(() => {
    getCurrentUser().then(async (user) => {
      if (!user) return;
      setMe(user.id);
      const profile = await getMyProfile(user.id).catch(() => null);
      if (profile) {
        setDisplayName(profile.display_name && profile.display_name !== 'New Member' ? profile.display_name : generateHeroicUsername());
        setBio(profile.bio || '');
        setCity(profile.city || '');
        setPhotoUrl(profile.photo_urls?.[0] || profile.photo_url || null);
        if (isProfileComplete(profile)) router.replace('/groups-app');
      }
    });
  }, [router]);

  const save = async () => {
    if (!me) return;
    try {
      let uploaded = photoUrl;
      if (photoFile) uploaded = await uploadPublicImage('profile-photos', me, photoFile);
      await upsertMyProfile({ id: me, display_name: displayName.trim(), bio: bio.trim() || null, city: city.trim() || null, photo_url: uploaded || null, photo_urls: uploaded ? [uploaded] : [] });
      const groups = await getPublicAndMemberGroups(me).catch(() => []);
      const mainGroup = (groups || []).find((g: any) => String(g.name || '').toLowerCase() === 'main');
      if (mainGroup) {
        await sendGroupReply(mainGroup.id, me, `Hi everyone, I’m ${displayName.trim()} 👋 Excited to join the community!`, null, null, null, null).catch(() => null);
        router.replace(`/groups-app/${mainGroup.id}`);
        return;
      }
      router.replace('/groups-app');
    } catch (e: any) {
      setStatus(e.message || 'Unable to save profile.');
    }
  };

  return (
    <ClientShell>
      <section className="hero">
        <h1 style={{ margin: 0, fontSize: 30 }}>Complete your profile</h1>
        <p style={{ fontSize: 16, lineHeight: 1.6, opacity: 0.9 }}>
          We gave you a strong heroic name to start. Change it if you want, add at least one photo, and then we will send you into the Main group to post your intro.
        </p>
      </section>
      <div className="grid">
        <section style={{ border: '1px solid #e9d7e2', borderRadius: 20, padding: 16, background: '#fff' }}>
          <div style={{ display: 'grid', gap: 12 }}>
            <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder='Display name' style={{ padding: '14px 16px', borderRadius: 16, border: '1px solid #d7a8bf', fontSize: 16 }} />
            <textarea value={bio} onChange={(e) => setBio(e.target.value)} placeholder='Short bio' style={{ minHeight: 100, padding: '14px 16px', borderRadius: 16, border: '1px solid #d7a8bf', fontSize: 16 }} />
            <input value={city} onChange={(e) => setCity(e.target.value)} placeholder='City' style={{ padding: '14px 16px', borderRadius: 16, border: '1px solid #d7a8bf', fontSize: 16 }} />
            <input type='file' accept='image/*' onChange={(e) => setPhotoFile(e.target.files?.[0] || null)} />
            {photoUrl ? <img src={photoUrl} alt='Preview' style={{ width: 96, height: 96, objectFit: 'cover', borderRadius: 16, border: '1px solid #ead5df' }} /> : null}
            <button className='button' onClick={save} disabled={!displayName.trim() || (!photoUrl && !photoFile)}>Save profile and go to Main</button>
          </div>
          {status ? <p style={{ marginTop: 12, opacity: 0.8 }}>{status}</p> : null}
        </section>
      </div>
    </ClientShell>
  );
}

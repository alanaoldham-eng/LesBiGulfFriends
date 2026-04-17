"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ClientShell } from "../../components/ClientShell";
import { getCurrentUser } from "../../lib/auth";
import { getMyProfile, getPublicAndMemberGroups, isProfileComplete } from "../../lib/db";
import { canAccessCommunity, ensureWaitingRoomCandidate } from "../../lib/community";

export default function GroupsAppPage() {
  const router = useRouter();

  useEffect(() => {
    const run = async () => {
      const user = await getCurrentUser().catch(() => null);
      if (!user) return;

      const access = await canAccessCommunity({ userId: user.id, email: user.email }).catch(() => null);
      if (!access?.allowed) {
        await ensureWaitingRoomCandidate(user.id).catch(() => null);
        router.replace("/waiting-room");
        return;
      }

      const profile = await getMyProfile(user.id).catch(() => null);
      if (!isProfileComplete(profile)) {
        router.replace("/onboarding/profile");
        return;
      }

      const groups = await getPublicAndMemberGroups(user.id).catch(() => []);
      const mainGroup = (groups || []).find((g: any) => String(g.name || "").toLowerCase() === "main");
      if (mainGroup?.id) router.replace(`/groups-app/${mainGroup.id}`);
    };
    run();
  }, [router]);

  return (
    <ClientShell>
      <section className="hero">
        <h1 style={{ margin: 0, fontSize: 30 }}>Groups</h1>
        <p style={{ opacity: 0.85 }}>Opening the Main group…</p>
      </section>
    </ClientShell>
  );
}

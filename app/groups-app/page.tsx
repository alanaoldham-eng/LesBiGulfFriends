"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ClientShell } from "../../components/ClientShell";
import { getCurrentUser } from "../../lib/auth";
import { getMainGroupId, getMyProfile, isProfileComplete } from "../../lib/db";

const MAIN_GROUP_CACHE_KEY = "lbgf_main_group_id_v1";

export default function GroupsAppPage() {
  const router = useRouter();
  const [message, setMessage] = useState("Opening the Main group...");

  useEffect(() => {
    let mounted = true;

    const run = async () => {
      try {
        const cachedMainGroupId =
          typeof window !== "undefined" ? window.sessionStorage.getItem(MAIN_GROUP_CACHE_KEY) : null;

        const user = await getCurrentUser().catch(() => null);
        if (!mounted) return;

        if (!user) {
          router.replace("/login");
          return;
        }

        const [profile, mainGroupId] = await Promise.all([
          getMyProfile(user.id).catch(() => null),
          cachedMainGroupId ? Promise.resolve(cachedMainGroupId) : getMainGroupId().catch(() => null),
        ]);

        if (!mounted) return;

        if (!isProfileComplete(profile)) {
          router.replace("/onboarding/profile");
          return;
        }

        if (mainGroupId) {
          window.sessionStorage.setItem(MAIN_GROUP_CACHE_KEY, mainGroupId);
          router.replace(`/groups-app/${mainGroupId}`);
          return;
        }

        setMessage("Main group was not found. Open the groups list from navigation and check that a group named Main exists.");
      } catch {
        if (mounted) setMessage("Unable to open the Main group. Please try again.");
      }
    };

    run();

    return () => {
      mounted = false;
    };
  }, [router]);

  return (
    <ClientShell>
      <section className="hero">
        <h1 style={{ margin: 0, fontSize: 30 }}>Groups</h1>
        <p style={{ opacity: 0.85 }}>{message}</p>
      </section>
    </ClientShell>
  );
}

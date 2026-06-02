"use client";
export const dynamic = "force-dynamic";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AdminDashboardAliasPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/admin-rewards");
  }, [router]);

  return (
    <section className="hero">
      <h1 style={{ margin: 0, fontSize: 28 }}>Opening Admin Dashboard...</h1>
    </section>
  );
}

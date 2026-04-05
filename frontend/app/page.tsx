"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getAccessToken } from "@/lib/api";
import { dashboardPathForRole, useAuthStore } from "@/lib/auth-store";

export default function HomePage() {
  const router = useRouter();
  const hydrated = useAuthStore((s) => s.hydrated);
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    if (!hydrated) return;
    const token = getAccessToken();
    if (!token || !user) {
      router.replace("/login");
      return;
    }
    router.replace(dashboardPathForRole(user.role));
  }, [hydrated, user, router]);

  return (
    <div className="flex min-h-screen items-center justify-center text-slate-400">
      <p>Weiterleitung…</p>
    </div>
  );
}

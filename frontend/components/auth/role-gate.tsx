"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/auth-store";
import type { Role } from "@/lib/types";

type Props = {
  allowed: Role | Role[];
  children: React.ReactNode;
};

export function RoleGate({ allowed, children }: Props) {
  const router = useRouter();
  const hydrated = useAuthStore((s) => s.hydrated);
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    if (!hydrated) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    const roles = Array.isArray(allowed) ? allowed : [allowed];
    if (!roles.includes(user.role)) {
      router.replace("/login");
    }
  }, [hydrated, user, allowed, router]);

  if (!hydrated || !user) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-slate-400">
        <p>Laden…</p>
      </div>
    );
  }

  const roles = Array.isArray(allowed) ? allowed : [allowed];
  if (!roles.includes(user.role)) {
    return null;
  }

  return <>{children}</>;
}

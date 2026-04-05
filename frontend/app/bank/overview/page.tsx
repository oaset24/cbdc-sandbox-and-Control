"use client";

import { useQuery } from "@tanstack/react-query";
import { ApiError, api } from "@/lib/api";
import { StatsCard } from "@/components/dashboard/stats-card";

export default function BankOverviewPage() {
  const statsQ = useQuery({ queryKey: ["systemStats"], queryFn: () => api.systemStats() });
  const usersQ = useQuery({ queryKey: ["users"], queryFn: () => api.users() });

  const customers = usersQ.data?.filter((u) => u.role === "USER").length ?? "—";
  const pendingKyc = statsQ.data?.pendingKycUsers ?? "—";

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-slate-100">Bank-Übersicht</h2>
      {statsQ.error || usersQ.error ? (
        <p className="text-sm text-red-400">
          {statsQ.error instanceof ApiError ? statsQ.error.message : usersQ.error instanceof ApiError ? usersQ.error.message : "Fehler"}
        </p>
      ) : null}
      <div className="grid gap-4 sm:grid-cols-3">
        <StatsCard title="Endnutzer (geschätzt)" value={customers} hint="Nutzer mit Rolle USER" />
        <StatsCard title="KYC offen (global)" value={pendingKyc} />
        <StatsCard title="Transaktionen (gesamt)" value={statsQ.data?.transactionCount ?? "—"} />
      </div>
    </div>
  );
}

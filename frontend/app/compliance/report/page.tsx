"use client";

import { useQuery } from "@tanstack/react-query";
import { ApiError, api } from "@/lib/api";
import { StatsCard } from "@/components/dashboard/stats-card";

export default function ComplianceReportPage() {
  const q = useQuery({ queryKey: ["complianceReport"], queryFn: () => api.complianceReport() });

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-slate-100">Compliance-Report</h2>
      {q.error ? <p className="text-sm text-red-400">{q.error instanceof ApiError ? q.error.message : "Fehler"}</p> : null}
      <div className="grid gap-4 sm:grid-cols-3">
        <StatsCard title="Geflaggte TX (Anzahl)" value={q.data?.flaggedTransactionCount ?? "—"} />
        <StatsCard title="Blacklist-Einträge" value={q.data?.blacklistEntryCount ?? "—"} />
        <StatsCard title="KYC offen" value={q.data?.pendingKycUsers ?? "—"} />
      </div>
    </div>
  );
}

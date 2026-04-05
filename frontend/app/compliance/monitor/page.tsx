"use client";

import { useQuery } from "@tanstack/react-query";
import { ApiError, api } from "@/lib/api";
import { KYCBadge } from "@/components/compliance/kyc-badge";
import type { ComplianceMonitorAccount } from "@/lib/types";
import { cn } from "@/lib/utils";

function rowClass(row: ComplianceMonitorAccount): string {
  if (row.hasFlaggedActivity && row.isOnChainFrozen) {
    return "bg-red-950/45 border-l-4 border-orange-500";
  }
  if (row.hasFlaggedActivity) {
    return "bg-red-950/50 border-l-4 border-red-500";
  }
  if (row.isOnChainFrozen) {
    return "bg-orange-950/35 border-l-4 border-orange-500";
  }
  return "border-b border-slate-800/80";
}

export default function ComplianceMonitorPage() {
  const q = useQuery({
    queryKey: ["complianceMonitor"],
    queryFn: () => api.complianceMonitorAccounts(),
    refetchInterval: 15_000,
  });

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold text-slate-100">Compliance-Monitor</h2>
        <p className="text-sm text-slate-500">
          Geflaggte Konten (mindestens eine gesperrte/gemeldete Transaktion) sind rot hervorgehoben, on-chain eingefrorene
          Wallets orange. Beides gleichzeitig: roter Hintergrund mit orangem Rand.
        </p>
      </div>
      {q.error ? (
        <p className="text-sm text-red-400">{q.error instanceof ApiError ? q.error.message : "Fehler"}</p>
      ) : null}
      <div className="overflow-x-auto rounded-lg border border-slate-800">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-800 bg-slate-900/80 text-slate-400">
            <tr>
              <th className="p-3">E-Mail</th>
              <th className="p-3">Rolle</th>
              <th className="p-3">KYC</th>
              <th className="p-3">Wallet</th>
              <th className="p-3">Aktiv</th>
              <th className="p-3">Risiko</th>
            </tr>
          </thead>
          <tbody>
            {(q.data ?? []).map((row: ComplianceMonitorAccount) => (
              <tr key={row.id} className={cn(rowClass(row))}>
                <td className="p-3 text-slate-200">{row.email}</td>
                <td className="p-3 text-slate-400">{row.role}</td>
                <td className="p-3">
                  <KYCBadge status={row.kycStatus} />
                </td>
                <td className="p-3 font-mono text-xs text-slate-500">{row.walletAddress ?? "—"}</td>
                <td className="p-3">{row.isActive ? "Ja" : "Nein"}</td>
                <td className="p-3 text-xs">
                  {row.hasFlaggedActivity ? <span className="mr-2 text-red-400">Geflaggte TX</span> : null}
                  {row.isOnChainFrozen ? <span className="text-orange-400">Eingefroren</span> : null}
                  {!row.hasFlaggedActivity && !row.isOnChainFrozen ? (
                    <span className="text-slate-600">—</span>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

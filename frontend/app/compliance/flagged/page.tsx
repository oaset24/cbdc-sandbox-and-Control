"use client";

import { useQuery } from "@tanstack/react-query";
import { ApiError, api } from "@/lib/api";
import { FlagBadge } from "@/components/compliance/flag-badge";
import type { TransactionRow } from "@/lib/types";

export default function ComplianceFlaggedPage() {
  const q = useQuery({ queryKey: ["flagged"], queryFn: () => api.flagged() });

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-slate-100">Geflaggte Transaktionen</h2>
      {q.error ? <p className="text-sm text-red-400">{q.error instanceof ApiError ? q.error.message : "Fehler"}</p> : null}
      <div className="overflow-x-auto rounded-lg border border-slate-800">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-800 bg-slate-900/80 text-slate-400">
            <tr>
              <th className="p-3">Zeit</th>
              <th className="p-3">Betrag</th>
              <th className="p-3">Von / Nach</th>
              <th className="p-3">Flag</th>
            </tr>
          </thead>
          <tbody>
            {(q.data ?? []).map((t: TransactionRow) => (
              <tr key={t.id} className="border-b border-slate-800/80">
                <td className="p-3 text-slate-400">{new Date(t.createdAt).toLocaleString("de-DE")}</td>
                <td className="p-3 text-slate-200">{t.amount}</td>
                <td className="p-3 font-mono text-xs text-slate-500">
                  {t.from.slice(0, 8)}… → {t.to.slice(0, 8)}…
                </td>
                <td className="p-3">
                  <FlagBadge flagged={t.flagged} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

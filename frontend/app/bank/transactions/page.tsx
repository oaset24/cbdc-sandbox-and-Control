"use client";

import { useQuery } from "@tanstack/react-query";
import { ApiError, api } from "@/lib/api";
import { FlagBadge } from "@/components/compliance/flag-badge";
import type { TransactionRow } from "@/lib/types";

export default function BankTransactionsPage() {
  const txsQ = useQuery({
    queryKey: ["transactions"],
    queryFn: () => api.transactions(),
  });

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-slate-100">Transaktionen</h2>
      {txsQ.error ? (
        <p className="text-sm text-red-400">{txsQ.error instanceof ApiError ? txsQ.error.message : "Fehler"}</p>
      ) : null}
      <div className="overflow-x-auto rounded-lg border border-slate-800">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-800 bg-slate-900/80 text-slate-400">
            <tr>
              <th className="p-3">Zeit</th>
              <th className="p-3">Von</th>
              <th className="p-3">Nach</th>
              <th className="p-3">Betrag</th>
              <th className="p-3">Status</th>
              <th className="p-3">Flag</th>
              <th className="p-3">Nutzer</th>
            </tr>
          </thead>
          <tbody>
            {(txsQ.data ?? []).map((t: TransactionRow) => (
              <tr key={t.id} className={t.flagged ? "bg-amber-950/20" : "border-b border-slate-800/80"}>
                <td className="p-3 whitespace-nowrap text-slate-400">{new Date(t.createdAt).toLocaleString("de-DE")}</td>
                <td className="p-3 font-mono text-xs text-slate-500">{t.from.slice(0, 10)}…</td>
                <td className="p-3 font-mono text-xs text-slate-500">{t.to.slice(0, 10)}…</td>
                <td className="p-3 text-slate-200">{t.amount}</td>
                <td className="p-3 text-slate-400">{t.status}</td>
                <td className="p-3">
                  <FlagBadge flagged={t.flagged} />
                </td>
                <td className="p-3 text-xs text-slate-500">{t.user?.email ?? t.userId}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

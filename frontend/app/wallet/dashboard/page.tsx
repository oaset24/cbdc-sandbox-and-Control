"use client";

import { useQuery } from "@tanstack/react-query";
import { ApiError, api } from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";
import { KYCBadge } from "@/components/compliance/kyc-badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FlagBadge } from "@/components/compliance/flag-badge";
import type { AuthUser, TransactionRow } from "@/lib/types";

export default function WalletDashboardPage() {
  const user = useAuthStore((s) => s.user);

  const meQ = useQuery({
    queryKey: ["me"],
    queryFn: () => api.me(),
    enabled: !!user,
  });

  const txsQ = useQuery({
    queryKey: ["txUser", user?.id],
    queryFn: () => api.transactionsForUser(user!.id),
    enabled: !!user?.id,
  });

  const u: AuthUser | null | undefined = meQ.data ?? user;
  const recent = (txsQ.data ?? []).slice(0, 5);

  return (
    <div className="space-y-6">
      <Card className="border-slate-800">
        <CardHeader>
          <CardTitle className="text-3xl font-semibold">Kontostand</CardTitle>
          <CardDescription>Übersicht und letzte Bewegungen</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-4xl font-bold tracking-tight text-blue-400">— CBDC</p>
          <p className="mt-2 text-sm text-slate-500">
            On-Chain-Saldo kann später über öffentliche Vertragsadresse + ethers im Browser ergänzt werden.
          </p>
          {u ? (
            <div className="mt-4 flex items-center gap-2 text-sm text-slate-400">
              <span>KYC:</span>
              <KYCBadge status={u.kycStatus} />
            </div>
          ) : null}
        </CardContent>
      </Card>
      {meQ.error || txsQ.error ? (
        <p className="text-sm text-red-400">
          {meQ.error instanceof ApiError ? meQ.error.message : txsQ.error instanceof ApiError ? txsQ.error.message : "Fehler"}
        </p>
      ) : null}
      <div>
        <h3 className="mb-2 text-lg font-medium text-slate-200">Letzte Transaktionen</h3>
        <ul className="space-y-2">
          {recent.length === 0 ? (
            <li className="text-sm text-slate-500">Noch keine Einträge.</li>
          ) : (
            recent.map((t: TransactionRow) => (
              <li
                key={t.id}
                className="flex items-center justify-between rounded-md border border-slate-800 bg-slate-900/40 px-3 py-2 text-sm"
              >
                <span className="text-slate-400">{new Date(t.createdAt).toLocaleString("de-DE")}</span>
                <span className="text-slate-200">
                  {t.amount} → {t.to.slice(0, 8)}…
                </span>
                <FlagBadge flagged={t.flagged} />
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
}

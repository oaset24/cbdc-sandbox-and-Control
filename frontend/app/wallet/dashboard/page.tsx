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

  const chainQ = useQuery({
    queryKey: ["onChainBalance"],
    queryFn: () => api.myOnChainBalance(),
    enabled: !!user,
    refetchInterval: 12_000,
  });

  const txsQ = useQuery({
    queryKey: ["txUser", user?.id],
    queryFn: () => api.transactionsForUser(user!.id),
    enabled: !!user?.id,
  });

  const u: AuthUser | null | undefined = meQ.data ?? user;
  const recent = (txsQ.data ?? []).slice(0, 5);

  const envContract = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS?.trim().toLowerCase() ?? "";
  const apiContract = chainQ.data?.contractAddress?.trim().toLowerCase() ?? "";
  const contractMismatch = Boolean(envContract && apiContract && envContract !== apiContract);

  const balanceLabel = chainQ.isPending
    ? "…"
    : chainQ.data?.balanceFormatted != null
      ? `${Number(chainQ.data.balanceFormatted).toLocaleString("de-DE", { maximumFractionDigits: 6 })} CBDC`
      : "— CBDC";

  return (
    <div className="space-y-6">
      <Card className="border-slate-800">
        <CardHeader>
          <CardTitle className="text-3xl font-semibold">Kontostand</CardTitle>
          <CardDescription>Übersicht und letzte Bewegungen</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-4xl font-bold tracking-tight text-blue-400">{balanceLabel}</p>
          {chainQ.data && !chainQ.data.chainAvailable ? (
            <p className="mt-2 text-sm text-amber-400/90">
              Blockchain im Backend nicht konfiguriert (BLOCKCHAIN_RPC_URL / CBDC_CONTRACT_ADDRESS) — angezeigter Wert ist Platzhalter.
            </p>
          ) : null}
          {chainQ.data?.address == null ? (
            <p className="mt-2 text-sm text-slate-500">Keine Wallet-Adresse im Profil — On-Chain-Saldo nicht abfragbar.</p>
          ) : (
            <p className="mt-2 font-mono text-xs text-slate-500">Wallet: {chainQ.data.address}</p>
          )}
          {apiContract ? (
            <p className="mt-1 font-mono text-xs text-slate-600">
              Vertrag (Backend): {chainQ.data?.contractAddress}
            </p>
          ) : null}
          {envContract ? (
            <p className="mt-1 font-mono text-xs text-slate-600">NEXT_PUBLIC_CONTRACT_ADDRESS: {process.env.NEXT_PUBLIC_CONTRACT_ADDRESS}</p>
          ) : null}
          {contractMismatch ? (
            <p className="mt-2 text-sm text-amber-400">
              Hinweis: Frontend- und Backend-Vertragsadresse weichen ab — bitte .env.local und backend/.env angleichen.
            </p>
          ) : null}
          {u ? (
            <div className="mt-4 flex items-center gap-2 text-sm text-slate-400">
              <span>KYC:</span>
              <KYCBadge status={u.kycStatus} />
            </div>
          ) : null}
        </CardContent>
      </Card>
      {meQ.error || txsQ.error || chainQ.error ? (
        <p className="text-sm text-red-400">
          {meQ.error instanceof ApiError
            ? meQ.error.message
            : txsQ.error instanceof ApiError
              ? txsQ.error.message
              : chainQ.error instanceof ApiError
                ? chainQ.error.message
                : "Fehler"}
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

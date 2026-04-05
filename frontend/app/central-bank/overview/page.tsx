"use client";

import { useQuery } from "@tanstack/react-query";
import { formatEther } from "ethers";
import { ApiError, api } from "@/lib/api";
import { StatsCard } from "@/components/dashboard/stats-card";
import { OverviewCharts } from "@/components/dashboard/overview-charts";

function startOfToday(): number {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

export default function CentralBankOverviewPage() {
  const statsQ = useQuery({
    queryKey: ["systemStats"],
    queryFn: () => api.systemStats(),
    refetchInterval: 10_000,
  });
  const flaggedQ = useQuery({
    queryKey: ["flagged"],
    queryFn: () => api.flagged(),
  });
  const txsQ = useQuery({
    queryKey: ["transactions"],
    queryFn: () => api.transactions(),
  });

  const err = statsQ.error ?? flaggedQ.error ?? txsQ.error;
  const errorMsg = err instanceof ApiError ? err.message : err ? "Fehler beim Laden" : null;

  const todayStart = startOfToday();
  const txsToday =
    txsQ.data?.filter((t) => new Date(t.createdAt).getTime() >= todayStart).length ?? "—";

  let supply = "—";
  if (statsQ.data?.totalSupplyWei != null) {
    try {
      supply = `${formatEther(BigInt(statsQ.data.totalSupplyWei))} CBDC`;
    } catch {
      supply = statsQ.data.totalSupplyWei;
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-semibold text-slate-100">Übersicht</h2>
        <p className="text-sm text-slate-500">Kennzahlen und Trends (Charts teils Demo-Daten)</p>
      </div>
      {errorMsg ? <p className="text-sm text-red-400">{errorMsg}</p> : null}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatsCard
          title="Gesamtmenge (Umlauf)"
          value={supply}
          hint={
            statsQ.data?.cbdcContractAddress
              ? `Live totalSupply · Vertrag ${statsQ.data.cbdcContractAddress.slice(0, 10)}…`
              : "On-Chain totalSupply (Backend CBDC_CONTRACT_ADDRESS)"
          }
        />
        <StatsCard title="Aktive Nutzer" value={statsQ.data?.activeUsers ?? "—"} />
        <StatsCard title="Transaktionen heute" value={txsToday} />
        <StatsCard title="Geflaggte Vorgänge" value={flaggedQ.data?.length ?? "—"} />
      </div>
      {statsQ.data?.cbdcContractAddress ? (
        <p className="font-mono text-xs text-slate-600">
          CBDC-Vertrag: {statsQ.data.cbdcContractAddress}
        </p>
      ) : null}
      <OverviewCharts />
    </div>
  );
}

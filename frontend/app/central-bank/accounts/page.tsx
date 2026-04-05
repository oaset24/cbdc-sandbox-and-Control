"use client";

import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { ApiError, api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { KYCBadge } from "@/components/compliance/kyc-badge";
import type { UserRow } from "@/lib/types";

type Filter = "all" | "active" | "inactive" | "pending_kyc";

export default function CentralBankAccountsPage() {
  const [filter, setFilter] = useState<Filter>("all");
  const [freezeAddr, setFreezeAddr] = useState("");
  const [forceFrom, setForceFrom] = useState("");
  const [forceTo, setForceTo] = useState("");
  const [forceAmt, setForceAmt] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const usersQ = useQuery({
    queryKey: ["users"],
    queryFn: () => api.users(),
  });

  const rows = useMemo(() => {
    const list = usersQ.data ?? [];
    return list.filter((u) => {
      if (filter === "active") return u.isActive;
      if (filter === "inactive") return !u.isActive;
      if (filter === "pending_kyc") return u.kycStatus === "PENDING";
      return true;
    });
  }, [usersQ.data, filter]);

  async function freeze() {
    setErr(null);
    setMsg(null);
    try {
      const r = await api.freeze(freezeAddr);
      setMsg(`Eingefroren, Tx: ${r.txHash}`);
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : "Freeze fehlgeschlagen");
    }
  }

  async function unfreeze(addr: string) {
    setErr(null);
    setMsg(null);
    try {
      const r = await api.unfreeze(addr);
      setMsg(`Freigegeben, Tx: ${r.txHash}`);
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : "Unfreeze fehlgeschlagen");
    }
  }

  async function force() {
    setErr(null);
    setMsg(null);
    try {
      const r = await api.forceTransfer(forceFrom, forceTo, forceAmt);
      setMsg(`Zwangsüberweisung, Tx: ${r.txHash}`);
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : "Force-Transfer fehlgeschlagen");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        {(
          [
            ["all", "Alle"],
            ["active", "Aktiv"],
            ["inactive", "Inaktiv"],
            ["pending_kyc", "KYC offen"],
          ] as const
        ).map(([k, label]) => (
          <Button key={k} variant={filter === k ? "default" : "secondary"} size="sm" onClick={() => setFilter(k)}>
            {label}
          </Button>
        ))}
      </div>
      {usersQ.error ? (
        <p className="text-sm text-red-400">{usersQ.error instanceof ApiError ? usersQ.error.message : "Fehler"}</p>
      ) : null}
      {err ? <p className="text-sm text-red-400">{err}</p> : null}
      {msg ? <p className="text-sm text-emerald-400">{msg}</p> : null}

      <div className="overflow-x-auto rounded-lg border border-slate-800">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-800 bg-slate-900/80 text-slate-400">
            <tr>
              <th className="p-3">E-Mail</th>
              <th className="p-3">Rolle</th>
              <th className="p-3">KYC</th>
              <th className="p-3">Wallet</th>
              <th className="p-3">Aktiv</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((u: UserRow) => (
              <tr key={u.id} className="border-b border-slate-800/80">
                <td className="p-3 text-slate-200">{u.email}</td>
                <td className="p-3 text-slate-400">{u.role}</td>
                <td className="p-3">
                  <KYCBadge status={u.kycStatus} />
                </td>
                <td className="p-3 font-mono text-xs text-slate-500">{u.walletAddress ?? "—"}</td>
                <td className="p-3">{u.isActive ? "Ja" : "Nein"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-lg border border-slate-800 p-4">
          <h3 className="mb-3 text-sm font-medium text-slate-300">Konto einfrieren / freigeben</h3>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex-1 space-y-2">
              <Label>Adresse</Label>
              <Input value={freezeAddr} onChange={(e) => setFreezeAddr(e.target.value)} placeholder="0x…" />
            </div>
            <Button onClick={freeze}>Einfrieren</Button>
          </div>
          <p className="mt-2 text-xs text-slate-500">Freigabe pro Zeile: Schnellaktion für Demo-Wallet aus Tabelle kopieren.</p>
          {rows[0]?.walletAddress ? (
            <Button variant="outline" size="sm" className="mt-2" onClick={() => unfreeze(rows[0].walletAddress!)}>
              Unfreeze erste Wallet (Demo)
            </Button>
          ) : null}
        </div>
        <div className="rounded-lg border border-slate-800 p-4">
          <h3 className="mb-3 text-sm font-medium text-slate-300">Zwangsüberweisung</h3>
          <div className="space-y-2">
            <Label>Von</Label>
            <Input value={forceFrom} onChange={(e) => setForceFrom(e.target.value)} />
            <Label>Nach</Label>
            <Input value={forceTo} onChange={(e) => setForceTo(e.target.value)} />
            <Label>Betrag</Label>
            <Input value={forceAmt} onChange={(e) => setForceAmt(e.target.value)} />
            <Button onClick={force}>Ausführen</Button>
          </div>
        </div>
      </div>
    </div>
  );
}

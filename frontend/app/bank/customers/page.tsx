"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ApiError, api } from "@/lib/api";
import { KYCBadge } from "@/components/compliance/kyc-badge";
import { Button } from "@/components/ui/button";
import type { KYCStatus, UserRow } from "@/lib/types";

export default function BankCustomersPage() {
  const qc = useQueryClient();
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const usersQ = useQuery({
    queryKey: ["users"],
    queryFn: () => api.users(),
  });

  const endUsers = (usersQ.data ?? []).filter((u) => u.role === "USER");

  async function setKyc(id: string, status: KYCStatus) {
    setErr(null);
    setMsg(null);
    try {
      await api.updateUserKyc(id, status);
      setMsg(`KYC → ${status}`);
      await qc.invalidateQueries({ queryKey: ["users"] });
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : "Update fehlgeschlagen");
    }
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-slate-100">Kunden</h2>
      <p className="text-sm text-slate-500">
        Wallet-Zuweisung: aktuell kein dediziertes Backend-Feld-Update — bitte DB/Seed oder zukünftiges PATCH /users/:id/wallet.
      </p>
      {err ? <p className="text-sm text-red-400">{err}</p> : null}
      {msg ? <p className="text-sm text-emerald-400">{msg}</p> : null}
      <div className="overflow-x-auto rounded-lg border border-slate-800">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-800 bg-slate-900/80 text-slate-400">
            <tr>
              <th className="p-3">E-Mail</th>
              <th className="p-3">KYC</th>
              <th className="p-3">Wallet</th>
              <th className="p-3">Aktionen</th>
            </tr>
          </thead>
          <tbody>
            {endUsers.map((u: UserRow) => (
              <tr key={u.id} className="border-b border-slate-800/80">
                <td className="p-3 text-slate-200">{u.email}</td>
                <td className="p-3">
                  <KYCBadge status={u.kycStatus} />
                </td>
                <td className="p-3 font-mono text-xs text-slate-500">{u.walletAddress ?? "—"}</td>
                <td className="p-3">
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" variant="secondary" onClick={() => setKyc(u.id, "VERIFIED")}>
                      Verify
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setKyc(u.id, "REJECTED")}>
                      Ablehnen
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setKyc(u.id, "PENDING")}>
                      Reset
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ApiError, api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { BlacklistRow } from "@/lib/types";

export default function ComplianceBlacklistPage() {
  const qc = useQueryClient();
  const [address, setAddress] = useState("");
  const [reason, setReason] = useState("");
  const [err, setErr] = useState<string | null>(null);

  const listQ = useQuery({
    queryKey: ["blacklist"],
    queryFn: () => api.blacklist(),
  });

  async function add() {
    setErr(null);
    try {
      await api.addBlacklist(address, reason);
      setAddress("");
      setReason("");
      await qc.invalidateQueries({ queryKey: ["blacklist"] });
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : "Speichern fehlgeschlagen");
    }
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-slate-100">Blacklist</h2>
      <div className="max-w-md space-y-3 rounded-lg border border-slate-800 p-4">
        <div className="space-y-2">
          <Label>Adresse</Label>
          <Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="0x…" />
        </div>
        <div className="space-y-2">
          <Label>Grund</Label>
          <Input value={reason} onChange={(e) => setReason(e.target.value)} />
        </div>
        {err ? <p className="text-sm text-red-400">{err}</p> : null}
        <Button onClick={add} disabled={!address || reason.length < 3}>
          Eintragen
        </Button>
      </div>
      <div className="overflow-x-auto rounded-lg border border-slate-800">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-800 bg-slate-900/80 text-slate-400">
            <tr>
              <th className="p-3">Adresse</th>
              <th className="p-3">Grund</th>
              <th className="p-3">Zeit</th>
            </tr>
          </thead>
          <tbody>
            {(listQ.data ?? []).map((b: BlacklistRow) => (
              <tr key={b.id} className="border-b border-slate-800/80">
                <td className="p-3 font-mono text-xs text-slate-300">{b.address}</td>
                <td className="p-3 text-slate-400">{b.reason}</td>
                <td className="p-3 text-slate-500">{new Date(b.createdAt).toLocaleString("de-DE")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

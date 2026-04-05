"use client";

import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { ApiError, api } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import type { AuditLogRow } from "@/lib/types";

function downloadCsv(rows: AuditLogRow[]) {
  const header = ["id", "action", "userId", "createdAt", "details"];
  const lines = [
    header.join(";"),
    ...rows.map((r) =>
      [r.id, r.action, r.userId, r.createdAt, JSON.stringify(r.details)].map((c) => `"${String(c).replace(/"/g, '""')}"`).join(";"),
    ),
  ];
  const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `audit-export-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function AuditPage() {
  const [actionQ, setActionQ] = useState("");
  const [userQ, setUserQ] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const logsQ = useQuery({
    queryKey: ["auditLogs"],
    queryFn: () => api.auditLogs(),
  });

  const filtered = useMemo(() => {
    let list = logsQ.data ?? [];
    if (actionQ.trim()) list = list.filter((l) => l.action.toLowerCase().includes(actionQ.toLowerCase()));
    if (userQ.trim()) list = list.filter((l) => l.userId.includes(userQ.trim()));
    if (from) {
      const t = new Date(from).getTime();
      list = list.filter((l) => new Date(l.createdAt).getTime() >= t);
    }
    if (to) {
      const t = new Date(to).getTime();
      list = list.filter((l) => new Date(l.createdAt).getTime() <= t);
    }
    return list;
  }, [logsQ.data, actionQ, userQ, from, to]);

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-2">
          <Label>Aktion enthält</Label>
          <Input value={actionQ} onChange={(e) => setActionQ(e.target.value)} placeholder="MINT" />
        </div>
        <div className="space-y-2">
          <Label>User-ID</Label>
          <Input value={userQ} onChange={(e) => setUserQ(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Von Datum</Label>
          <Input type="datetime-local" value={from} onChange={(e) => setFrom(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Bis Datum</Label>
          <Input type="datetime-local" value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
      </div>
      <Button variant="secondary" onClick={() => logsQ.data && downloadCsv(filtered)} disabled={!filtered.length}>
        Export CSV ({filtered.length})
      </Button>
      {logsQ.error ? (
        <p className="text-sm text-red-400">{logsQ.error instanceof ApiError ? logsQ.error.message : "Fehler"}</p>
      ) : null}
      <div className="overflow-x-auto rounded-lg border border-slate-800">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-800 bg-slate-900/80 text-slate-400">
            <tr>
              <th className="p-3">Zeit</th>
              <th className="p-3">Aktion</th>
              <th className="p-3">User</th>
              <th className="p-3">Details</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((l) => (
              <tr key={l.id} className="border-b border-slate-800/80">
                <td className="p-3 whitespace-nowrap text-slate-400">{new Date(l.createdAt).toLocaleString("de-DE")}</td>
                <td className="p-3 text-slate-200">{l.action}</td>
                <td className="p-3 font-mono text-xs text-slate-500">{l.userId}</td>
                <td className="p-3 font-mono text-xs text-slate-500">{JSON.stringify(l.details)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

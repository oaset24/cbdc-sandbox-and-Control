"use client";

import { useState } from "react";
import { ApiError, api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function MintBurnPage() {
  const [mintTo, setMintTo] = useState("");
  const [mintAmt, setMintAmt] = useState("");
  const [burnFrom, setBurnFrom] = useState("");
  const [burnAmt, setBurnAmt] = useState("");
  const [log, setLog] = useState<string[]>([]);
  const [loading, setLoading] = useState<"mint" | "burn" | null>(null);
  const [error, setError] = useState<string | null>(null);

  function pushLog(line: string) {
    setLog((prev) => [`${new Date().toLocaleTimeString("de-DE")} — ${line}`, ...prev].slice(0, 12));
  }

  async function onMint(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading("mint");
    try {
      const r = await api.mint(mintTo, mintAmt);
      pushLog(`Mint tx: ${r.txHash}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Mint fehlgeschlagen");
    } finally {
      setLoading(null);
    }
  }

  async function onBurn(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading("burn");
    try {
      const r = await api.burn(burnFrom, burnAmt);
      pushLog(`Burn tx: ${r.txHash}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Burn fehlgeschlagen");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card className="border-slate-800">
        <CardHeader>
          <CardTitle>Mint</CardTitle>
          <CardDescription>Neue Token ausgeben (Blockchain erforderlich)</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onMint} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="mintTo">Empfänger-Adresse</Label>
              <Input id="mintTo" value={mintTo} onChange={(e) => setMintTo(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="mintAmt">Betrag</Label>
              <Input id="mintAmt" value={mintAmt} onChange={(e) => setMintAmt(e.target.value)} required />
            </div>
            <p className="text-xs text-slate-500">
              Zweck/Ablauf: optional später über erweiterte Admin-API anbinden.
            </p>
            <Button type="submit" disabled={loading !== null}>
              {loading === "mint" ? "…" : "Mint ausführen"}
            </Button>
          </form>
        </CardContent>
      </Card>
      <Card className="border-slate-800">
        <CardHeader>
          <CardTitle>Burn</CardTitle>
          <CardDescription>Token vernichten</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onBurn} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="burnFrom">Von Adresse</Label>
              <Input id="burnFrom" value={burnFrom} onChange={(e) => setBurnFrom(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="burnAmt">Betrag</Label>
              <Input id="burnAmt" value={burnAmt} onChange={(e) => setBurnAmt(e.target.value)} required />
            </div>
            <Button type="submit" variant="destructive" disabled={loading !== null}>
              {loading === "burn" ? "…" : "Burn ausführen"}
            </Button>
          </form>
        </CardContent>
      </Card>
      <div className="lg:col-span-2">
        {error ? <p className="mb-2 text-sm text-red-400">{error}</p> : null}
        <Card className="border-slate-800">
          <CardHeader>
            <CardTitle className="text-base">Letzte Aktionen</CardTitle>
          </CardHeader>
          <CardContent>
            {log.length === 0 ? (
              <p className="text-sm text-slate-500">Noch keine Einträge in dieser Sitzung.</p>
            ) : (
              <ul className="space-y-1 font-mono text-xs text-slate-400">
                {log.map((l) => (
                  <li key={l}>{l}</li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

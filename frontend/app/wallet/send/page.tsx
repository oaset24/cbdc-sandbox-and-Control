"use client";

import { useState } from "react";
import { ApiError, api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function WalletSendPage() {
  const [to, setTo] = useState("");
  const [amount, setAmount] = useState("");
  const [purpose, setPurpose] = useState("");
  const [step, setStep] = useState<1 | 2>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);

  async function submit() {
    setError(null);
    setLoading(true);
    try {
      const r = await api.transfer(to, amount, purpose || undefined);
      setDone(`Transaktion erfasst: ${r.id} (${r.status})`);
      setStep(1);
      setTo("");
      setAmount("");
      setPurpose("");
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Transfer fehlgeschlagen");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="max-w-lg border-slate-800">
      <CardHeader>
        <CardTitle>Überweisung</CardTitle>
        <CardDescription>Schritt {step} von 2</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error ? <p className="text-sm text-red-400">{error}</p> : null}
        {done ? <p className="text-sm text-emerald-400">{done}</p> : null}
        {step === 1 ? (
          <>
            <div className="space-y-2">
              <Label htmlFor="to">Empfänger (0x…)</Label>
              <Input id="to" value={to} onChange={(e) => setTo(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="amount">Betrag</Label>
              <Input id="amount" value={amount} onChange={(e) => setAmount(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="purpose">Verwendungszweck (optional)</Label>
              <Input id="purpose" value={purpose} onChange={(e) => setPurpose(e.target.value)} />
            </div>
            <Button type="button" onClick={() => setStep(2)} disabled={!to || !amount}>
              Weiter zur Bestätigung
            </Button>
          </>
        ) : (
          <>
            <p className="text-sm text-slate-400">
              Bitte prüfen: <strong className="text-slate-200">{amount}</strong> CBDC an{" "}
              <span className="font-mono text-xs">{to}</span>
            </p>
            <div className="flex gap-2">
              <Button variant="secondary" type="button" onClick={() => setStep(1)}>
                Zurück
              </Button>
              <Button type="button" onClick={submit} disabled={loading}>
                {loading ? "Sende…" : "Bestätigen & senden"}
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

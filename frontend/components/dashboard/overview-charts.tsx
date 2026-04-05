"use client";

import {
  Line,
  LineChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

const lineDemo = [
  { day: "Mo", tx: 12 },
  { day: "Di", tx: 19 },
  { day: "Mi", tx: 8 },
  { day: "Do", tx: 24 },
  { day: "Fr", tx: 18 },
  { day: "Sa", tx: 6 },
  { day: "So", tx: 4 },
];

const pieDemo = [
  { name: "Hausbank A", value: 42 },
  { name: "Hausbank B", value: 28 },
  { name: "Sonstige", value: 30 },
];

const COLORS = ["#2563eb", "#1d4ed8", "#475569"];

export function OverviewCharts() {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="rounded-lg border border-slate-800 bg-slate-900/40 p-4">
        <h3 className="mb-4 text-sm font-medium text-slate-300">Tägliche Transaktionen (Demo)</h3>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={lineDemo} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="day" stroke="#94a3b8" fontSize={12} />
              <YAxis stroke="#94a3b8" fontSize={12} />
              <Tooltip contentStyle={{ backgroundColor: "#0f172a", border: "1px solid #334155" }} />
              <Line type="monotone" dataKey="tx" stroke="#3b82f6" strokeWidth={2} dot={{ fill: "#3b82f6" }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="rounded-lg border border-slate-800 bg-slate-900/40 p-4">
        <h3 className="mb-4 text-sm font-medium text-slate-300">Verteilung nach Banken (Demo)</h3>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={pieDemo} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={false}>
                {pieDemo.map((_, i) => (
                  <Cell key={pieDemo[i].name} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ backgroundColor: "#0f172a", border: "1px solid #334155" }} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

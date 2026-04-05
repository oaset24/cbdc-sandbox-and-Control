import { RoleGate } from "@/components/auth/role-gate";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";

const nav = [
  { href: "/bank/overview", label: "Übersicht" },
  { href: "/bank/customers", label: "Kunden" },
  { href: "/bank/transactions", label: "Transaktionen" },
];

export default function BankLayout({ children }: { children: React.ReactNode }) {
  return (
    <RoleGate allowed="BANK">
      <DashboardShell title="Hausbank" nav={nav}>
        {children}
      </DashboardShell>
    </RoleGate>
  );
}

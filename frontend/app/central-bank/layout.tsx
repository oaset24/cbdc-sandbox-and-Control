import { RoleGate } from "@/components/auth/role-gate";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";

const nav = [
  { href: "/central-bank/overview", label: "Übersicht" },
  { href: "/central-bank/mint-burn", label: "Mint & Burn" },
  { href: "/central-bank/accounts", label: "Konten" },
  { href: "/central-bank/audit", label: "Audit" },
];

export default function CentralBankLayout({ children }: { children: React.ReactNode }) {
  return (
    <RoleGate allowed="CENTRAL_BANK">
      <DashboardShell title="Zentralbank" nav={nav}>
        {children}
      </DashboardShell>
    </RoleGate>
  );
}

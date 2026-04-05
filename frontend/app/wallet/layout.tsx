import { RoleGate } from "@/components/auth/role-gate";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";

const nav = [
  { href: "/wallet/dashboard", label: "Dashboard" },
  { href: "/wallet/send", label: "Senden" },
  { href: "/wallet/history", label: "Historie" },
];

export default function WalletLayout({ children }: { children: React.ReactNode }) {
  return (
    <RoleGate allowed="USER">
      <DashboardShell title="Wallet" nav={nav}>
        {children}
      </DashboardShell>
    </RoleGate>
  );
}

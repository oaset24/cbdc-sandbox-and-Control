import { RoleGate } from "@/components/auth/role-gate";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";

const nav = [
  { href: "/compliance/flagged", label: "Geflaggte TX" },
  { href: "/compliance/blacklist", label: "Blacklist" },
  { href: "/compliance/report", label: "Report" },
];

export default function ComplianceLayout({ children }: { children: React.ReactNode }) {
  return (
    <RoleGate allowed="COMPLIANCE">
      <DashboardShell title="Compliance" nav={nav}>
        {children}
      </DashboardShell>
    </RoleGate>
  );
}

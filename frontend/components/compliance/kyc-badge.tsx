import type { KYCStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

const styles: Record<KYCStatus, string> = {
  VERIFIED: "bg-emerald-900/50 text-emerald-200",
  PENDING: "bg-amber-900/50 text-amber-200",
  REJECTED: "bg-red-900/50 text-red-200",
};

export function KYCBadge({ status }: { status: KYCStatus }) {
  return (
    <span className={cn("inline-flex rounded px-2 py-0.5 text-xs font-medium", styles[status])}>{status}</span>
  );
}

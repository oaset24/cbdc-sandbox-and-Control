import { cn } from "@/lib/utils";

export function FlagBadge({ flagged }: { flagged: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex rounded px-2 py-0.5 text-xs font-medium",
        flagged ? "bg-amber-900/60 text-amber-200" : "bg-slate-800 text-slate-400",
      )}
    >
      {flagged ? "AML-Flag" : "OK"}
    </span>
  );
}

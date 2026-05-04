import { BadgeCheck, Clock, ShieldAlert, ShieldX } from "lucide-react";
import { cn } from "@/lib/utils";
import type { VerificationStatus } from "@/types/db";

const MAP: Record<
  VerificationStatus,
  { label: string; className: string; icon: React.ReactNode }
> = {
  verified: {
    label: "Verified athlete",
    className: "bg-emerald-50 text-emerald-700 border-emerald-200",
    icon: <BadgeCheck className="h-3.5 w-3.5" />,
  },
  pending: {
    label: "Verification pending",
    className: "bg-amber-50 text-amber-800 border-amber-200",
    icon: <Clock className="h-3.5 w-3.5" />,
  },
  unverified: {
    label: "Unverified",
    className: "bg-slate-50 text-slate-600 border-slate-200",
    icon: <ShieldAlert className="h-3.5 w-3.5" />,
  },
  rejected: {
    label: "Verification rejected",
    className: "bg-red-50 text-red-700 border-red-200",
    icon: <ShieldX className="h-3.5 w-3.5" />,
  },
};

export function VerifiedBadge({
  status,
  size = "md",
  showLabel = true,
  className,
}: {
  status: VerificationStatus;
  size?: "sm" | "md";
  showLabel?: boolean;
  className?: string;
}) {
  const cfg = MAP[status];
  return (
    <span
      title={cfg.label}
      className={cn(
        "inline-flex items-center gap-1 rounded-full border font-semibold",
        size === "sm" ? "px-1.5 py-0.5 text-[10px]" : "px-2 py-0.5 text-xs",
        cfg.className,
        className
      )}
    >
      {cfg.icon}
      {showLabel ? cfg.label : null}
    </span>
  );
}

export function VerifiedTick({ status }: { status: VerificationStatus }) {
  if (status !== "verified") return null;
  return (
    <BadgeCheck
      className="inline h-4 w-4 fill-emerald-500 text-white"
      aria-label="Verified athlete"
    />
  );
}

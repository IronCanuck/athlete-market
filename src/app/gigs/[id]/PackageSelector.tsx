"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Clock, RefreshCcw, Check } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { formatCurrencyCents, cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import type { GigPackage } from "@/types/db";

const TIER_LABEL: Record<string, string> = {
  basic: "Basic",
  standard: "Standard",
  premium: "Premium",
};

export function PackageSelector({
  gigId,
  packages,
}: {
  gigId: string;
  packages: GigPackage[];
}) {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState(packages[0]?.id);
  const selected = useMemo(
    () => packages.find((p) => p.id === selectedId) ?? packages[0],
    [packages, selectedId]
  );
  const [requirements, setRequirements] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function placeOrder() {
    if (!selected) return;
    setBusy(true);
    setError(null);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      router.push(`/sign-in?next=/gigs/${gigId}`);
      return;
    }

    const { data: gig } = await supabase
      .from("gigs")
      .select("athlete_id")
      .eq("id", gigId)
      .maybeSingle();
    if (!gig) {
      setError("This gig is no longer available.");
      setBusy(false);
      return;
    }

    const dueAt = new Date();
    dueAt.setDate(dueAt.getDate() + selected.delivery_days);

    const { data: order, error: orderErr } = await supabase
      .from("orders")
      .insert({
        gig_id: gigId,
        package_id: selected.id,
        athlete_id: gig.athlete_id,
        buyer_id: user.id,
        total_cents: selected.price_cents,
        requirements: requirements || null,
        due_at: dueAt.toISOString(),
        status: "pending",
      })
      .select("id")
      .single();

    if (orderErr) {
      setError(orderErr.message);
      setBusy(false);
      return;
    }
    router.push(`/orders/${order!.id}`);
  }

  return (
    <div className="card p-5">
      <div className="grid grid-cols-3 gap-1 rounded-md bg-[var(--color-bg-subtle)] p-1 text-sm">
        {packages.map((p) => (
          <button
            key={p.id}
            onClick={() => setSelectedId(p.id)}
            className={cn(
              "rounded px-2 py-1.5 font-medium transition",
              selectedId === p.id
                ? "bg-white text-[var(--color-fg)] shadow-sm"
                : "text-[var(--color-fg-muted)]"
            )}
          >
            {TIER_LABEL[p.tier] ?? p.tier}
          </button>
        ))}
      </div>

      {selected ? (
        <div className="mt-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">{selected.title}</h3>
            <div className="text-2xl font-semibold tracking-tight">
              {formatCurrencyCents(selected.price_cents)}
            </div>
          </div>
          {selected.description ? (
            <p className="text-sm text-[var(--color-fg-muted)]">{selected.description}</p>
          ) : null}
          <div className="flex items-center gap-4 text-xs text-[var(--color-fg-muted)]">
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" /> {selected.delivery_days}-day delivery
            </span>
            <span className="inline-flex items-center gap-1">
              <RefreshCcw className="h-3.5 w-3.5" /> {selected.revisions} revisions
            </span>
          </div>
          {selected.features?.length ? (
            <ul className="mt-2 space-y-1.5 text-sm">
              {selected.features.map((f) => (
                <li key={f} className="flex gap-2">
                  <Check className="h-4 w-4 text-[var(--color-success)]" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
          ) : null}

          <div>
            <label className="label">Anything the athlete should know?</label>
            <textarea
              className="input min-h-[5rem]"
              value={requirements}
              onChange={(e) => setRequirements(e.target.value)}
              placeholder="Brand details, talking points, preferred dates..."
            />
          </div>

          {error ? <p className="text-sm text-[var(--color-danger)]">{error}</p> : null}

          <Button onClick={placeOrder} disabled={busy} className="w-full">
            {busy ? "Placing order…" : `Continue (${formatCurrencyCents(selected.price_cents)})`}
          </Button>
          <p className="text-center text-[11px] text-[var(--color-fg-muted)]">
            You won&apos;t be charged until the athlete accepts.
          </p>
        </div>
      ) : null}
    </div>
  );
}

import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/Badge";
import { formatCurrencyCents, timeAgo } from "@/lib/utils";
import type { Order } from "@/types/db";

export const metadata = { title: "Earnings · Athlete Market" };

const PLATFORM_FEE = 0.1; // 10%

export default async function EarningsPage() {
  const { user } = await requireUser();
  const supabase = await createClient();
  const { data: rows } = await supabase
    .from("orders")
    .select("*")
    .eq("athlete_id", user.id)
    .order("created_at", { ascending: false });
  const orders = (rows ?? []) as Order[];
  const completed = orders.filter((o) => o.status === "completed");
  const grossCents = completed.reduce((s, o) => s + o.total_cents, 0);
  const feeCents = Math.round(grossCents * PLATFORM_FEE);
  const netCents = grossCents - feeCents;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Earnings</h1>
        <p className="mt-1 text-sm text-[var(--color-fg-muted)]">
          Athlete Market takes a flat 10% — you keep the rest.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Gross revenue" value={formatCurrencyCents(grossCents)} />
        <Stat label="Platform fee (10%)" value={`-${formatCurrencyCents(feeCents)}`} />
        <Stat label="Net earnings" value={formatCurrencyCents(netCents)} highlight />
      </div>

      <div className="card overflow-hidden">
        <div className="border-b p-4 font-semibold">Recent payouts</div>
        {completed.length === 0 ? (
          <div className="p-8 text-center text-sm text-[var(--color-fg-muted)]">
            No payouts yet.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-[var(--color-bg-subtle)] text-left text-xs uppercase tracking-wide text-[var(--color-fg-muted)]">
              <tr>
                <th className="p-4">Order</th>
                <th className="p-4">Status</th>
                <th className="p-4">Gross</th>
                <th className="p-4">Net</th>
                <th className="p-4">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {completed.map((o) => (
                <tr key={o.id}>
                  <td className="p-4 font-medium">#{o.id.slice(0, 8)}</td>
                  <td className="p-4">
                    <Badge variant="success">{o.status}</Badge>
                  </td>
                  <td className="p-4">{formatCurrencyCents(o.total_cents)}</td>
                  <td className="p-4 font-semibold">
                    {formatCurrencyCents(Math.round(o.total_cents * (1 - PLATFORM_FEE)))}
                  </td>
                  <td className="p-4 text-[var(--color-fg-muted)]">
                    {timeAgo(o.completed_at ?? o.created_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="card p-5">
      <div className="text-xs font-medium uppercase tracking-wide text-[var(--color-fg-muted)]">
        {label}
      </div>
      <div
        className={`mt-2 text-2xl font-semibold tracking-tight ${
          highlight ? "text-[var(--color-brand)]" : ""
        }`}
      >
        {value}
      </div>
    </div>
  );
}

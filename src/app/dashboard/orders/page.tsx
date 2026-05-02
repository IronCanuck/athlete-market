import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/Badge";
import { formatCurrencyCents, timeAgo } from "@/lib/utils";
import type { Gig, Order, Profile } from "@/types/db";

export const metadata = { title: "Orders · Athlete Market" };

type OrderRow = Order & {
  gig: Pick<Gig, "title">;
  buyer: Pick<Profile, "full_name" | "avatar_url">;
  athlete: Pick<Profile, "full_name" | "avatar_url">;
};

export default async function OrdersPage() {
  const { user, profile } = await requireUser();
  const supabase = await createClient();
  const isAthlete = profile?.role === "athlete";

  const { data } = await supabase
    .from("orders")
    .select(
      "*, gig:gigs(title), buyer:profiles!orders_buyer_id_fkey(full_name, avatar_url), athlete:profiles!orders_athlete_id_fkey(full_name, avatar_url)"
    )
    .or(`buyer_id.eq.${user.id},athlete_id.eq.${user.id}`)
    .order("created_at", { ascending: false });
  const orders = (data ?? []) as OrderRow[];

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Orders</h1>
        <p className="mt-1 text-sm text-[var(--color-fg-muted)]">
          {isAthlete ? "Orders placed on your gigs" : "Orders you've placed"} · {orders.length} total
        </p>
      </header>

      {orders.length === 0 ? (
        <div className="card p-10 text-center text-sm text-[var(--color-fg-muted)]">
          No orders yet.
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b bg-[var(--color-bg-subtle)] text-left text-xs uppercase tracking-wide text-[var(--color-fg-muted)]">
              <tr>
                <th className="p-4">Order</th>
                <th className="p-4">{isAthlete ? "Buyer" : "Athlete"}</th>
                <th className="p-4">Status</th>
                <th className="p-4">Total</th>
                <th className="p-4">Created</th>
                <th className="p-4 text-right">View</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {orders.map((o) => (
                <tr key={o.id}>
                  <td className="p-4">
                    <div className="font-medium">{o.gig?.title ?? "(deleted gig)"}</div>
                    <div className="text-xs text-[var(--color-fg-muted)]">#{o.id.slice(0, 8)}</div>
                  </td>
                  <td className="p-4">
                    {isAthlete ? o.buyer?.full_name ?? "—" : o.athlete?.full_name ?? "—"}
                  </td>
                  <td className="p-4">
                    <Badge variant={statusVariant(o.status)}>{o.status}</Badge>
                  </td>
                  <td className="p-4">{formatCurrencyCents(o.total_cents)}</td>
                  <td className="p-4 text-[var(--color-fg-muted)]">{timeAgo(o.created_at)}</td>
                  <td className="p-4 text-right">
                    <Link href={`/orders/${o.id}`} className="font-medium text-[var(--color-brand)]">
                      Open →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function statusVariant(status: string) {
  switch (status) {
    case "completed":
      return "success" as const;
    case "cancelled":
    case "disputed":
      return "danger" as const;
    case "delivered":
      return "warning" as const;
    default:
      return "brand" as const;
  }
}

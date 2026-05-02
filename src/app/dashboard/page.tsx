import Link from "next/link";
import { Plus, ShoppingBag, Wallet, Package, Sparkles, ArrowRight } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { ButtonLink } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { formatCurrencyCents, timeAgo } from "@/lib/utils";
import type { Order } from "@/types/db";

export const metadata = { title: "Dashboard · Athlete Market" };

export default async function DashboardOverviewPage() {
  const { user, profile } = await requireUser();
  const supabase = await createClient();
  const isAthlete = profile?.role === "athlete";

  let activeGigs = 0;
  let openOrders = 0;
  let earningsCents = 0;
  let recentOrders: Order[] = [];

  if (isAthlete) {
    const [{ count: gigsCount }, { count: ordersCount }, { data: completed }] =
      await Promise.all([
        supabase
          .from("gigs")
          .select("id", { count: "exact", head: true })
          .eq("athlete_id", user.id)
          .eq("status", "active"),
        supabase
          .from("orders")
          .select("id", { count: "exact", head: true })
          .eq("athlete_id", user.id)
          .in("status", ["pending", "accepted", "delivered"]),
        supabase
          .from("orders")
          .select("total_cents")
          .eq("athlete_id", user.id)
          .eq("status", "completed"),
      ]);
    activeGigs = gigsCount ?? 0;
    openOrders = ordersCount ?? 0;
    earningsCents = (completed ?? []).reduce(
      (sum, o) => sum + (o.total_cents ?? 0),
      0
    );

    const { data } = await supabase
      .from("orders")
      .select("*")
      .eq("athlete_id", user.id)
      .order("created_at", { ascending: false })
      .limit(5);
    recentOrders = (data ?? []) as Order[];
  } else {
    const { data } = await supabase
      .from("orders")
      .select("*")
      .eq("buyer_id", user.id)
      .order("created_at", { ascending: false })
      .limit(5);
    recentOrders = (data ?? []) as Order[];
  }

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Welcome back, {profile?.full_name?.split(" ")[0] ?? "athlete"}.
          </h1>
          <p className="mt-1 text-sm text-[var(--color-fg-muted)]">
            {isAthlete
              ? "Here's what's happening with your gigs."
              : "Hire student athletes for your next campaign."}
          </p>
        </div>
        {isAthlete ? (
          <ButtonLink href="/dashboard/gigs/new">
            <Plus className="h-4 w-4" /> Create gig
          </ButtonLink>
        ) : (
          <ButtonLink href="/browse">
            <Sparkles className="h-4 w-4" /> Find athletes
          </ButtonLink>
        )}
      </header>

      {isAthlete ? (
        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard label="Active gigs" value={activeGigs.toString()} icon={<Package className="h-4 w-4" />} />
          <StatCard label="Open orders" value={openOrders.toString()} icon={<ShoppingBag className="h-4 w-4" />} />
          <StatCard label="Total earnings" value={formatCurrencyCents(earningsCents)} icon={<Wallet className="h-4 w-4" />} />
        </div>
      ) : null}

      <div className="card">
        <div className="flex items-center justify-between border-b p-5">
          <h2 className="font-semibold">Recent orders</h2>
          <Link href="/dashboard/orders" className="text-sm font-medium text-[var(--color-brand)]">
            View all <ArrowRight className="inline h-3 w-3" />
          </Link>
        </div>
        {recentOrders.length === 0 ? (
          <div className="p-10 text-center text-sm text-[var(--color-fg-muted)]">
            No orders yet.{" "}
            {isAthlete
              ? "Once a buyer books a package on one of your gigs, they'll show up here."
              : "Browse gigs to place your first order."}
          </div>
        ) : (
          <div className="divide-y">
            {recentOrders.map((o) => (
              <Link
                key={o.id}
                href={`/orders/${o.id}`}
                className="flex items-center justify-between p-4 hover:bg-[var(--color-bg-subtle)]"
              >
                <div>
                  <div className="font-medium">Order #{o.id.slice(0, 8)}</div>
                  <div className="text-xs text-[var(--color-fg-muted)]">
                    Placed {timeAgo(o.created_at)}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant={statusVariant(o.status)}>{o.status}</Badge>
                  <div className="font-semibold">
                    {formatCurrencyCents(o.total_cents)}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
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

function StatCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="card p-5">
      <div className="flex items-center justify-between text-[var(--color-fg-muted)]">
        <span className="text-xs font-medium uppercase tracking-wide">{label}</span>
        <span className="grid h-8 w-8 place-items-center rounded-md bg-[var(--color-brand-soft)] text-[var(--color-brand)]">
          {icon}
        </span>
      </div>
      <div className="mt-3 text-2xl font-semibold tracking-tight">{value}</div>
    </div>
  );
}

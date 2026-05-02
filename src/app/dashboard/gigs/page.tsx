import Link from "next/link";
import { Plus, Pencil, Eye } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { ButtonLink } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { formatCurrencyCents } from "@/lib/utils";
import type { Gig, GigPackage } from "@/types/db";

export const metadata = { title: "My gigs · Athlete Market" };

export default async function GigsListPage() {
  const { user } = await requireUser();
  const supabase = await createClient();
  const { data } = await supabase
    .from("gigs")
    .select("*, packages:gig_packages(price_cents, tier)")
    .eq("athlete_id", user.id)
    .order("created_at", { ascending: false });
  const gigs = (data ?? []) as (Gig & { packages: Pick<GigPackage, "price_cents" | "tier">[] })[];

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">My gigs</h1>
          <p className="mt-1 text-sm text-[var(--color-fg-muted)]">
            Create and manage the services you offer.
          </p>
        </div>
        <ButtonLink href="/dashboard/gigs/new">
          <Plus className="h-4 w-4" /> Create gig
        </ButtonLink>
      </header>

      {gigs.length === 0 ? (
        <div className="card p-10 text-center">
          <h3 className="text-lg font-semibold">No gigs yet</h3>
          <p className="mt-1 text-sm text-[var(--color-fg-muted)]">
            Create your first gig — it takes about 5 minutes.
          </p>
          <ButtonLink href="/dashboard/gigs/new" className="mt-4">
            <Plus className="h-4 w-4" /> Create your first gig
          </ButtonLink>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b bg-[var(--color-bg-subtle)] text-left text-xs uppercase tracking-wide text-[var(--color-fg-muted)]">
              <tr>
                <th className="p-4">Gig</th>
                <th className="p-4">Status</th>
                <th className="p-4">Starting price</th>
                <th className="p-4">Orders</th>
                <th className="p-4">Rating</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {gigs.map((g) => {
                const min = g.packages?.length
                  ? Math.min(...g.packages.map((p) => p.price_cents))
                  : 0;
                return (
                  <tr key={g.id}>
                    <td className="p-4 font-medium">{g.title}</td>
                    <td className="p-4">
                      <Badge variant={g.status === "active" ? "success" : g.status === "paused" ? "warning" : "default"}>
                        {g.status}
                      </Badge>
                    </td>
                    <td className="p-4">{formatCurrencyCents(min)}</td>
                    <td className="p-4">{g.total_orders}</td>
                    <td className="p-4">
                      {g.rating ? `${g.rating.toFixed(2)} (${g.total_reviews})` : "—"}
                    </td>
                    <td className="p-4 text-right">
                      <div className="inline-flex gap-1">
                        <Link href={`/gigs/${g.id}`} className="rounded p-2 hover:bg-[var(--color-bg-subtle)]">
                          <Eye className="h-4 w-4" />
                        </Link>
                        <Link href={`/dashboard/gigs/${g.id}`} className="rounded p-2 hover:bg-[var(--color-bg-subtle)]">
                          <Pencil className="h-4 w-4" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

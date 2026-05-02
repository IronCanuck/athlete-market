import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Clock } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { formatCurrencyCents, timeAgo } from "@/lib/utils";
import type { Gig, GigPackage, Message, Order, Profile } from "@/types/db";
import { OrderActions } from "./OrderActions";
import { OrderThread } from "./OrderThread";

export const metadata = { title: "Order · Athlete Market" };

type OrderDetail = Order & {
  gig: Pick<Gig, "id" | "title" | "cover_image_url">;
  package: Pick<GigPackage, "title" | "tier" | "delivery_days">;
  buyer: Pick<Profile, "id" | "full_name" | "avatar_url">;
  athlete: Pick<Profile, "id" | "full_name" | "avatar_url" | "school">;
};

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { user } = await requireUser(`/sign-in?next=/orders/${id}`);
  const supabase = await createClient();

  const { data } = await supabase
    .from("orders")
    .select(
      "*, gig:gigs(id, title, cover_image_url), package:gig_packages(title, tier, delivery_days), buyer:profiles!orders_buyer_id_fkey(id, full_name, avatar_url), athlete:profiles!orders_athlete_id_fkey(id, full_name, avatar_url, school)"
    )
    .eq("id", id)
    .maybeSingle();

  if (!data) notFound();
  const order = data as OrderDetail;

  const { data: msgRows } = await supabase
    .from("messages")
    .select("*")
    .eq("order_id", id)
    .order("created_at", { ascending: true });
  const messages = (msgRows ?? []) as Message[];

  const isAthlete = user.id === order.athlete_id;
  const counterparty = isAthlete ? order.buyer : order.athlete;

  return (
    <div className="container-page py-8">
      <Link href="/dashboard/orders" className="inline-flex items-center gap-1 text-sm text-[var(--color-fg-muted)] hover:text-[var(--color-fg)]">
        <ArrowLeft className="h-4 w-4" /> Back to orders
      </Link>

      <div className="mt-4 grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-6">
          <div className="card p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs text-[var(--color-fg-muted)]">Order #{order.id.slice(0, 8)}</div>
                <h1 className="text-xl font-semibold tracking-tight">
                  {order.gig?.title}
                </h1>
                <div className="mt-1 text-sm text-[var(--color-fg-muted)]">
                  {order.package?.title} · {order.package?.delivery_days}-day delivery
                </div>
              </div>
              <Badge variant={statusVariant(order.status)}>{order.status}</Badge>
            </div>
            {order.requirements ? (
              <div className="mt-5 rounded-md border bg-[var(--color-bg-subtle)] p-4 text-sm">
                <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-[var(--color-fg-muted)]">
                  Requirements
                </div>
                {order.requirements}
              </div>
            ) : null}
          </div>

          <div className="card">
            <div className="border-b p-4">
              <h2 className="font-semibold">Conversation</h2>
              <p className="text-xs text-[var(--color-fg-muted)]">
                Stay on Athlete Market so we can help with NIL compliance and disputes.
              </p>
            </div>
            <OrderThread orderId={order.id} initialMessages={messages} currentUserId={user.id} />
          </div>
        </div>

        <aside className="space-y-4">
          <div className="card p-5">
            <div className="text-xs uppercase tracking-wide text-[var(--color-fg-muted)]">
              {isAthlete ? "Buyer" : "Athlete"}
            </div>
            <div className="mt-2 flex items-center gap-3">
              <Avatar src={counterparty?.avatar_url} name={counterparty?.full_name} size={40} />
              <div>
                <div className="font-semibold">{counterparty?.full_name ?? "—"}</div>
                {!isAthlete && order.athlete?.school ? (
                  <div className="text-xs text-[var(--color-fg-muted)]">{order.athlete.school}</div>
                ) : null}
              </div>
            </div>
          </div>

          <div className="card p-5">
            <div className="flex items-center justify-between text-sm">
              <span className="text-[var(--color-fg-muted)]">Total</span>
              <span className="text-xl font-semibold tracking-tight">
                {formatCurrencyCents(order.total_cents)}
              </span>
            </div>
            {order.due_at ? (
              <div className="mt-3 flex items-center gap-2 text-sm text-[var(--color-fg-muted)]">
                <Clock className="h-4 w-4" />
                Due {new Date(order.due_at).toLocaleDateString()}
              </div>
            ) : null}
            <div className="mt-2 text-xs text-[var(--color-fg-muted)]">
              Placed {timeAgo(order.created_at)}
            </div>
          </div>

          <OrderActions
            orderId={order.id}
            status={order.status}
            role={isAthlete ? "athlete" : "buyer"}
            athleteId={order.athlete_id}
            buyerId={order.buyer_id}
            gigId={order.gig?.id ?? ""}
          />
        </aside>
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

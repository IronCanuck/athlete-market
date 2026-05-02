import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { timeAgo } from "@/lib/utils";
import type { Order, Profile, Message } from "@/types/db";

export const metadata = { title: "Messages · Athlete Market" };

type Row = Order & {
  buyer: Pick<Profile, "id" | "full_name" | "avatar_url">;
  athlete: Pick<Profile, "id" | "full_name" | "avatar_url">;
  messages: Pick<Message, "id" | "body" | "created_at">[];
};

export default async function MessagesPage() {
  const { user } = await requireUser();
  const supabase = await createClient();
  const { data } = await supabase
    .from("orders")
    .select(
      "*, buyer:profiles!orders_buyer_id_fkey(id, full_name, avatar_url), athlete:profiles!orders_athlete_id_fkey(id, full_name, avatar_url), messages(id, body, created_at)"
    )
    .or(`buyer_id.eq.${user.id},athlete_id.eq.${user.id}`)
    .order("updated_at", { ascending: false });
  const rows = (data ?? []) as Row[];

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Messages</h1>
        <p className="mt-1 text-sm text-[var(--color-fg-muted)]">
          One thread per order — keep your chat on Athlete Market for protection.
        </p>
      </header>
      {rows.length === 0 ? (
        <div className="card p-10 text-center text-sm text-[var(--color-fg-muted)]">
          No conversations yet.
        </div>
      ) : (
        <div className="card divide-y">
          {rows.map((o) => {
            const cp = o.buyer.id === user.id ? o.athlete : o.buyer;
            const last = o.messages?.length
              ? [...o.messages].sort(
                  (a, b) =>
                    new Date(b.created_at).getTime() -
                    new Date(a.created_at).getTime()
                )[0]
              : null;
            return (
              <Link
                key={o.id}
                href={`/orders/${o.id}`}
                className="flex items-center gap-4 p-4 hover:bg-[var(--color-bg-subtle)]"
              >
                <Avatar src={cp?.avatar_url} name={cp?.full_name} size={40} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{cp?.full_name ?? "Unknown"}</span>
                    <Badge>{o.status}</Badge>
                  </div>
                  <div className="truncate text-sm text-[var(--color-fg-muted)]">
                    {last?.body ?? "No messages yet."}
                  </div>
                </div>
                {last ? (
                  <div className="text-xs text-[var(--color-fg-muted)]">{timeAgo(last.created_at)}</div>
                ) : null}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

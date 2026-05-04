import Link from "next/link";
import { Trophy } from "lucide-react";
import { createClient, hasSupabaseEnv } from "@/lib/supabase/server";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { VerifiedTick } from "@/components/ui/VerifiedBadge";
import type { Profile } from "@/types/db";

export const metadata = { title: "Athletes · Athlete Market" };

export default async function AthletesPage() {
  let athletes: Profile[] = [];
  if (hasSupabaseEnv()) {
    const supabase = await createClient();
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("role", "athlete")
      .order("rating", { ascending: false })
      .limit(60);
    athletes = (data ?? []) as Profile[];
  }

  return (
    <div className="container-page py-10">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Athletes</h1>
        <p className="mt-1 text-sm text-[var(--color-fg-muted)]">
          Discover student athletes ready to work with brands and fans.
        </p>
      </header>

      {athletes.length === 0 ? (
        <div className="card mt-8 p-10 text-center text-sm text-[var(--color-fg-muted)]">
          No athletes yet. Be the first —{" "}
          <Link href="/sign-up?role=athlete" className="font-medium text-[var(--color-brand)]">
            join Athlete Market
          </Link>
          .
        </div>
      ) : (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {athletes.map((a) => (
            <Link key={a.id} href={`/athletes/${a.id}`} className="card flex items-start gap-4 p-5 transition hover:shadow-md">
              <Avatar src={a.avatar_url} name={a.full_name} size={56} />
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 font-semibold">
                  <span className="truncate">{a.full_name}</span>
                  <VerifiedTick status={a.verification_status} />
                </div>
                <div className="mt-0.5 text-xs text-[var(--color-fg-muted)]">
                  <span className="inline-flex items-center gap-1">
                    <Trophy className="h-3 w-3" /> {a.sport ?? "—"}
                    {a.position ? ` · ${a.position}` : ""}
                  </span>
                </div>
                {a.school ? (
                  <Badge variant="brand" className="mt-2">
                    {a.school}
                  </Badge>
                ) : null}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

import Link from "next/link";
import { notFound } from "next/navigation";
import { Trophy, MapPin, Star, AtSign, GraduationCap } from "lucide-react";
import { createClient, hasSupabaseEnv } from "@/lib/supabase/server";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { formatCurrencyCents } from "@/lib/utils";
import type { Gig, GigPackage, Profile } from "@/types/db";

export default async function AthleteProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!hasSupabaseEnv()) notFound();

  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (!profile) notFound();
  const athlete = profile as Profile;

  const { data: gigsRows } = await supabase
    .from("gigs")
    .select("*, packages:gig_packages(price_cents)")
    .eq("athlete_id", id)
    .eq("status", "active");
  const gigs = (gigsRows ?? []) as (Gig & { packages: Pick<GigPackage, "price_cents">[] })[];

  return (
    <div className="container-page py-10">
      <div className="card overflow-hidden">
        <div className="h-32 bg-gradient-to-r from-orange-100 via-amber-100 to-rose-100" />
        <div className="px-6 pb-6">
          <div className="-mt-10 flex flex-wrap items-end justify-between gap-4">
            <div className="flex items-end gap-4">
              <Avatar src={athlete.avatar_url} name={athlete.full_name} size={88} className="ring-4 ring-white" />
              <div>
                <h1 className="text-2xl font-semibold tracking-tight">{athlete.full_name}</h1>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-[var(--color-fg-muted)]">
                  {athlete.sport ? (
                    <span className="inline-flex items-center gap-1">
                      <Trophy className="h-3.5 w-3.5" /> {athlete.sport}
                      {athlete.position ? ` · ${athlete.position}` : ""}
                    </span>
                  ) : null}
                  {athlete.school ? (
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" /> {athlete.school}
                    </span>
                  ) : null}
                  {athlete.academic_year ? (
                    <span className="inline-flex items-center gap-1">
                      <GraduationCap className="h-3.5 w-3.5" /> {athlete.academic_year}
                    </span>
                  ) : null}
                  {athlete.rating ? (
                    <span className="inline-flex items-center gap-1">
                      <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                      {athlete.rating.toFixed(2)} ({athlete.total_reviews})
                    </span>
                  ) : null}
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-3 text-sm text-[var(--color-fg-muted)]">
              {athlete.social_instagram ? (
                <a className="inline-flex items-center gap-1 hover:text-[var(--color-fg)]" href={`https://instagram.com/${athlete.social_instagram.replace(/^@/, "")}`} target="_blank" rel="noreferrer">
                  <AtSign className="h-4 w-4" /> {athlete.social_instagram}
                </a>
              ) : null}
              {athlete.social_twitter ? (
                <a className="inline-flex items-center gap-1 hover:text-[var(--color-fg)]" href={`https://twitter.com/${athlete.social_twitter.replace(/^@/, "")}`} target="_blank" rel="noreferrer">
                  <AtSign className="h-4 w-4" /> {athlete.social_twitter}
                </a>
              ) : null}
            </div>
          </div>
          {athlete.bio ? (
            <p className="mt-6 max-w-3xl text-sm text-[var(--color-fg)]">{athlete.bio}</p>
          ) : null}
        </div>
      </div>

      <section className="mt-10">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold tracking-tight">Gigs</h2>
          <span className="text-sm text-[var(--color-fg-muted)]">{gigs.length} active</span>
        </div>
        {gigs.length === 0 ? (
          <div className="card p-10 text-center text-sm text-[var(--color-fg-muted)]">
            This athlete hasn&apos;t published any gigs yet.
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {gigs.map((g) => {
              const min = g.packages?.length
                ? Math.min(...g.packages.map((p) => p.price_cents))
                : 0;
              return (
                <Link key={g.id} href={`/gigs/${g.id}`} className="card overflow-hidden hover:shadow-md">
                  <div className="aspect-[5/3] w-full bg-gradient-to-br from-orange-100 to-rose-50">
                    {g.cover_image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={g.cover_image_url} alt={g.title} className="h-full w-full object-cover" />
                    ) : null}
                  </div>
                  <div className="p-4">
                    <div className="line-clamp-2 font-semibold">{g.title}</div>
                    <div className="mt-2 flex items-center justify-between text-sm">
                      <Badge variant="brand">{g.tags?.[0] ?? "Gig"}</Badge>
                      <span className="text-[var(--color-fg-muted)]">
                        From <span className="font-semibold text-[var(--color-fg)]">{formatCurrencyCents(min)}</span>
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

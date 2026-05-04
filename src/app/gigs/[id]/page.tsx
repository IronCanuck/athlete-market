import { notFound } from "next/navigation";
import Link from "next/link";
import {
  Star,
  Clock,
  RefreshCcw,
  CheckCircle2,
  MapPin,
  Trophy,
  AtSign,
} from "lucide-react";
import { createClient, hasSupabaseEnv } from "@/lib/supabase/server";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { VerifiedBadge, VerifiedTick } from "@/components/ui/VerifiedBadge";
import { formatCurrencyCents, timeAgo } from "@/lib/utils";
import type { Gig, GigPackage, Profile, Review } from "@/types/db";
import { PackageSelector } from "./PackageSelector";

type GigDetail = Gig & {
  packages: GigPackage[];
  athlete: Profile;
  category: { name: string; slug: string } | null;
};

export default async function GigPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!hasSupabaseEnv()) notFound();

  const supabase = await createClient();
  const { data } = await supabase
    .from("gigs")
    .select(
      "*, packages:gig_packages(*), athlete:profiles!gigs_athlete_id_fkey(*), category:categories(name, slug)"
    )
    .eq("id", id)
    .maybeSingle();

  if (!data) notFound();
  const gig = data as GigDetail;

  const { data: reviewRows } = await supabase
    .from("reviews")
    .select("*, buyer:profiles!reviews_buyer_id_fkey(full_name, avatar_url)")
    .eq("gig_id", id)
    .order("created_at", { ascending: false })
    .limit(20);
  const reviews = (reviewRows ?? []) as (Review & {
    buyer: { full_name: string | null; avatar_url: string | null };
  })[];

  const sortedPackages = [...gig.packages].sort((a, b) => a.price_cents - b.price_cents);

  return (
    <div className="container-page py-8">
      <nav className="text-sm text-[var(--color-fg-muted)]">
        <Link href="/browse" className="hover:underline">
          Browse
        </Link>
        {gig.category ? (
          <>
            {" / "}
            <Link href={`/browse?category=${gig.category.slug}`} className="hover:underline">
              {gig.category.name}
            </Link>
          </>
        ) : null}
      </nav>

      <div className="mt-4 grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-8">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
              {gig.title}
            </h1>
            <div className="mt-3 flex items-center gap-3 text-sm">
              <Avatar src={gig.athlete.avatar_url} name={gig.athlete.full_name} size={36} />
              <Link href={`/athletes/${gig.athlete.id}`} className="inline-flex items-center gap-1 font-medium hover:underline">
                {gig.athlete.full_name}
                <VerifiedTick status={gig.athlete.verification_status} />
              </Link>
              <span className="inline-flex items-center gap-1 text-[var(--color-fg-muted)]">
                <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                {gig.rating?.toFixed(2) ?? "—"}{" "}
                <span>({gig.total_reviews ?? 0} reviews)</span>
              </span>
              <Badge variant="brand">{gig.athlete.school}</Badge>
              {gig.athlete.verification_status === "verified" ? (
                <VerifiedBadge status="verified" size="sm" />
              ) : null}
            </div>
          </div>

          <div className="card aspect-[5/3] overflow-hidden bg-gradient-to-br from-orange-100 to-rose-50">
            {gig.cover_image_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={gig.cover_image_url} alt={gig.title} className="h-full w-full object-cover" />
            ) : null}
          </div>

          <section className="card p-6">
            <h2 className="text-lg font-semibold">About this gig</h2>
            <p className="mt-3 whitespace-pre-line text-[var(--color-fg)]">
              {gig.description ?? "No description provided."}
            </p>
            {gig.tags?.length ? (
              <div className="mt-4 flex flex-wrap gap-2">
                {gig.tags.map((t) => (
                  <Badge key={t}>{t}</Badge>
                ))}
              </div>
            ) : null}
          </section>

          <section className="card p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">About the athlete</h2>
              <Link href={`/athletes/${gig.athlete.id}`} className="text-sm font-medium text-[var(--color-brand)]">
                View full profile →
              </Link>
            </div>
            <div className="mt-4 flex gap-4">
              <Avatar src={gig.athlete.avatar_url} name={gig.athlete.full_name} size={64} />
              <div className="min-w-0">
                <div className="font-semibold">{gig.athlete.full_name}</div>
                <div className="text-sm text-[var(--color-fg-muted)]">
                  <span className="inline-flex items-center gap-1">
                    <Trophy className="h-3.5 w-3.5" /> {gig.athlete.sport}
                    {gig.athlete.position ? ` · ${gig.athlete.position}` : ""}
                  </span>
                  {gig.athlete.school ? (
                    <span className="ml-3 inline-flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" /> {gig.athlete.school}
                    </span>
                  ) : null}
                </div>
                {gig.athlete.bio ? (
                  <p className="mt-2 text-sm text-[var(--color-fg)]">{gig.athlete.bio}</p>
                ) : null}
                <div className="mt-3 flex items-center gap-3 text-sm text-[var(--color-fg-muted)]">
                  {gig.athlete.social_instagram ? (
                    <a className="inline-flex items-center gap-1 hover:text-[var(--color-fg)]" href={`https://instagram.com/${gig.athlete.social_instagram.replace(/^@/, "")}`} target="_blank" rel="noreferrer">
                      <AtSign className="h-4 w-4" /> {gig.athlete.social_instagram}
                    </a>
                  ) : null}
                  {gig.athlete.social_twitter ? (
                    <a className="inline-flex items-center gap-1 hover:text-[var(--color-fg)]" href={`https://twitter.com/${gig.athlete.social_twitter.replace(/^@/, "")}`} target="_blank" rel="noreferrer">
                      <AtSign className="h-4 w-4" /> {gig.athlete.social_twitter}
                    </a>
                  ) : null}
                </div>
              </div>
            </div>
          </section>

          <section className="card p-6">
            <h2 className="text-lg font-semibold">Reviews</h2>
            {reviews.length === 0 ? (
              <p className="mt-3 text-sm text-[var(--color-fg-muted)]">
                No reviews yet — be the first to work with this athlete.
              </p>
            ) : (
              <div className="mt-4 divide-y">
                {reviews.map((r) => (
                  <div key={r.id} className="flex gap-3 py-4">
                    <Avatar src={r.buyer?.avatar_url} name={r.buyer?.full_name} size={32} />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 text-sm">
                        <span className="font-medium">{r.buyer?.full_name ?? "Anonymous"}</span>
                        <span className="text-[var(--color-fg-muted)]">{timeAgo(r.created_at)}</span>
                      </div>
                      <div className="mt-1 inline-flex">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`h-4 w-4 ${i < r.rating ? "fill-amber-400 text-amber-400" : "text-gray-300"}`}
                          />
                        ))}
                      </div>
                      {r.comment ? <p className="mt-1 text-sm">{r.comment}</p> : null}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        <aside className="lg:sticky lg:top-20 lg:self-start">
          {sortedPackages.length === 0 ? (
            <div className="card p-6 text-sm text-[var(--color-fg-muted)]">
              This gig has no packages yet.
            </div>
          ) : (
            <PackageSelector gigId={gig.id} packages={sortedPackages} />
          )}

          <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs">
            <Stat icon={<Clock className="h-4 w-4" />} label={`${sortedPackages[0]?.delivery_days ?? "—"}d`} sub="Delivery" />
            <Stat icon={<RefreshCcw className="h-4 w-4" />} label={`${sortedPackages[0]?.revisions ?? "—"}`} sub="Revisions" />
            <Stat icon={<CheckCircle2 className="h-4 w-4" />} label={`${gig.total_orders ?? 0}`} sub="Orders" />
          </div>
        </aside>
      </div>
    </div>
  );
}

function Stat({ icon, label, sub }: { icon: React.ReactNode; label: string; sub: string }) {
  return (
    <div className="card p-3">
      <div className="mx-auto inline-flex items-center gap-1 text-[var(--color-fg-muted)]">{icon}</div>
      <div className="mt-1 text-sm font-semibold">{label}</div>
      <div className="text-[10px] uppercase tracking-wide text-[var(--color-fg-muted)]">{sub}</div>
    </div>
  );
}

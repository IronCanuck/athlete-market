import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Trophy,
  MapPin,
  Star,
  AtSign,
  GraduationCap,
  School,
  Award,
  ExternalLink,
  Image as ImageIcon,
  Video,
  Link2,
  FileText,
} from "lucide-react";
import { createClient, hasSupabaseEnv } from "@/lib/supabase/server";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { VerifiedBadge } from "@/components/ui/VerifiedBadge";
import { formatCurrencyCents } from "@/lib/utils";
import {
  DIVISION_LABELS,
  type AthleteSport,
  type Gig,
  type GigPackage,
  type PortfolioItem,
  type Profile,
} from "@/types/db";

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

  const [{ data: gigsRows }, { data: sportsRows }, { data: portfolioRows }] =
    await Promise.all([
      supabase
        .from("gigs")
        .select("*, packages:gig_packages(price_cents)")
        .eq("athlete_id", id)
        .eq("status", "active"),
      supabase
        .from("athlete_sports")
        .select("*")
        .eq("athlete_id", id)
        .order("is_primary", { ascending: false }),
      supabase
        .from("portfolio_items")
        .select("*")
        .eq("athlete_id", id)
        .order("position")
        .order("created_at", { ascending: false })
        .limit(12),
    ]);

  const gigs = (gigsRows ?? []) as (Gig & { packages: Pick<GigPackage, "price_cents">[] })[];
  const sports = (sportsRows ?? []) as AthleteSport[];
  const portfolio = (portfolioRows ?? []) as PortfolioItem[];

  const wherePlay = [
    athlete.team_name,
    athlete.school,
    [athlete.school_city, athlete.school_state].filter(Boolean).join(", "),
  ].filter(Boolean);

  return (
    <div className="container-page py-10">
      <div className="card overflow-hidden">
        <div className="h-32 bg-gradient-to-r from-orange-100 via-amber-100 to-rose-100" />
        <div className="px-6 pb-6">
          <div className="-mt-10 flex flex-wrap items-end justify-between gap-4">
            <div className="flex items-end gap-4">
              <Avatar src={athlete.avatar_url} name={athlete.full_name} size={88} className="ring-4 ring-white" />
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl font-semibold tracking-tight">{athlete.full_name}</h1>
                  <VerifiedBadge status={athlete.verification_status} />
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-[var(--color-fg-muted)]">
                  {athlete.school ? (
                    <span className="inline-flex items-center gap-1">
                      <School className="h-3.5 w-3.5" /> {athlete.school}
                    </span>
                  ) : null}
                  {athlete.school_city || athlete.school_state ? (
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" />
                      {[athlete.school_city, athlete.school_state].filter(Boolean).join(", ")}
                    </span>
                  ) : null}
                  {athlete.academic_year ? (
                    <span className="inline-flex items-center gap-1">
                      <GraduationCap className="h-3.5 w-3.5" /> {athlete.academic_year}
                    </span>
                  ) : null}
                  {athlete.division ? (
                    <Badge variant="brand">{DIVISION_LABELS[athlete.division]}</Badge>
                  ) : null}
                  {athlete.conference ? <Badge>{athlete.conference}</Badge> : null}
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
              {athlete.social_tiktok ? (
                <a className="inline-flex items-center gap-1 hover:text-[var(--color-fg)]" href={`https://tiktok.com/@${athlete.social_tiktok.replace(/^@/, "")}`} target="_blank" rel="noreferrer">
                  <AtSign className="h-4 w-4" /> {athlete.social_tiktok}
                </a>
              ) : null}
            </div>
          </div>

          {athlete.bio ? (
            <p className="mt-6 max-w-3xl text-sm text-[var(--color-fg)]">{athlete.bio}</p>
          ) : null}

          {sports.length ? (
            <div className="mt-6 flex flex-wrap gap-2">
              {sports.map((s) => (
                <span
                  key={s.id}
                  className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium ${
                    s.is_primary
                      ? "border-[var(--color-brand)] bg-[var(--color-brand-soft)] text-[var(--color-brand)]"
                      : "bg-white text-[var(--color-fg)]"
                  }`}
                >
                  <Trophy className="h-3 w-3" />
                  {s.sport}
                  {s.position ? <span className="text-[var(--color-fg-muted)]">· {s.position}</span> : null}
                  {s.jersey_number ? <span className="text-[var(--color-fg-muted)]">· #{s.jersey_number}</span> : null}
                  {s.is_primary ? <Award className="h-3 w-3" /> : null}
                </span>
              ))}
            </div>
          ) : null}

          {wherePlay.length ? (
            <div className="mt-4 text-xs text-[var(--color-fg-muted)]">
              Plays for{" "}
              <span className="font-medium text-[var(--color-fg)]">
                {wherePlay.join(" · ")}
              </span>
            </div>
          ) : null}
        </div>
      </div>

      {portfolio.length ? (
        <section className="mt-10">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold tracking-tight">Portfolio</h2>
            <span className="text-sm text-[var(--color-fg-muted)]">{portfolio.length} item{portfolio.length === 1 ? "" : "s"}</span>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {portfolio.map((item) => (
              <a
                key={item.id}
                href={item.url}
                target="_blank"
                rel="noreferrer"
                className="card group overflow-hidden transition hover:shadow-md"
              >
                <div className="relative aspect-[5/3] bg-[var(--color-bg-subtle)]">
                  {(item.type === "image" || item.type === "video") &&
                  (item.thumbnail_url ?? item.url) ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.thumbnail_url ?? item.url}
                      alt={item.title ?? "portfolio"}
                      className="h-full w-full object-cover transition group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-[var(--color-fg-muted)]">
                      <PortfolioTypeIcon type={item.type} />
                    </div>
                  )}
                  <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide">
                    <PortfolioTypeIcon type={item.type} /> {item.type}
                  </span>
                  <span className="absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-full bg-white/90 text-[var(--color-fg)]">
                    <ExternalLink className="h-3.5 w-3.5" />
                  </span>
                </div>
                {item.title ? (
                  <div className="p-3">
                    <div className="line-clamp-1 font-medium text-sm">{item.title}</div>
                    {item.description ? (
                      <p className="mt-1 line-clamp-2 text-xs text-[var(--color-fg-muted)]">{item.description}</p>
                    ) : null}
                  </div>
                ) : null}
              </a>
            ))}
          </div>
        </section>
      ) : null}

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

function PortfolioTypeIcon({ type }: { type: PortfolioItem["type"] }) {
  switch (type) {
    case "video":
      return <Video className="h-3.5 w-3.5" />;
    case "link":
      return <Link2 className="h-3.5 w-3.5" />;
    case "document":
      return <FileText className="h-3.5 w-3.5" />;
    default:
      return <ImageIcon className="h-3.5 w-3.5" />;
  }
}

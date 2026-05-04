import Link from "next/link";
import { Search, Star, SlidersHorizontal } from "lucide-react";
import { createClient, hasSupabaseEnv } from "@/lib/supabase/server";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { VerifiedTick } from "@/components/ui/VerifiedBadge";
import { formatCurrencyCents } from "@/lib/utils";
import type { Category, Gig, Profile } from "@/types/db";

type SP = {
  q?: string;
  category?: string;
  sport?: string;
  school?: string;
  min?: string;
  max?: string;
  sort?: "newest" | "rating" | "price_asc" | "price_desc";
};

type GigRow = Gig & {
  athlete: Pick<
    Profile,
    "id" | "full_name" | "avatar_url" | "school" | "sport" | "verification_status"
  >;
  packages: { price_cents: number; tier: string }[];
};

export const metadata = { title: "Browse gigs · Athlete Market" };

export default async function BrowsePage({
  searchParams,
}: {
  searchParams: Promise<SP>;
}) {
  const sp = await searchParams;

  let categories: Category[] = [];
  let gigs: GigRow[] = [];
  let envOk = hasSupabaseEnv();

  if (envOk) {
    try {
      const supabase = await createClient();
      const { data: cats } = await supabase
        .from("categories")
        .select("*")
        .order("position");
      categories = (cats ?? []) as Category[];

      let query = supabase
        .from("gigs")
        .select(
          "*, athlete:profiles!gigs_athlete_id_fkey(id, full_name, avatar_url, school, sport, verification_status), packages:gig_packages(price_cents, tier)"
        )
        .eq("status", "active");

      if (sp.q) {
        query = query.ilike("title", `%${sp.q}%`);
      }
      if (sp.category) {
        const cat = categories.find((c) => c.slug === sp.category);
        if (cat) query = query.eq("category_id", cat.id);
      }

      switch (sp.sort) {
        case "rating":
          query = query.order("rating", { ascending: false });
          break;
        case "newest":
        default:
          query = query.order("created_at", { ascending: false });
      }

      const { data: rows } = await query.limit(60);
      gigs = (rows ?? []) as GigRow[];

      // Filter by athlete fields client-side (Supabase doesn't support nested where easily here)
      if (sp.sport) gigs = gigs.filter((g) => g.athlete?.sport === sp.sport);
      if (sp.school)
        gigs = gigs.filter((g) =>
          (g.athlete?.school ?? "")
            .toLowerCase()
            .includes(sp.school!.toLowerCase())
        );

      const min = sp.min ? Number(sp.min) * 100 : 0;
      const max = sp.max ? Number(sp.max) * 100 : Infinity;
      gigs = gigs.filter((g) => {
        const minPrice = g.packages?.length
          ? Math.min(...g.packages.map((p) => p.price_cents))
          : 0;
        return minPrice >= min && minPrice <= max;
      });

      if (sp.sort === "price_asc") {
        gigs.sort((a, b) =>
          minPriceOf(a.packages) - minPriceOf(b.packages)
        );
      } else if (sp.sort === "price_desc") {
        gigs.sort((a, b) =>
          minPriceOf(b.packages) - minPriceOf(a.packages)
        );
      }
    } catch {
      envOk = false;
    }
  }

  return (
    <div className="container-page py-8">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Browse gigs</h1>
          <p className="mt-1 text-sm text-[var(--color-fg-muted)]">
            {gigs.length} {gigs.length === 1 ? "result" : "results"}
            {sp.q ? ` for "${sp.q}"` : ""}
          </p>
        </div>
        <form className="flex gap-2" action="/browse">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-fg-muted)]" />
            <input name="q" defaultValue={sp.q ?? ""} className="input pl-10" placeholder="Search gigs" />
          </div>
          <button className="btn btn-primary">Search</button>
        </form>
      </header>

      <div className="grid gap-8 lg:grid-cols-[260px_minmax(0,1fr)]">
        <aside className="space-y-6">
          <div className="card p-5">
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
              <SlidersHorizontal className="h-4 w-4" /> Filters
            </div>
            <form action="/browse" className="space-y-5 text-sm">
              <input type="hidden" name="q" value={sp.q ?? ""} />

              <FilterGroup label="Category">
                <select name="category" defaultValue={sp.category ?? ""} className="input">
                  <option value="">All categories</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.slug}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </FilterGroup>

              <FilterGroup label="Sport">
                <select name="sport" defaultValue={sp.sport ?? ""} className="input">
                  <option value="">Any sport</option>
                  {[
                    "Basketball","Football","Soccer","Baseball","Softball","Volleyball","Track & Field","Tennis","Golf","Swimming","Wrestling","Lacrosse","Hockey",
                  ].map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </FilterGroup>

              <FilterGroup label="School">
                <input name="school" defaultValue={sp.school ?? ""} className="input" placeholder="Any school" />
              </FilterGroup>

              <FilterGroup label="Price (USD)">
                <div className="flex gap-2">
                  <input name="min" type="number" min="0" defaultValue={sp.min ?? ""} className="input" placeholder="Min" />
                  <input name="max" type="number" min="0" defaultValue={sp.max ?? ""} className="input" placeholder="Max" />
                </div>
              </FilterGroup>

              <FilterGroup label="Sort by">
                <select name="sort" defaultValue={sp.sort ?? "newest"} className="input">
                  <option value="newest">Newest</option>
                  <option value="rating">Top rated</option>
                  <option value="price_asc">Price: low to high</option>
                  <option value="price_desc">Price: high to low</option>
                </select>
              </FilterGroup>

              <button className="btn btn-primary w-full">Apply filters</button>
            </form>
          </div>
        </aside>

        <div>
          {!envOk ? (
            <EmptyState
              title="Connect Supabase to load real gigs"
              body="Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your env to power the marketplace."
            />
          ) : gigs.length === 0 ? (
            <EmptyState
              title="No gigs match those filters yet"
              body="Try broadening your search or clearing some filters."
            />
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {gigs.map((g) => (
                <GigCard key={g.id} gig={g} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function minPriceOf(pkgs: { price_cents: number }[] | null | undefined) {
  if (!pkgs?.length) return 0;
  return Math.min(...pkgs.map((p) => p.price_cents));
}

function GigCard({ gig }: { gig: GigRow }) {
  const minPrice = minPriceOf(gig.packages);
  return (
    <Link href={`/gigs/${gig.id}`} className="card group overflow-hidden transition hover:shadow-md">
      <div className="aspect-[5/3] w-full bg-gradient-to-br from-orange-100 to-rose-50">
        {gig.cover_image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={gig.cover_image_url} alt={gig.title} className="h-full w-full object-cover" />
        ) : null}
      </div>
      <div className="p-4">
        <div className="flex items-center gap-2 text-sm">
          <Avatar src={gig.athlete?.avatar_url} name={gig.athlete?.full_name} size={28} />
          <span className="inline-flex items-center gap-1 font-medium">
            {gig.athlete?.full_name}
            <VerifiedTick status={gig.athlete?.verification_status ?? "unverified"} />
          </span>
          {gig.athlete?.school ? (
            <Badge variant="brand" className="ml-auto">{gig.athlete.school}</Badge>
          ) : null}
        </div>
        <div className="mt-2 line-clamp-2 font-semibold">{gig.title}</div>
        <div className="mt-3 flex items-center justify-between text-sm">
          <span className="inline-flex items-center gap-1">
            <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
            {gig.rating?.toFixed(2) ?? "—"}{" "}
            <span className="text-[var(--color-fg-muted)]">({gig.total_reviews ?? 0})</span>
          </span>
          <span className="text-[var(--color-fg-muted)]">
            From <span className="font-semibold text-[var(--color-fg)]">{formatCurrencyCents(minPrice)}</span>
          </span>
        </div>
      </div>
    </Link>
  );
}

function FilterGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-1 text-xs font-medium uppercase tracking-wide text-[var(--color-fg-muted)]">
        {label}
      </div>
      {children}
    </div>
  );
}

function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="card p-10 text-center">
      <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-[var(--color-brand-soft)] text-[var(--color-brand)]">
        <Search className="h-5 w-5" />
      </div>
      <h3 className="mt-4 text-lg font-semibold">{title}</h3>
      <p className="mt-1 text-sm text-[var(--color-fg-muted)]">{body}</p>
    </div>
  );
}

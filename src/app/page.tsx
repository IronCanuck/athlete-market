import Link from "next/link";
import {
  ArrowRight,
  Search,
  ShieldCheck,
  Calendar,
  Wallet,
  Star,
  Trophy,
  AtSign,
  Dumbbell,
  Video,
  PenLine,
  Handshake,
  Camera,
  GraduationCap,
  Mic,
  CalendarHeart,
  type LucideIcon,
} from "lucide-react";
import { Logo } from "@/components/Logo";
import { ButtonLink } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { createClient, hasSupabaseEnv } from "@/lib/supabase/server";
import type { Category, Gig, Profile } from "@/types/db";
import { formatCurrencyCents } from "@/lib/utils";

const ICONS: Record<string, LucideIcon> = {
  Instagram: AtSign,
  Dumbbell,
  CalendarHeart,
  Video,
  PenLine,
  Handshake,
  Camera,
  GraduationCap,
  Mic,
};

const FALLBACK_CATEGORIES: Category[] = [
  { id: "1", slug: "social-media", name: "Social Media Promotions", description: "Posts, reels, and shoutouts.", icon: "Instagram", position: 1 },
  { id: "2", slug: "personal-coaching", name: "Personal Coaching", description: "1-on-1 lessons in your sport.", icon: "Dumbbell", position: 2 },
  { id: "3", slug: "appearances", name: "Event Appearances", description: "Camps, signings, charity events.", icon: "CalendarHeart", position: 3 },
  { id: "4", slug: "cameo-videos", name: "Personalized Videos", description: "Custom shoutouts and pump-ups.", icon: "Video", position: 4 },
  { id: "5", slug: "autographs", name: "Autographs", description: "Signed gear and memorabilia.", icon: "PenLine", position: 5 },
  { id: "6", slug: "brand-deals", name: "Brand Partnerships", description: "Long-form NIL collabs.", icon: "Handshake", position: 6 },
  { id: "7", slug: "content-creation", name: "Content Shoots", description: "Branded photo & video.", icon: "Camera", position: 7 },
  { id: "8", slug: "tutoring", name: "Tutoring", description: "Academic & recruiting help.", icon: "GraduationCap", position: 8 },
];

type FeaturedGig = Gig & {
  athlete: Pick<Profile, "id" | "full_name" | "avatar_url" | "school" | "sport">;
  packages: { price_cents: number }[];
};

export default async function HomePage() {
  let categories: Category[] = FALLBACK_CATEGORIES;
  let gigs: FeaturedGig[] = [];

  if (hasSupabaseEnv()) {
    try {
      const supabase = await createClient();
      const [{ data: cats }, { data: gigList }] = await Promise.all([
        supabase.from("categories").select("*").order("position"),
        supabase
          .from("gigs")
          .select(
            "*, athlete:profiles!gigs_athlete_id_fkey(id, full_name, avatar_url, school, sport), packages:gig_packages(price_cents)"
          )
          .eq("status", "active")
          .order("rating", { ascending: false })
          .limit(6),
      ]);
      if (cats && cats.length) categories = cats as Category[];
      gigs = (gigList ?? []) as FeaturedGig[];
    } catch {
      // ignore — fallback content is shown
    }
  }

  return (
    <>
      <Hero />
      <PopularSearches />
      <Categories categories={categories} />
      {gigs.length > 0 ? <FeaturedGigs gigs={gigs} /> : <DemoGigs />}
      <HowItWorks />
      <ForAthletes />
      <Trust />
      <FinalCTA />
    </>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden border-b">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(1100px 480px at 80% -10%, rgba(255, 90, 31, 0.18), transparent 60%), radial-gradient(800px 400px at 5% 0%, rgba(30, 41, 59, 0.07), transparent 60%)",
        }}
      />
      <div className="container-page grid items-center gap-12 py-20 md:grid-cols-12 md:py-28">
        <div className="md:col-span-7">
          <Badge variant="brand" className="mb-4">
            <Trophy className="h-3 w-3" /> Built for student athletes
          </Badge>
          <h1 className="text-4xl font-semibold leading-[1.05] tracking-tight md:text-6xl">
            Hire student athletes for{" "}
            <span className="text-[var(--color-brand)]">gigs that fit</span>{" "}
            their schedule.
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-[var(--color-fg-muted)]">
            Athlete Market is the marketplace where college athletes monetize
            their NIL with shoutouts, coaching, content, appearances, and more —
            all booked around their practice, training, and class schedules.
          </p>

          <form action="/browse" className="mt-7 flex max-w-xl items-center gap-2">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-fg-muted)]" />
              <input
                name="q"
                placeholder='Try "Instagram shoutout", "QB lesson", or "Auburn"'
                className="input pl-10"
              />
            </div>
            <button type="submit" className="btn btn-primary px-5">
              Search
            </button>
          </form>

          <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-[var(--color-fg-muted)]">
            <span className="inline-flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-[var(--color-success)]" />
              NIL-compliant
            </span>
            <span className="inline-flex items-center gap-2">
              <Calendar className="h-4 w-4 text-[var(--color-brand)]" />
              Schedule-aware delivery
            </span>
            <span className="inline-flex items-center gap-2">
              <Wallet className="h-4 w-4 text-[var(--color-brand)]" />
              Athletes keep 90%
            </span>
          </div>
        </div>

        <div className="md:col-span-5">
          <HeroCard />
        </div>
      </div>
    </section>
  );
}

function HeroCard() {
  return (
    <div className="relative">
      <div className="card relative z-10 overflow-hidden">
        <div className="aspect-[4/3] w-full bg-gradient-to-br from-orange-100 via-amber-50 to-rose-50">
          <div className="flex h-full flex-col justify-end p-6">
            <div className="flex items-center gap-3">
              <Avatar name="Maya Johnson" size={48} />
              <div>
                <div className="font-semibold">Maya Johnson</div>
                <div className="text-xs text-[var(--color-fg-muted)]">
                  Forward · UCLA Women&apos;s Basketball
                </div>
              </div>
              <Badge variant="success" className="ml-auto">
                <Star className="h-3 w-3 fill-current" /> 4.97
              </Badge>
            </div>
            <div className="mt-4 rounded-lg border bg-white/70 p-3 backdrop-blur">
              <div className="text-sm font-medium">
                I&apos;ll record a 60-second IG shoutout for your brand
              </div>
              <div className="mt-2 flex items-center justify-between text-sm">
                <span className="text-[var(--color-fg-muted)]">From</span>
                <span className="font-semibold">$75</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div
        aria-hidden
        className="absolute -right-6 -top-6 hidden h-40 w-40 rounded-full bg-[var(--color-brand-soft)] blur-2xl md:block"
      />
      <div
        aria-hidden
        className="absolute -bottom-6 -left-6 hidden h-48 w-48 rounded-full bg-orange-200/60 blur-3xl md:block"
      />
    </div>
  );
}

function PopularSearches() {
  const tags = [
    "Instagram shoutouts",
    "Football coaching",
    "Birthday videos",
    "Brand collabs",
    "Volleyball clinics",
    "NIL deals",
    "Game-used gear",
    "Recruiting advice",
  ];
  return (
    <div className="container-page py-6 text-sm">
      <div className="flex flex-wrap items-center gap-2 text-[var(--color-fg-muted)]">
        <span className="font-medium text-[var(--color-fg)]">Popular:</span>
        {tags.map((t) => (
          <Link
            key={t}
            href={`/browse?q=${encodeURIComponent(t)}`}
            className="rounded-full border px-3 py-1 hover:border-[var(--color-fg)] hover:text-[var(--color-fg)]"
          >
            {t}
          </Link>
        ))}
      </div>
    </div>
  );
}

function Categories({ categories }: { categories: Category[] }) {
  return (
    <section className="container-page py-16">
      <SectionHeader
        eyebrow="Categories"
        title="What can student athletes do for you?"
        subtitle="From a personal shoutout to long-form NIL partnerships — book talent that's already part of your community."
      />
      <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4">
        {categories.map((c) => {
          const Icon = ICONS[c.icon ?? ""] ?? Trophy;
          return (
            <Link
              key={c.id}
              href={`/browse?category=${c.slug}`}
              className="group card flex flex-col items-start gap-3 p-5 transition hover:-translate-y-0.5 hover:border-[var(--color-brand)] hover:shadow-md"
            >
              <span className="grid h-10 w-10 place-items-center rounded-lg bg-[var(--color-brand-soft)] text-[var(--color-brand)]">
                <Icon className="h-5 w-5" />
              </span>
              <div>
                <div className="font-semibold">{c.name}</div>
                <div className="mt-1 text-xs text-[var(--color-fg-muted)]">
                  {c.description}
                </div>
              </div>
              <span className="mt-auto inline-flex items-center gap-1 text-xs font-medium text-[var(--color-brand)] opacity-0 transition group-hover:opacity-100">
                Explore <ArrowRight className="h-3 w-3" />
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

function FeaturedGigs({ gigs }: { gigs: FeaturedGig[] }) {
  return (
    <section className="container-page py-16">
      <SectionHeader
        eyebrow="Trending now"
        title="Featured gigs"
        subtitle="Top-rated student athletes ready to deliver."
      />
      <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {gigs.map((g) => {
          const minPrice = g.packages?.length
            ? Math.min(...g.packages.map((p) => p.price_cents))
            : 0;
          return (
            <Link
              key={g.id}
              href={`/gigs/${g.id}`}
              className="card group overflow-hidden transition hover:shadow-md"
            >
              <div className="aspect-[5/3] w-full bg-gradient-to-br from-orange-100 to-rose-50">
                {g.cover_image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={g.cover_image_url}
                    alt={g.title}
                    className="h-full w-full object-cover"
                  />
                ) : null}
              </div>
              <div className="p-4">
                <div className="flex items-center gap-2 text-sm">
                  <Avatar
                    src={g.athlete.avatar_url}
                    name={g.athlete.full_name}
                    size={28}
                  />
                  <span className="font-medium">{g.athlete.full_name}</span>
                  <span className="text-[var(--color-fg-muted)]">
                    · {g.athlete.school ?? "—"}
                  </span>
                </div>
                <div className="mt-2 line-clamp-2 font-semibold">{g.title}</div>
                <div className="mt-3 flex items-center justify-between text-sm">
                  <span className="inline-flex items-center gap-1">
                    <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                    {g.rating?.toFixed(2) ?? "—"}{" "}
                    <span className="text-[var(--color-fg-muted)]">
                      ({g.total_reviews ?? 0})
                    </span>
                  </span>
                  <span className="text-[var(--color-fg-muted)]">
                    From{" "}
                    <span className="font-semibold text-[var(--color-fg)]">
                      {formatCurrencyCents(minPrice)}
                    </span>
                  </span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

function DemoGigs() {
  const demos = [
    {
      title: "I'll post a 60s Instagram shoutout for your brand",
      athlete: "Maya Johnson",
      school: "UCLA",
      sport: "Basketball",
      rating: 4.97,
      reviews: 128,
      from: 7500,
      gradient: "from-orange-100 to-rose-50",
    },
    {
      title: "1-on-1 quarterback film breakdown over Zoom",
      athlete: "Tyler Brooks",
      school: "Auburn",
      sport: "Football",
      rating: 4.92,
      reviews: 64,
      from: 12000,
      gradient: "from-amber-100 to-orange-50",
    },
    {
      title: "Custom 90-second hype video for your team",
      athlete: "Sofia Mendez",
      school: "USC",
      sport: "Soccer",
      rating: 5.0,
      reviews: 41,
      from: 9500,
      gradient: "from-rose-100 to-pink-50",
    },
  ];
  return (
    <section className="container-page py-16">
      <SectionHeader
        eyebrow="Trending now"
        title="Featured gigs"
        subtitle="A taste of what's possible — sign in to publish your own."
      />
      <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {demos.map((d) => (
          <div key={d.title} className="card overflow-hidden">
            <div
              className={`aspect-[5/3] w-full bg-gradient-to-br ${d.gradient}`}
            />
            <div className="p-4">
              <div className="flex items-center gap-2 text-sm">
                <Avatar name={d.athlete} size={28} />
                <span className="font-medium">{d.athlete}</span>
                <span className="text-[var(--color-fg-muted)]">
                  · {d.school} {d.sport}
                </span>
              </div>
              <div className="mt-2 line-clamp-2 font-semibold">{d.title}</div>
              <div className="mt-3 flex items-center justify-between text-sm">
                <span className="inline-flex items-center gap-1">
                  <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                  {d.rating}{" "}
                  <span className="text-[var(--color-fg-muted)]">
                    ({d.reviews})
                  </span>
                </span>
                <span className="text-[var(--color-fg-muted)]">
                  From{" "}
                  <span className="font-semibold text-[var(--color-fg)]">
                    {formatCurrencyCents(d.from)}
                  </span>
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    {
      title: "Find your athlete",
      desc: "Browse by sport, school, or category. Filter by price, rating, and delivery time.",
      icon: Search,
    },
    {
      title: "Pick a package",
      desc: "Every gig comes in three tiers — Basic, Standard, and Premium — with clear deliverables.",
      icon: Trophy,
    },
    {
      title: "Book around their schedule",
      desc: "Athletes set weekly availability so delivery dates always work around practice and class.",
      icon: Calendar,
    },
    {
      title: "Pay only when delivered",
      desc: "Funds are held in escrow and released when you accept the delivery. 100% buyer protection.",
      icon: ShieldCheck,
    },
  ];
  return (
    <section className="border-y bg-[var(--color-bg-subtle)]">
      <div className="container-page py-20">
        <SectionHeader
          eyebrow="How it works"
          title="From search to delivery in days, not weeks"
          subtitle="A streamlined experience for buyers and athletes alike."
        />
        <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {steps.map((s, i) => (
            <div key={s.title} className="card p-6">
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-lg bg-[var(--color-brand-soft)] text-[var(--color-brand)]">
                  <s.icon className="h-5 w-5" />
                </span>
                <span className="text-xs font-semibold text-[var(--color-fg-muted)]">
                  STEP {i + 1}
                </span>
              </div>
              <div className="mt-4 font-semibold">{s.title}</div>
              <p className="mt-1 text-sm text-[var(--color-fg-muted)]">
                {s.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ForAthletes() {
  return (
    <section className="container-page py-20">
      <div className="grid items-center gap-10 md:grid-cols-2">
        <div>
          <Badge variant="brand" className="mb-3">
            For athletes
          </Badge>
          <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">
            Earn on your schedule. Keep 90% of what you make.
          </h2>
          <p className="mt-4 text-[var(--color-fg-muted)]">
            Athlete Market was built specifically for student athletes. Set
            your weekly availability, choose what gigs you offer, and let buyers
            book around your training. Compliant with your school&apos;s NIL
            policies.
          </p>
          <ul className="mt-6 space-y-3 text-sm">
            <PerkRow text="Block out practice, weights, film, and class — buyers can only book your free windows." />
            <PerkRow text="Set tiered packages so you can take small or large jobs depending on your week." />
            <PerkRow text="Direct deposit to your bank — payouts within 48 hours of delivery." />
            <PerkRow text="NIL disclosure helpers and template contracts built in." />
          </ul>
          <div className="mt-7 flex gap-3">
            <ButtonLink href="/sign-up?role=athlete" size="lg">
              Become a seller
            </ButtonLink>
            <ButtonLink href="/how-it-works" variant="outline" size="lg">
              Learn more
            </ButtonLink>
          </div>
        </div>

        <div className="card overflow-hidden">
          <div className="border-b bg-[var(--color-bg-subtle)] p-4">
            <div className="text-xs font-semibold uppercase tracking-wide text-[var(--color-fg-muted)]">
              Weekly availability
            </div>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-7 gap-2 text-center text-xs">
              {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
                <div key={i} className="font-medium text-[var(--color-fg-muted)]">
                  {d}
                </div>
              ))}
              {[
                ["", "Class", "Class", "Class", "Class", "Class", ""],
                ["Free", "Practice", "Practice", "Practice", "Practice", "Free", "Game"],
                ["Free", "Free", "Free", "Free", "Free", "Free", ""],
              ].map((row, ri) =>
                row.map((cell, ci) => (
                  <div
                    key={`${ri}-${ci}`}
                    className={`rounded-md px-1.5 py-2 ${
                      cell === "Free"
                        ? "bg-emerald-50 text-emerald-700"
                        : cell === "Practice" || cell === "Game"
                          ? "bg-orange-50 text-[var(--color-brand)]"
                          : cell === "Class"
                            ? "bg-slate-100 text-slate-600"
                            : "bg-white"
                    }`}
                  >
                    {cell || "—"}
                  </div>
                ))
              )}
            </div>
            <div className="mt-5 grid grid-cols-3 gap-3 border-t pt-4 text-center">
              <Stat label="Avg payout" value="$240" />
              <Stat label="This month" value="$3.4k" />
              <Stat label="Active gigs" value="4" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Trust() {
  return (
    <section className="border-y bg-white">
      <div className="container-page grid gap-6 py-16 md:grid-cols-4">
        <Stat label="Active athletes" value="2,400+" />
        <Stat label="Gigs delivered" value="18,500+" />
        <Stat label="Avg rating" value="4.92★" />
        <Stat label="Schools represented" value="320+" />
      </div>
    </section>
  );
}

function FinalCTA() {
  return (
    <section className="container-page py-20">
      <div
        className="card overflow-hidden p-10 md:p-14"
        style={{
          background:
            "linear-gradient(135deg, rgba(255,90,31,0.08) 0%, rgba(255,90,31,0.02) 100%)",
        }}
      >
        <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
          <div>
            <Logo size={20} />
            <h2 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">
              The marketplace built for student-athletes.
            </h2>
            <p className="mt-2 max-w-2xl text-[var(--color-fg-muted)]">
              Join thousands of athletes turning their NIL into real income —
              and brands hiring talent that already lives in their community.
            </p>
          </div>
          <div className="flex gap-3">
            <ButtonLink href="/sign-up?role=athlete" size="lg">
              I&apos;m an athlete
            </ButtonLink>
            <ButtonLink href="/sign-up?role=buyer" variant="outline" size="lg">
              I want to hire
            </ButtonLink>
          </div>
        </div>
      </div>
    </section>
  );
}

function SectionHeader({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="max-w-3xl">
      {eyebrow ? (
        <div className="text-xs font-semibold uppercase tracking-widest text-[var(--color-brand)]">
          {eyebrow}
        </div>
      ) : null}
      <h2 className="mt-2 text-3xl font-semibold tracking-tight md:text-4xl">
        {title}
      </h2>
      {subtitle ? (
        <p className="mt-3 text-[var(--color-fg-muted)]">{subtitle}</p>
      ) : null}
    </div>
  );
}

function PerkRow({ text }: { text: string }) {
  return (
    <li className="flex gap-2">
      <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-success)]" />
      <span>{text}</span>
    </li>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-2xl font-semibold tracking-tight md:text-3xl">
        {value}
      </div>
      <div className="text-xs uppercase tracking-wider text-[var(--color-fg-muted)]">
        {label}
      </div>
    </div>
  );
}

import { ButtonLink } from "@/components/ui/Button";
import { ShieldCheck, Calendar, Wallet, Search, Trophy, MessagesSquare } from "lucide-react";

export const metadata = { title: "How it works · Athlete Market" };

export default function HowItWorksPage() {
  return (
    <div className="container-page py-16">
      <header className="max-w-3xl">
        <h1 className="text-4xl font-semibold tracking-tight">How Athlete Market works</h1>
        <p className="mt-3 text-lg text-[var(--color-fg-muted)]">
          The marketplace built specifically for student athletes — designed
          around training, class, and competition.
        </p>
      </header>

      <section className="mt-12 grid gap-6 md:grid-cols-2">
        <Step
          icon={<Search className="h-5 w-5" />}
          title="1. Discover"
          body="Browse gigs by sport, school, category, or price. Every athlete is verified and NIL-compliant."
        />
        <Step
          icon={<Trophy className="h-5 w-5" />}
          title="2. Pick a package"
          body="Each gig comes in three tiers — Basic, Standard, and Premium — with clear deliverables and timelines."
        />
        <Step
          icon={<Calendar className="h-5 w-5" />}
          title="3. Book on their schedule"
          body="Athletes set their weekly free windows — your delivery date is automatically realistic."
        />
        <Step
          icon={<MessagesSquare className="h-5 w-5" />}
          title="4. Collaborate in-app"
          body="Every order has a built-in message thread, file sharing, and revision tracking."
        />
        <Step
          icon={<ShieldCheck className="h-5 w-5" />}
          title="5. Pay only on delivery"
          body="We hold your payment in escrow. Funds release the moment you accept the delivery."
        />
        <Step
          icon={<Wallet className="h-5 w-5" />}
          title="6. Athletes get paid fast"
          body="Athletes keep 90% of what they earn. Payouts hit their bank within 48 hours."
        />
      </section>

      <div className="mt-16 flex flex-wrap gap-3">
        <ButtonLink href="/sign-up?role=athlete" size="lg">Become a seller</ButtonLink>
        <ButtonLink href="/browse" variant="outline" size="lg">Browse gigs</ButtonLink>
      </div>
    </div>
  );
}

function Step({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <div className="card p-6">
      <span className="grid h-10 w-10 place-items-center rounded-lg bg-[var(--color-brand-soft)] text-[var(--color-brand)]">
        {icon}
      </span>
      <h3 className="mt-4 font-semibold">{title}</h3>
      <p className="mt-1 text-sm text-[var(--color-fg-muted)]">{body}</p>
    </div>
  );
}

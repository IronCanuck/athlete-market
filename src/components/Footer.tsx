import Link from "next/link";
import { Logo } from "@/components/Logo";

export function Footer() {
  return (
    <footer className="mt-24 border-t bg-[var(--color-bg-subtle)]">
      <div className="container-page grid gap-10 py-12 md:grid-cols-4">
        <div className="space-y-3">
          <Logo />
          <p className="max-w-xs text-sm text-[var(--color-fg-muted)]">
            The marketplace built for student athletes. Earn around your
            practice, training, and class schedule.
          </p>
        </div>
        <FooterCol title="For Buyers">
          <FooterLink href="/browse">Browse gigs</FooterLink>
          <FooterLink href="/athletes">Find athletes</FooterLink>
          <FooterLink href="/categories">Categories</FooterLink>
          <FooterLink href="/how-it-works">How it works</FooterLink>
        </FooterCol>
        <FooterCol title="For Athletes">
          <FooterLink href="/sign-up?role=athlete">Become a seller</FooterLink>
          <FooterLink href="/dashboard">Dashboard</FooterLink>
          <FooterLink href="/dashboard/gigs/new">Create a gig</FooterLink>
          <FooterLink href="/nil-resources">NIL resources</FooterLink>
        </FooterCol>
        <FooterCol title="Athlete Market">
          <FooterLink href="/about">About</FooterLink>
          <FooterLink href="/trust">Trust &amp; safety</FooterLink>
          <FooterLink href="/terms">Terms</FooterLink>
          <FooterLink href="/privacy">Privacy</FooterLink>
        </FooterCol>
      </div>
      <div className="border-t">
        <div className="container-page flex flex-col items-center justify-between gap-2 py-5 text-xs text-[var(--color-fg-muted)] md:flex-row">
          <span>© {new Date().getFullYear()} Athlete Market. All rights reserved.</span>
          <span>Built for student athletes, on their schedule.</span>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h4 className="mb-3 text-sm font-semibold">{title}</h4>
      <ul className="space-y-2 text-sm text-[var(--color-fg-muted)]">{children}</ul>
    </div>
  );
}

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <li>
      <Link href={href} className="hover:text-[var(--color-fg)]">
        {children}
      </Link>
    </li>
  );
}

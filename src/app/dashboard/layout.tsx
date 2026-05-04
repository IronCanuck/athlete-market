import Link from "next/link";
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  MessageSquare,
  CalendarClock,
  Wallet,
  UserCircle2,
  LogOut,
  ShieldCheck,
  GalleryHorizontalEnd,
} from "lucide-react";
import { requireUser } from "@/lib/auth";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { VerifiedBadge } from "@/components/ui/VerifiedBadge";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, profile } = await requireUser();
  const isAthlete = profile?.role === "athlete";

  return (
    <div className="container-page py-8">
      <div className="grid gap-8 lg:grid-cols-[260px_minmax(0,1fr)]">
        <aside className="space-y-4">
          <div className="card p-5">
            <div className="flex items-center gap-3">
              <Avatar src={profile?.avatar_url} name={profile?.full_name} size={44} />
              <div className="min-w-0">
                <div className="truncate font-semibold">{profile?.full_name ?? user.email}</div>
                <div className="mt-0.5 text-xs text-[var(--color-fg-muted)]">
                  <Badge variant={isAthlete ? "brand" : "default"}>{profile?.role ?? "buyer"}</Badge>
                  {isAthlete && profile?.school ? (
                    <span className="ml-2">{profile.school}</span>
                  ) : null}
                </div>
              </div>
            </div>
            {isAthlete ? (
              <div className="mt-3">
                <VerifiedBadge status={profile?.verification_status ?? "unverified"} />
              </div>
            ) : null}
            {!profile?.onboarding_completed && isAthlete ? (
              <Link
                href="/onboarding/athlete"
                className="mt-3 block rounded-md bg-[var(--color-brand-soft)] px-3 py-2 text-xs font-medium text-[var(--color-brand)]"
              >
                Finish your profile →
              </Link>
            ) : null}
            {isAthlete && profile?.verification_status !== "verified" ? (
              <Link
                href="/dashboard/verification"
                className="mt-2 block rounded-md bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800"
              >
                Get verified →
              </Link>
            ) : null}
          </div>

          <nav className="card p-2 text-sm">
            <NavItem href="/dashboard" icon={<LayoutDashboard className="h-4 w-4" />}>Overview</NavItem>
            {isAthlete ? (
              <>
                <NavItem href="/dashboard/gigs" icon={<Package className="h-4 w-4" />}>My gigs</NavItem>
                <NavItem href="/dashboard/portfolio" icon={<GalleryHorizontalEnd className="h-4 w-4" />}>Portfolio</NavItem>
                <NavItem href="/dashboard/availability" icon={<CalendarClock className="h-4 w-4" />}>Availability</NavItem>
                <NavItem href="/dashboard/earnings" icon={<Wallet className="h-4 w-4" />}>Earnings</NavItem>
                <NavItem href="/dashboard/verification" icon={<ShieldCheck className="h-4 w-4" />}>Verification</NavItem>
              </>
            ) : null}
            <NavItem href="/dashboard/orders" icon={<ShoppingBag className="h-4 w-4" />}>Orders</NavItem>
            <NavItem href="/dashboard/messages" icon={<MessageSquare className="h-4 w-4" />}>Messages</NavItem>
            <NavItem href="/dashboard/profile" icon={<UserCircle2 className="h-4 w-4" />}>Profile</NavItem>
            <form action="/auth/sign-out" method="post">
              <button className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-left font-medium text-[var(--color-danger)] hover:bg-red-50">
                <LogOut className="h-4 w-4" /> Sign out
              </button>
            </form>
          </nav>
        </aside>

        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}

function NavItem({
  href,
  icon,
  children,
}: {
  href: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-md px-3 py-2 font-medium text-[var(--color-fg-muted)] hover:bg-[var(--color-bg-subtle)] hover:text-[var(--color-fg)]"
    >
      {icon}
      {children}
    </Link>
  );
}

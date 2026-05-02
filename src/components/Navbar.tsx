import Link from "next/link";
import { Search, LayoutDashboard, LogIn, UserPlus, MessageSquare } from "lucide-react";
import { Logo } from "@/components/Logo";
import { ButtonLink } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";
import { createClient, hasSupabaseEnv } from "@/lib/supabase/server";
import type { Profile } from "@/types/db";

export async function Navbar() {
  let user: { id: string } | null = null;
  let profile: Profile | null = null;

  if (hasSupabaseEnv()) {
    try {
      const supabase = await createClient();
      const {
        data: { user: u },
      } = await supabase.auth.getUser();
      user = u;
      if (u) {
        const { data } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", u.id)
          .maybeSingle();
        profile = data as Profile | null;
      }
    } catch {
      // Supabase unreachable; render unauthenticated UI.
    }
  }

  return (
    <header className="sticky top-0 z-40 border-b bg-white/85 backdrop-blur">
      <div className="container-page flex h-16 items-center gap-4">
        <Logo />

        <form action="/browse" className="ml-2 hidden flex-1 items-center md:flex">
          <div className="relative w-full max-w-xl">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-fg-muted)]" />
            <input
              name="q"
              placeholder="Search gigs, athletes, schools, sports..."
              className="input pl-10"
            />
          </div>
        </form>

        <nav className="ml-auto flex items-center gap-1">
          <Link
            href="/browse"
            className="hidden rounded-md px-3 py-2 text-sm font-medium text-[var(--color-fg-muted)] hover:text-[var(--color-fg)] md:inline"
          >
            Browse
          </Link>
          <Link
            href="/athletes"
            className="hidden rounded-md px-3 py-2 text-sm font-medium text-[var(--color-fg-muted)] hover:text-[var(--color-fg)] md:inline"
          >
            Athletes
          </Link>

          {user ? (
            <>
              <Link
                href="/dashboard/messages"
                className="rounded-md p-2 text-[var(--color-fg-muted)] hover:bg-[var(--color-bg-subtle)] hover:text-[var(--color-fg)]"
                aria-label="Messages"
              >
                <MessageSquare className="h-5 w-5" />
              </Link>
              <Link
                href="/dashboard"
                className="hidden items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-[var(--color-fg-muted)] hover:text-[var(--color-fg)] md:inline-flex"
              >
                <LayoutDashboard className="h-4 w-4" />
                Dashboard
              </Link>
              <Link
                href="/dashboard"
                className="ml-1 inline-flex items-center gap-2 rounded-full hover:opacity-90"
              >
                <Avatar src={profile?.avatar_url} name={profile?.full_name} size={36} />
              </Link>
            </>
          ) : (
            <>
              <ButtonLink href="/sign-in" variant="ghost" size="sm">
                <LogIn className="h-4 w-4" />
                Sign in
              </ButtonLink>
              <ButtonLink href="/sign-up" variant="primary" size="sm">
                <UserPlus className="h-4 w-4" />
                Join
              </ButtonLink>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}

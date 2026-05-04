import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PortfolioEditor } from "./PortfolioEditor";
import type { PortfolioItem } from "@/types/db";

export const metadata = { title: "Portfolio · Athlete Market" };

export default async function PortfolioPage() {
  const { user } = await requireUser();
  const supabase = await createClient();
  const { data } = await supabase
    .from("portfolio_items")
    .select("*")
    .eq("athlete_id", user.id)
    .order("position")
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Portfolio</h1>
        <p className="mt-1 text-sm text-[var(--color-fg-muted)]">
          Showcase your best content, highlights, brand work, and creator
          samples. Buyers love seeing past work.
        </p>
      </header>
      <PortfolioEditor userId={user.id} initial={(data ?? []) as PortfolioItem[]} />
    </div>
  );
}

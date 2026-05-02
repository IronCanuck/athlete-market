import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { AvailabilityEditor } from "./AvailabilityEditor";

export const metadata = { title: "Availability · Athlete Market" };

export default async function AvailabilityPage() {
  const { user } = await requireUser();
  const supabase = await createClient();
  const { data } = await supabase
    .from("availability")
    .select("*")
    .eq("athlete_id", user.id)
    .order("day_of_week");

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Availability</h1>
        <p className="mt-1 text-sm text-[var(--color-fg-muted)]">
          Tell buyers when you&apos;re free for gigs each week. Practice and class
          times stay private.
        </p>
      </header>
      <AvailabilityEditor initial={data ?? []} />
    </div>
  );
}

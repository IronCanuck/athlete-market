import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { GigForm } from "@/components/dashboard/GigForm";

export const metadata = { title: "Create a gig" };

export default async function NewGigPage() {
  await requireUser();
  const supabase = await createClient();
  const { data: cats } = await supabase
    .from("categories")
    .select("id, name, slug")
    .order("position");

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Create a new gig</h1>
        <p className="mt-1 text-sm text-[var(--color-fg-muted)]">
          Define what you offer and how buyers can book you.
        </p>
      </header>
      <GigForm categories={cats ?? []} />
    </div>
  );
}

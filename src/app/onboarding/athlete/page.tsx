import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { OnboardingForm } from "./OnboardingForm";
import type { AthleteSport } from "@/types/db";

export const metadata = { title: "Complete your athlete profile" };

export default async function AthleteOnboardingPage() {
  const { user, profile } = await requireUser();

  if (profile?.onboarding_completed && profile.role === "athlete") {
    redirect("/dashboard");
  }

  const supabase = await createClient();

  if (profile && profile.role !== "athlete") {
    await supabase.from("profiles").update({ role: "athlete" }).eq("id", user.id);
  }

  const { data: sportsRows } = await supabase
    .from("athlete_sports")
    .select("*")
    .eq("athlete_id", user.id)
    .order("is_primary", { ascending: false });

  return (
    <div className="container-page max-w-3xl py-10">
      <h1 className="text-3xl font-semibold tracking-tight">
        Tell us about you
      </h1>
      <p className="mt-2 text-[var(--color-fg-muted)]">
        We use this to power your public profile and match you with buyers
        looking for athletes like you.
      </p>
      <div className="mt-8">
        <OnboardingForm
          initial={profile}
          initialSports={(sportsRows ?? []) as AthleteSport[]}
          accountEmail={user.email ?? null}
        />
      </div>
    </div>
  );
}

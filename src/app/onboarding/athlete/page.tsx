import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { OnboardingForm } from "./OnboardingForm";

export const metadata = { title: "Complete your athlete profile" };

export default async function AthleteOnboardingPage() {
  const { user, profile } = await requireUser();

  if (profile?.onboarding_completed && profile.role === "athlete") {
    redirect("/dashboard");
  }

  // Ensure role is athlete
  if (profile && profile.role !== "athlete") {
    const supabase = await createClient();
    await supabase.from("profiles").update({ role: "athlete" }).eq("id", user.id);
  }

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
        <OnboardingForm initial={profile} />
      </div>
    </div>
  );
}

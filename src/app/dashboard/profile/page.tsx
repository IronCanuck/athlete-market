import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { ProfileForm } from "./ProfileForm";
import type { AthleteSport } from "@/types/db";

export const metadata = { title: "Profile · Athlete Market" };

export default async function ProfileSettingsPage() {
  const { user, profile } = await requireUser();
  const supabase = await createClient();
  const { data } = await supabase
    .from("athlete_sports")
    .select("*")
    .eq("athlete_id", user.id)
    .order("is_primary", { ascending: false });
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Profile</h1>
        <p className="mt-1 text-sm text-[var(--color-fg-muted)]">
          Update your public profile.
        </p>
      </header>
      <ProfileForm
        initial={profile}
        initialSports={(data ?? []) as AthleteSport[]}
      />
    </div>
  );
}

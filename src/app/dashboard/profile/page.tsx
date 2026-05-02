import { requireUser } from "@/lib/auth";
import { ProfileForm } from "./ProfileForm";

export const metadata = { title: "Profile · Athlete Market" };

export default async function ProfileSettingsPage() {
  const { profile } = await requireUser();
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Profile</h1>
        <p className="mt-1 text-sm text-[var(--color-fg-muted)]">
          Update your public profile.
        </p>
      </header>
      <ProfileForm initial={profile} />
    </div>
  );
}

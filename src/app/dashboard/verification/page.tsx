import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { VerifiedBadge } from "@/components/ui/VerifiedBadge";
import { VerificationForm } from "./VerificationForm";
import { timeAgo } from "@/lib/utils";
import type { Verification } from "@/types/db";

export const metadata = { title: "Verification · Athlete Market" };

const METHOD_LABEL: Record<string, string> = {
  edu_email: "School email (.edu)",
  roster_link: "Official roster link",
  id_card: "Athlete ID / student ID",
  nil_letter: "NIL clearance letter",
  coach_reference: "Coach or AD reference",
};

export default async function VerificationPage() {
  const { user, profile } = await requireUser();
  const supabase = await createClient();
  const { data } = await supabase
    .from("verifications")
    .select("*")
    .eq("athlete_id", user.id)
    .order("submitted_at", { ascending: false });
  const submissions = (data ?? []) as Verification[];

  const status = profile?.verification_status ?? "unverified";

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Athlete verification
          </h1>
          <p className="mt-1 text-sm text-[var(--color-fg-muted)]">
            Confirm you&apos;re a real student athlete to publish gigs and earn
            buyer trust with a green checkmark on your profile.
          </p>
        </div>
        <VerifiedBadge status={status} />
      </header>

      <div className="card p-5">
        <h2 className="text-base font-semibold">Status</h2>
        {status === "verified" ? (
          <p className="mt-2 text-sm text-emerald-700">
            You&apos;re fully verified — your profile shows a green checkmark and
            you can publish gigs.
          </p>
        ) : status === "pending" ? (
          <p className="mt-2 text-sm text-amber-700">
            We&apos;ve received your submission. Most reviews finish within 24
            hours.
          </p>
        ) : status === "rejected" ? (
          <p className="mt-2 text-sm text-red-700">
            Your last submission was rejected. Submit a new proof below.
          </p>
        ) : (
          <p className="mt-2 text-sm text-[var(--color-fg-muted)]">
            You&apos;re not verified yet. Submit one of the proofs below to get
            verified.
          </p>
        )}
      </div>

      <VerificationForm userId={user.id} accountEmail={user.email ?? null} />

      <div className="card">
        <div className="border-b p-4 font-semibold">Submission history</div>
        {submissions.length === 0 ? (
          <div className="p-6 text-center text-sm text-[var(--color-fg-muted)]">
            No submissions yet.
          </div>
        ) : (
          <ul className="divide-y">
            {submissions.map((s) => (
              <li key={s.id} className="flex items-start justify-between gap-3 p-4">
                <div>
                  <div className="font-medium">
                    {METHOD_LABEL[s.method] ?? s.method}
                  </div>
                  <div className="mt-0.5 text-xs text-[var(--color-fg-muted)]">
                    Submitted {timeAgo(s.submitted_at)}
                  </div>
                  {s.notes ? (
                    <p className="mt-1 text-sm">{s.notes}</p>
                  ) : null}
                </div>
                <VerifiedBadge status={s.status} size="sm" />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

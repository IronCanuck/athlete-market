import Link from "next/link";
import { ShieldAlert } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { GigForm } from "@/components/dashboard/GigForm";

export const metadata = { title: "Create a gig" };

export default async function NewGigPage() {
  const { profile } = await requireUser();
  const supabase = await createClient();
  const { data: cats } = await supabase
    .from("categories")
    .select("id, name, slug")
    .order("position");

  const isVerified = profile?.verification_status === "verified";

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Create a new gig</h1>
        <p className="mt-1 text-sm text-[var(--color-fg-muted)]">
          Define what you offer and how buyers can book you.
        </p>
      </header>

      {!isVerified ? (
        <div className="card flex items-start gap-3 border-amber-200 bg-amber-50 p-4 text-sm">
          <ShieldAlert className="mt-0.5 h-5 w-5 text-amber-700" />
          <div className="flex-1">
            <div className="font-semibold text-amber-900">
              You need to be a verified athlete to publish gigs.
            </div>
            <p className="mt-0.5 text-amber-800">
              You can save drafts now, but publishing is locked until you&apos;re
              verified.{" "}
              <Link href="/dashboard/verification" className="underline">
                Get verified →
              </Link>
            </p>
          </div>
        </div>
      ) : null}

      <GigForm categories={cats ?? []} canPublish={isVerified} />
    </div>
  );
}

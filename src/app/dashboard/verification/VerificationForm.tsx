"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Mail, Link2, Upload, FileText, Phone } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input, Textarea } from "@/components/ui/Input";
import { createClient } from "@/lib/supabase/client";
import { uploadToBucket } from "@/lib/storage";
import { cn } from "@/lib/utils";
import type { VerificationMethod } from "@/types/db";

type Method = VerificationMethod;

const METHODS: {
  id: Method;
  title: string;
  body: string;
  icon: React.ReactNode;
}[] = [
  {
    id: "edu_email",
    title: "School email",
    body: "Verify with your .edu address — fastest path.",
    icon: <Mail className="h-4 w-4" />,
  },
  {
    id: "roster_link",
    title: "Official roster link",
    body: "Paste a public link to your team's roster page.",
    icon: <Link2 className="h-4 w-4" />,
  },
  {
    id: "id_card",
    title: "Athlete ID / Student ID",
    body: "Upload a photo of your athlete or student ID (private).",
    icon: <Upload className="h-4 w-4" />,
  },
  {
    id: "nil_letter",
    title: "NIL clearance letter",
    body: "Upload your school's NIL clearance or compliance form.",
    icon: <FileText className="h-4 w-4" />,
  },
  {
    id: "coach_reference",
    title: "Coach / AD reference",
    body: "Provide your coach or AD's name + email; we'll reach out.",
    icon: <Phone className="h-4 w-4" />,
  },
];

export function VerificationForm({
  userId,
  accountEmail,
}: {
  userId: string;
  accountEmail: string | null;
}) {
  const router = useRouter();
  const [method, setMethod] = useState<Method>("edu_email");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const [eduEmail, setEduEmail] = useState(
    (accountEmail ?? "").toLowerCase().endsWith(".edu") ? accountEmail ?? "" : ""
  );
  const [rosterUrl, setRosterUrl] = useState("");
  const [referenceName, setReferenceName] = useState("");
  const [referenceEmail, setReferenceEmail] = useState("");
  const [referenceNotes, setReferenceNotes] = useState("");
  const [file, setFile] = useState<File | null>(null);

  async function submit() {
    setBusy(true);
    setError(null);
    setDone(false);
    try {
      const supabase = createClient();

      let proofUrl: string | null = null;
      const proofData: Record<string, unknown> = {};

      switch (method) {
        case "edu_email": {
          if (!eduEmail || !eduEmail.toLowerCase().endsWith(".edu")) {
            throw new Error("Please enter a valid .edu email address.");
          }
          proofData.email = eduEmail;
          break;
        }
        case "roster_link": {
          if (!rosterUrl.startsWith("http")) {
            throw new Error("Please enter a full URL (starting with http).");
          }
          proofData.roster_url = rosterUrl;
          break;
        }
        case "id_card":
        case "nil_letter": {
          if (!file) throw new Error("Please choose a file to upload.");
          const result = await uploadToBucket({
            bucket: "verification-docs",
            userId,
            file,
            prefix: method,
          });
          proofUrl = result.path;
          proofData.original_name = file.name;
          break;
        }
        case "coach_reference": {
          if (!referenceName || !referenceEmail) {
            throw new Error("Please provide the reference's name and email.");
          }
          proofData.name = referenceName;
          proofData.email = referenceEmail;
          proofData.notes = referenceNotes;
          break;
        }
      }

      const status =
        method === "edu_email" &&
        eduEmail.toLowerCase().endsWith(".edu") &&
        eduEmail.toLowerCase() === (accountEmail ?? "").toLowerCase()
          ? "verified"
          : "pending";

      const { error: insertErr } = await supabase.from("verifications").insert({
        athlete_id: userId,
        method,
        proof_url: proofUrl,
        proof_data: proofData,
        status,
        reviewed_at: status === "verified" ? new Date().toISOString() : null,
      });
      if (insertErr) throw insertErr;

      setDone(true);
      router.refresh();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Submission failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className="p-6">
      <h2 className="text-base font-semibold">Submit verification</h2>
      <p className="mt-1 text-sm text-[var(--color-fg-muted)]">
        Choose any method below — submit more than one to speed things up.
      </p>

      <div className="mt-4 grid gap-2 md:grid-cols-2">
        {METHODS.map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => setMethod(m.id)}
            className={cn(
              "flex items-start gap-3 rounded-lg border p-3 text-left transition",
              method === m.id
                ? "border-[var(--color-brand)] bg-[var(--color-brand-soft)]"
                : "hover:border-[var(--color-fg)]"
            )}
          >
            <span
              className={cn(
                "grid h-8 w-8 place-items-center rounded-md",
                method === m.id
                  ? "bg-[var(--color-brand)] text-white"
                  : "bg-[var(--color-bg-subtle)] text-[var(--color-fg-muted)]"
              )}
            >
              {m.icon}
            </span>
            <div>
              <div className="text-sm font-semibold">{m.title}</div>
              <div className="text-xs text-[var(--color-fg-muted)]">{m.body}</div>
            </div>
          </button>
        ))}
      </div>

      <div className="mt-5 space-y-3">
        {method === "edu_email" ? (
          <Input
            label="School email (.edu)"
            type="email"
            value={eduEmail}
            onChange={(e) => setEduEmail(e.target.value)}
            placeholder="you@school.edu"
            hint={
              accountEmail && eduEmail.toLowerCase() === accountEmail.toLowerCase()
                ? "Matches your account email — auto-approved."
                : "If different from your account email, this goes to manual review."
            }
          />
        ) : null}

        {method === "roster_link" ? (
          <Input
            label="Roster URL"
            type="url"
            value={rosterUrl}
            onChange={(e) => setRosterUrl(e.target.value)}
            placeholder="https://athletics.school.edu/roster/..."
            hint="Make sure your name appears on the page."
          />
        ) : null}

        {method === "id_card" || method === "nil_letter" ? (
          <div>
            <label className="label">
              Upload {method === "id_card" ? "ID photo" : "NIL letter"} (PDF or image)
            </label>
            <input
              type="file"
              accept="image/*,.pdf"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="block w-full text-sm file:mr-3 file:rounded-md file:border file:border-[var(--color-border)] file:bg-white file:px-3 file:py-1.5 file:text-sm file:font-medium hover:file:border-[var(--color-fg)]"
            />
            <p className="mt-1 text-xs text-[var(--color-fg-muted)]">
              Stored privately. Only you and our review team can see it.
            </p>
          </div>
        ) : null}

        {method === "coach_reference" ? (
          <div className="space-y-3">
            <Input
              label="Coach or AD name"
              value={referenceName}
              onChange={(e) => setReferenceName(e.target.value)}
            />
            <Input
              label="Coach or AD email"
              type="email"
              value={referenceEmail}
              onChange={(e) => setReferenceEmail(e.target.value)}
            />
            <Textarea
              label="Anything else we should mention?"
              value={referenceNotes}
              onChange={(e) => setReferenceNotes(e.target.value)}
            />
          </div>
        ) : null}
      </div>

      {error ? (
        <p className="mt-3 text-sm text-[var(--color-danger)]">{error}</p>
      ) : null}
      {done ? (
        <p className="mt-3 text-sm text-emerald-700">
          Submitted! We&apos;ll update your status soon.
        </p>
      ) : null}

      <div className="mt-5 flex justify-end">
        <Button onClick={submit} disabled={busy}>
          {busy ? "Submitting…" : "Submit for verification"}
        </Button>
      </div>
    </Card>
  );
}

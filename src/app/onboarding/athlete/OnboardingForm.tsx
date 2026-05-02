"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input, Select, Textarea } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { createClient } from "@/lib/supabase/client";
import type { AcademicYear, Profile } from "@/types/db";

const SPORTS = [
  "Basketball",
  "Football",
  "Soccer",
  "Baseball",
  "Softball",
  "Volleyball",
  "Track & Field",
  "Cross Country",
  "Tennis",
  "Golf",
  "Swimming",
  "Wrestling",
  "Gymnastics",
  "Lacrosse",
  "Hockey",
  "Rowing",
  "Other",
];

const YEARS: AcademicYear[] = [
  "freshman",
  "sophomore",
  "junior",
  "senior",
  "graduate",
];

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

type AvailabilityRow = {
  day_of_week: number;
  start_time: string;
  end_time: string;
};

export function OnboardingForm({ initial }: { initial: Profile | null }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [fullName, setFullName] = useState(initial?.full_name ?? "");
  const [username, setUsername] = useState(initial?.username ?? "");
  const [school, setSchool] = useState(initial?.school ?? "");
  const [sport, setSport] = useState(initial?.sport ?? "");
  const [position, setPosition] = useState(initial?.position ?? "");
  const [year, setYear] = useState<AcademicYear | "">(
    initial?.academic_year ?? ""
  );
  const [gradYear, setGradYear] = useState<string>(
    initial?.graduation_year?.toString() ?? ""
  );
  const [bio, setBio] = useState(initial?.bio ?? "");
  const [location, setLocation] = useState(initial?.location ?? "");
  const [instagram, setInstagram] = useState(initial?.social_instagram ?? "");
  const [twitter, setTwitter] = useState(initial?.social_twitter ?? "");
  const [tiktok, setTiktok] = useState(initial?.social_tiktok ?? "");
  const [nilEligible, setNilEligible] = useState(initial?.nil_eligible ?? true);

  const [availability, setAvailability] = useState<AvailabilityRow[]>([
    { day_of_week: 1, start_time: "16:00", end_time: "20:00" },
    { day_of_week: 6, start_time: "10:00", end_time: "18:00" },
  ]);

  function addAvailability() {
    setAvailability((rows) => [
      ...rows,
      { day_of_week: 0, start_time: "09:00", end_time: "12:00" },
    ]);
  }
  function removeAvailability(i: number) {
    setAvailability((rows) => rows.filter((_, idx) => idx !== i));
  }
  function updateAvailability(i: number, patch: Partial<AvailabilityRow>) {
    setAvailability((rows) =>
      rows.map((r, idx) => (idx === i ? { ...r, ...patch } : r))
    );
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setError("Not signed in.");
      setBusy(false);
      return;
    }

    const { error: profileError } = await supabase
      .from("profiles")
      .update({
        role: "athlete",
        full_name: fullName,
        username: username || null,
        school,
        sport,
        position: position || null,
        academic_year: year || null,
        graduation_year: gradYear ? Number(gradYear) : null,
        bio,
        location: location || null,
        social_instagram: instagram || null,
        social_twitter: twitter || null,
        social_tiktok: tiktok || null,
        nil_eligible: nilEligible,
        onboarding_completed: true,
      })
      .eq("id", user.id);

    if (profileError) {
      setError(profileError.message);
      setBusy(false);
      return;
    }

    // Replace availability rows
    await supabase.from("availability").delete().eq("athlete_id", user.id);
    if (availability.length) {
      await supabase.from("availability").insert(
        availability.map((a) => ({
          athlete_id: user.id,
          ...a,
        }))
      );
    }

    setBusy(false);
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <Card className="p-6">
        <h2 className="text-lg font-semibold">Identity</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <Input label="Full name" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
          <Input label="Username" value={username} onChange={(e) => setUsername(e.target.value)} hint="Used in your profile URL" />
          <Input label="Location" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="City, State" />
          <div className="flex items-center gap-2">
            <input id="nil" type="checkbox" checked={nilEligible} onChange={(e) => setNilEligible(e.target.checked)} className="h-4 w-4 rounded border-gray-300" />
            <label htmlFor="nil" className="text-sm">I&apos;ve completed my school&apos;s NIL onboarding.</label>
          </div>
        </div>
        <div className="mt-4">
          <Textarea label="Short bio" value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Tell buyers about your story, achievements, and what makes you a great collaborator." />
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="text-lg font-semibold">Athletic profile</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <Input label="School" value={school} onChange={(e) => setSchool(e.target.value)} placeholder="University of Alabama" required />
          <Select label="Sport" value={sport} onChange={(e) => setSport(e.target.value)} required>
            <option value="">Select a sport</option>
            {SPORTS.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </Select>
          <Input label="Position / event" value={position} onChange={(e) => setPosition(e.target.value)} placeholder="Point Guard, QB, 100m..." />
          <Select label="Academic year" value={year} onChange={(e) => setYear(e.target.value as AcademicYear)}>
            <option value="">Select year</option>
            {YEARS.map((y) => (
              <option key={y} value={y}>
                {y[0].toUpperCase() + y.slice(1)}
              </option>
            ))}
          </Select>
          <Input label="Graduation year" type="number" value={gradYear} onChange={(e) => setGradYear(e.target.value)} placeholder="2027" />
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="text-lg font-semibold">Social channels</h2>
        <p className="mt-1 text-sm text-[var(--color-fg-muted)]">
          Buyers love social proof — these will show on your public profile.
        </p>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <Input label="Instagram handle" value={instagram} onChange={(e) => setInstagram(e.target.value)} placeholder="@yourhandle" />
          <Input label="Twitter / X handle" value={twitter} onChange={(e) => setTwitter(e.target.value)} placeholder="@yourhandle" />
          <Input label="TikTok handle" value={tiktok} onChange={(e) => setTiktok(e.target.value)} placeholder="@yourhandle" />
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Weekly availability</h2>
            <p className="mt-1 text-sm text-[var(--color-fg-muted)]">
              Block out time you&apos;re actually free for gigs (outside of
              practice, training, and class).
            </p>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={addAvailability}>
            <Plus className="h-4 w-4" /> Add window
          </Button>
        </div>

        <div className="mt-4 space-y-2">
          {availability.length === 0 ? (
            <p className="rounded-md border border-dashed p-4 text-center text-sm text-[var(--color-fg-muted)]">
              No availability windows yet. Add one above.
            </p>
          ) : null}
          {availability.map((row, i) => (
            <div key={i} className="grid grid-cols-12 items-end gap-2">
              <div className="col-span-4">
                <Select
                  label={i === 0 ? "Day" : undefined}
                  value={row.day_of_week}
                  onChange={(e) => updateAvailability(i, { day_of_week: Number(e.target.value) })}
                >
                  {DAYS.map((d, idx) => (
                    <option key={idx} value={idx}>
                      {d}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="col-span-3">
                <Input
                  label={i === 0 ? "Start" : undefined}
                  type="time"
                  value={row.start_time}
                  onChange={(e) => updateAvailability(i, { start_time: e.target.value })}
                />
              </div>
              <div className="col-span-3">
                <Input
                  label={i === 0 ? "End" : undefined}
                  type="time"
                  value={row.end_time}
                  onChange={(e) => updateAvailability(i, { end_time: e.target.value })}
                />
              </div>
              <div className="col-span-2">
                <Button type="button" variant="ghost" size="sm" onClick={() => removeAvailability(i)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {error ? <p className="text-sm text-[var(--color-danger)]">{error}</p> : null}

      <div className="flex justify-end gap-3">
        <Button type="submit" size="lg" disabled={busy}>
          {busy ? "Saving…" : "Save & continue"}
        </Button>
      </div>
    </form>
  );
}

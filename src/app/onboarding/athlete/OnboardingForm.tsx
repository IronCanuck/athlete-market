"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Trash2, BadgeCheck, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input, Select, Textarea } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { createClient } from "@/lib/supabase/client";
import {
  DIVISION_LABELS,
  type AcademicYear,
  type AthleteSport,
  type AthleticDivision,
  type Profile,
} from "@/types/db";

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

const DIVISIONS: AthleticDivision[] = [
  "NCAA_D1",
  "NCAA_D2",
  "NCAA_D3",
  "NAIA",
  "JUCO",
  "HS",
  "CLUB",
  "PROFESSIONAL",
];

const STATES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA","KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ","NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT","VA","WA","WV","WI","WY",
];

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

type AvailabilityRow = {
  day_of_week: number;
  start_time: string;
  end_time: string;
};

type SportRow = {
  id?: string;
  sport: string;
  position: string;
  is_primary: boolean;
  jersey_number?: string;
};

export function OnboardingForm({
  initial,
  initialSports,
  accountEmail,
}: {
  initial: Profile | null;
  initialSports: AthleteSport[];
  accountEmail: string | null;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [fullName, setFullName] = useState(initial?.full_name ?? "");
  const [username, setUsername] = useState(initial?.username ?? "");
  const [school, setSchool] = useState(initial?.school ?? "");
  const [schoolCity, setSchoolCity] = useState(initial?.school_city ?? "");
  const [schoolState, setSchoolState] = useState(initial?.school_state ?? "");
  const [division, setDivision] = useState<AthleticDivision | "">(
    initial?.division ?? ""
  );
  const [conference, setConference] = useState(initial?.conference ?? "");
  const [teamName, setTeamName] = useState(initial?.team_name ?? "");
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

  const [sports, setSports] = useState<SportRow[]>(
    initialSports.length
      ? initialSports.map((s) => ({
          id: s.id,
          sport: s.sport,
          position: s.position ?? "",
          is_primary: s.is_primary,
          jersey_number: s.jersey_number?.toString() ?? "",
        }))
      : [{ sport: "", position: "", is_primary: true, jersey_number: "" }]
  );

  const [availability, setAvailability] = useState<AvailabilityRow[]>([
    { day_of_week: 1, start_time: "16:00", end_time: "20:00" },
    { day_of_week: 6, start_time: "10:00", end_time: "18:00" },
  ]);

  const isEdu = (accountEmail ?? "").toLowerCase().endsWith(".edu");
  const verificationStatus = initial?.verification_status ?? "unverified";

  function addSport() {
    setSports((s) => [
      ...s,
      { sport: "", position: "", is_primary: s.length === 0, jersey_number: "" },
    ]);
  }
  function removeSport(i: number) {
    setSports((s) =>
      s.filter((_, idx) => idx !== i).map((row, idx) =>
        idx === 0 ? { ...row, is_primary: true } : row
      )
    );
  }
  function updateSport(i: number, patch: Partial<SportRow>) {
    setSports((s) =>
      s.map((r, idx) => (idx === i ? { ...r, ...patch } : r))
    );
  }
  function setPrimarySport(i: number) {
    setSports((s) => s.map((r, idx) => ({ ...r, is_primary: idx === i })));
  }

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

    const filledSports = sports.filter((s) => s.sport);
    const primary = filledSports.find((s) => s.is_primary) ?? filledSports[0];

    const { error: profileError } = await supabase
      .from("profiles")
      .update({
        role: "athlete",
        full_name: fullName,
        username: username || null,
        school,
        school_city: schoolCity || null,
        school_state: schoolState || null,
        division: division || null,
        conference: conference || null,
        team_name: teamName || null,
        sport: primary?.sport ?? null,
        position: primary?.position || null,
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

    await supabase.from("athlete_sports").delete().eq("athlete_id", user.id);
    if (filledSports.length) {
      const { error: sportsErr } = await supabase.from("athlete_sports").insert(
        filledSports.map((s) => ({
          athlete_id: user.id,
          sport: s.sport,
          position: s.position || null,
          is_primary: s.is_primary,
          jersey_number: s.jersey_number ? Number(s.jersey_number) : null,
        }))
      );
      if (sportsErr) {
        setError(sportsErr.message);
        setBusy(false);
        return;
      }
    }

    await supabase.from("availability").delete().eq("athlete_id", user.id);
    if (availability.length) {
      await supabase.from("availability").insert(
        availability.map((a) => ({ athlete_id: user.id, ...a }))
      );
    }

    setBusy(false);
    router.push(
      verificationStatus === "verified"
        ? "/dashboard"
        : "/dashboard/verification"
    );
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <Card className="p-6">
        <h2 className="text-lg font-semibold">Identity</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <Input label="Full name" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
          <Input label="Username" value={username} onChange={(e) => setUsername(e.target.value)} hint="Used in your profile URL" />
          <Input label="Hometown" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Atlanta, GA" />
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
        <h2 className="text-lg font-semibold">Where you play</h2>
        <p className="mt-1 text-sm text-[var(--color-fg-muted)]">
          School + team details show on your public profile and help buyers find local talent.
        </p>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <Input label="School" value={school} onChange={(e) => setSchool(e.target.value)} placeholder="University of Alabama" required />
          <Input label="Team name" value={teamName} onChange={(e) => setTeamName(e.target.value)} placeholder="Crimson Tide" />
          <Input label="School city" value={schoolCity} onChange={(e) => setSchoolCity(e.target.value)} placeholder="Tuscaloosa" />
          <Select label="School state" value={schoolState} onChange={(e) => setSchoolState(e.target.value)}>
            <option value="">Select state</option>
            {STATES.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </Select>
          <Select label="Division" value={division} onChange={(e) => setDivision(e.target.value as AthleticDivision)}>
            <option value="">Select division</option>
            {DIVISIONS.map((d) => (
              <option key={d} value={d}>
                {DIVISION_LABELS[d]}
              </option>
            ))}
          </Select>
          <Input label="Conference" value={conference} onChange={(e) => setConference(e.target.value)} placeholder="SEC" />
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
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Sports you play</h2>
            <p className="mt-1 text-sm text-[var(--color-fg-muted)]">
              Add every sport you play — multi-sport athletes welcome. Mark one
              as primary.
            </p>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={addSport}>
            <Plus className="h-4 w-4" /> Add sport
          </Button>
        </div>
        <div className="mt-4 space-y-3">
          {sports.map((s, i) => (
            <div key={i} className="grid grid-cols-12 items-end gap-2">
              <div className="col-span-4">
                <Select
                  label={i === 0 ? "Sport" : undefined}
                  value={s.sport}
                  onChange={(e) => updateSport(i, { sport: e.target.value })}
                >
                  <option value="">Select a sport</option>
                  {SPORTS.map((sp) => (
                    <option key={sp}>{sp}</option>
                  ))}
                </Select>
              </div>
              <div className="col-span-4">
                <Input
                  label={i === 0 ? "Position / event" : undefined}
                  value={s.position}
                  onChange={(e) => updateSport(i, { position: e.target.value })}
                  placeholder="QB, 100m, OH..."
                />
              </div>
              <div className="col-span-2">
                <Input
                  label={i === 0 ? "Jersey #" : undefined}
                  type="number"
                  min="0"
                  value={s.jersey_number ?? ""}
                  onChange={(e) => updateSport(i, { jersey_number: e.target.value })}
                />
              </div>
              <div className="col-span-2 flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setPrimarySport(i)}
                  className={`rounded-md border px-2 py-1.5 text-xs font-medium ${
                    s.is_primary
                      ? "border-[var(--color-brand)] bg-[var(--color-brand-soft)] text-[var(--color-brand)]"
                      : "text-[var(--color-fg-muted)]"
                  }`}
                  title="Primary sport"
                >
                  Primary
                </button>
                <Button type="button" variant="ghost" size="sm" onClick={() => removeSport(i)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
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

      <Card className="p-6">
        <h2 className="text-lg font-semibold">Verification</h2>
        <p className="mt-1 text-sm text-[var(--color-fg-muted)]">
          Verified athletes get a green checkmark and unlock the ability to
          publish gigs.
        </p>
        <div className="mt-4 flex items-start gap-3 rounded-lg border bg-[var(--color-bg-subtle)] p-4 text-sm">
          {verificationStatus === "verified" ? (
            <>
              <BadgeCheck className="mt-0.5 h-5 w-5 text-emerald-600" />
              <div>
                <div className="font-semibold text-emerald-700">You&apos;re verified.</div>
                <p className="mt-0.5 text-[var(--color-fg-muted)]">
                  Your account is verified via your school email
                  ({accountEmail}).
                </p>
              </div>
            </>
          ) : isEdu ? (
            <>
              <BadgeCheck className="mt-0.5 h-5 w-5 text-emerald-600" />
              <div>
                <div className="font-semibold">School email detected</div>
                <p className="mt-0.5 text-[var(--color-fg-muted)]">
                  We&apos;ll auto-verify you using <strong>{accountEmail}</strong>{" "}
                  once your account is confirmed.
                </p>
              </div>
            </>
          ) : (
            <>
              <ShieldAlert className="mt-0.5 h-5 w-5 text-amber-600" />
              <div className="flex-1">
                <div className="font-semibold">Get verified after onboarding</div>
                <p className="mt-0.5 text-[var(--color-fg-muted)]">
                  After you finish this form we&apos;ll take you to the
                  verification page where you can submit your school email,
                  roster link, athlete ID, or NIL letter. {" "}
                  <Badge variant="brand" className="ml-1">Required to publish gigs</Badge>
                </p>
              </div>
            </>
          )}
        </div>
        <p className="mt-3 text-xs text-[var(--color-fg-muted)]">
          You can manage your verification anytime at{" "}
          <Link href="/dashboard/verification" className="underline">
            /dashboard/verification
          </Link>
          .
        </p>
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

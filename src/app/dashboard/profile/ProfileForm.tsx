"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input, Select, Textarea } from "@/components/ui/Input";
import { Avatar } from "@/components/ui/Avatar";
import { createClient } from "@/lib/supabase/client";
import { uploadToBucket } from "@/lib/storage";
import {
  DIVISION_LABELS,
  type AthleteSport,
  type AthleticDivision,
  type Profile,
} from "@/types/db";

const SPORTS = [
  "Basketball","Football","Soccer","Baseball","Softball","Volleyball","Track & Field","Cross Country","Tennis","Golf","Swimming","Wrestling","Gymnastics","Lacrosse","Hockey","Rowing","Other",
];

const DIVISIONS: AthleticDivision[] = [
  "NCAA_D1","NCAA_D2","NCAA_D3","NAIA","JUCO","HS","CLUB","PROFESSIONAL",
];

const STATES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA","KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ","NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT","VA","WA","WV","WI","WY",
];

type SportRow = {
  sport: string;
  position: string;
  is_primary: boolean;
  jersey_number?: string;
};

export function ProfileForm({
  initial,
  initialSports,
}: {
  initial: Profile | null;
  initialSports: AthleteSport[];
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [fullName, setFullName] = useState(initial?.full_name ?? "");
  const [bio, setBio] = useState(initial?.bio ?? "");
  const [school, setSchool] = useState(initial?.school ?? "");
  const [schoolCity, setSchoolCity] = useState(initial?.school_city ?? "");
  const [schoolState, setSchoolState] = useState(initial?.school_state ?? "");
  const [division, setDivision] = useState<AthleticDivision | "">(initial?.division ?? "");
  const [conference, setConference] = useState(initial?.conference ?? "");
  const [teamName, setTeamName] = useState(initial?.team_name ?? "");
  const [location, setLocation] = useState(initial?.location ?? "");
  const [instagram, setInstagram] = useState(initial?.social_instagram ?? "");
  const [twitter, setTwitter] = useState(initial?.social_twitter ?? "");
  const [tiktok, setTiktok] = useState(initial?.social_tiktok ?? "");
  const [avatarUrl, setAvatarUrl] = useState(initial?.avatar_url ?? "");

  const [sports, setSports] = useState<SportRow[]>(
    initialSports.length
      ? initialSports.map((s) => ({
          sport: s.sport,
          position: s.position ?? "",
          is_primary: s.is_primary,
          jersey_number: s.jersey_number?.toString() ?? "",
        }))
      : [{ sport: initial?.sport ?? "", position: initial?.position ?? "", is_primary: true, jersey_number: "" }]
  );

  function addSport() {
    setSports((s) => [...s, { sport: "", position: "", is_primary: s.length === 0, jersey_number: "" }]);
  }
  function removeSport(i: number) {
    setSports((s) =>
      s.filter((_, idx) => idx !== i).map((row, idx) =>
        idx === 0 ? { ...row, is_primary: true } : row
      )
    );
  }
  function updateSport(i: number, patch: Partial<SportRow>) {
    setSports((s) => s.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  }
  function setPrimary(i: number) {
    setSports((s) => s.map((r, idx) => ({ ...r, is_primary: idx === i })));
  }

  async function handleAvatar(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !initial?.id) return;
    try {
      setUploading(true);
      const result = await uploadToBucket({
        bucket: "avatars",
        userId: initial.id,
        file,
        prefix: "avatar",
      });
      if (result.publicUrl) setAvatarUrl(result.publicUrl);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Avatar upload failed.");
    } finally {
      setUploading(false);
    }
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setSaved(false);
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

    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: fullName,
        bio,
        school: school || null,
        school_city: schoolCity || null,
        school_state: schoolState || null,
        division: division || null,
        conference: conference || null,
        team_name: teamName || null,
        sport: primary?.sport ?? null,
        position: primary?.position || null,
        location: location || null,
        social_instagram: instagram || null,
        social_twitter: twitter || null,
        social_tiktok: tiktok || null,
        avatar_url: avatarUrl || null,
      })
      .eq("id", user.id);
    if (error) {
      setError(error.message);
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

    setBusy(false);
    setSaved(true);
    router.refresh();
  }

  return (
    <form onSubmit={save} className="space-y-6">
      <Card className="p-6">
        <h2 className="text-lg font-semibold">Identity</h2>
        <div className="mt-4 flex items-center gap-4">
          <Avatar src={avatarUrl} name={fullName} size={72} />
          <div>
            <label className="label flex items-center gap-2">
              <Upload className="h-4 w-4" /> Upload avatar
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handleAvatar}
              className="block text-sm file:mr-3 file:rounded-md file:border file:border-[var(--color-border)] file:bg-white file:px-3 file:py-1.5 file:text-sm file:font-medium hover:file:border-[var(--color-fg)]"
            />
            {uploading ? <p className="mt-1 text-xs text-[var(--color-fg-muted)]">Uploading…</p> : null}
          </div>
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <Input label="Full name" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
          <Input label="Hometown" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Atlanta, GA" />
        </div>
        <div className="mt-4">
          <Textarea label="Bio" value={bio} onChange={(e) => setBio(e.target.value)} />
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="text-lg font-semibold">Where you play</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <Input label="School" value={school} onChange={(e) => setSchool(e.target.value)} />
          <Input label="Team name" value={teamName} onChange={(e) => setTeamName(e.target.value)} placeholder="Crimson Tide" />
          <Input label="School city" value={schoolCity} onChange={(e) => setSchoolCity(e.target.value)} />
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
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Sports</h2>
          <Button type="button" variant="outline" size="sm" onClick={addSport}>
            <Plus className="h-4 w-4" /> Add sport
          </Button>
        </div>
        <div className="mt-4 space-y-3">
          {sports.map((s, i) => (
            <div key={i} className="grid grid-cols-12 items-end gap-2">
              <div className="col-span-4">
                <Select label={i === 0 ? "Sport" : undefined} value={s.sport} onChange={(e) => updateSport(i, { sport: e.target.value })}>
                  <option value="">Select a sport</option>
                  {SPORTS.map((sp) => (
                    <option key={sp}>{sp}</option>
                  ))}
                </Select>
              </div>
              <div className="col-span-4">
                <Input label={i === 0 ? "Position" : undefined} value={s.position} onChange={(e) => updateSport(i, { position: e.target.value })} />
              </div>
              <div className="col-span-2">
                <Input label={i === 0 ? "Jersey #" : undefined} type="number" min="0" value={s.jersey_number ?? ""} onChange={(e) => updateSport(i, { jersey_number: e.target.value })} />
              </div>
              <div className="col-span-2 flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setPrimary(i)}
                  className={`rounded-md border px-2 py-1.5 text-xs font-medium ${
                    s.is_primary
                      ? "border-[var(--color-brand)] bg-[var(--color-brand-soft)] text-[var(--color-brand)]"
                      : "text-[var(--color-fg-muted)]"
                  }`}
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
        <h2 className="text-lg font-semibold">Social</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <Input label="Instagram" value={instagram} onChange={(e) => setInstagram(e.target.value)} placeholder="@yourhandle" />
          <Input label="Twitter / X" value={twitter} onChange={(e) => setTwitter(e.target.value)} placeholder="@yourhandle" />
          <Input label="TikTok" value={tiktok} onChange={(e) => setTiktok(e.target.value)} placeholder="@yourhandle" />
        </div>
      </Card>

      {error ? <p className="text-sm text-[var(--color-danger)]">{error}</p> : null}
      {saved ? <p className="text-sm text-[var(--color-success)]">Profile saved.</p> : null}

      <div className="flex justify-end">
        <Button type="submit" disabled={busy}>
          {busy ? "Saving…" : "Save profile"}
        </Button>
      </div>
    </form>
  );
}

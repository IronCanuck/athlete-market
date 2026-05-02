"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input, Textarea } from "@/components/ui/Input";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/types/db";

export function ProfileForm({ initial }: { initial: Profile | null }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const [fullName, setFullName] = useState(initial?.full_name ?? "");
  const [bio, setBio] = useState(initial?.bio ?? "");
  const [school, setSchool] = useState(initial?.school ?? "");
  const [sport, setSport] = useState(initial?.sport ?? "");
  const [position, setPosition] = useState(initial?.position ?? "");
  const [location, setLocation] = useState(initial?.location ?? "");
  const [instagram, setInstagram] = useState(initial?.social_instagram ?? "");
  const [twitter, setTwitter] = useState(initial?.social_twitter ?? "");
  const [tiktok, setTiktok] = useState(initial?.social_tiktok ?? "");
  const [avatarUrl, setAvatarUrl] = useState(initial?.avatar_url ?? "");

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
    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: fullName,
        bio,
        school: school || null,
        sport: sport || null,
        position: position || null,
        location: location || null,
        social_instagram: instagram || null,
        social_twitter: twitter || null,
        social_tiktok: tiktok || null,
        avatar_url: avatarUrl || null,
      })
      .eq("id", user.id);
    setBusy(false);
    if (error) {
      setError(error.message);
      return;
    }
    setSaved(true);
    router.refresh();
  }

  return (
    <form onSubmit={save} className="space-y-6">
      <Card className="p-6">
        <h2 className="text-lg font-semibold">Public profile</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <Input label="Full name" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
          <Input label="Avatar URL" value={avatarUrl} onChange={(e) => setAvatarUrl(e.target.value)} placeholder="https://..." />
          <Input label="School" value={school} onChange={(e) => setSchool(e.target.value)} />
          <Input label="Sport" value={sport} onChange={(e) => setSport(e.target.value)} />
          <Input label="Position / event" value={position} onChange={(e) => setPosition(e.target.value)} />
          <Input label="Location" value={location} onChange={(e) => setLocation(e.target.value)} />
        </div>
        <div className="mt-4">
          <Textarea label="Bio" value={bio} onChange={(e) => setBio(e.target.value)} />
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

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input, Select, Textarea } from "@/components/ui/Input";
import { createClient } from "@/lib/supabase/client";
import { slugify } from "@/lib/utils";
import type { GigStatus, PackageTier } from "@/types/db";

type CategoryOption = { id: string; name: string; slug: string };

type PackageDraft = {
  tier: PackageTier;
  title: string;
  description: string;
  price: string;
  delivery_days: string;
  revisions: string;
  features: string;
};

const DEFAULT_PACKAGES: PackageDraft[] = [
  { tier: "basic", title: "Basic", description: "", price: "50", delivery_days: "5", revisions: "1", features: "" },
  { tier: "standard", title: "Standard", description: "", price: "125", delivery_days: "5", revisions: "2", features: "" },
  { tier: "premium", title: "Premium", description: "", price: "300", delivery_days: "7", revisions: "3", features: "" },
];

export function GigForm({ categories }: { categories: CategoryOption[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [categoryId, setCategoryId] = useState(categories[0]?.id ?? "");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState("");
  const [status, setStatus] = useState<GigStatus>("active");
  const [packages, setPackages] = useState<PackageDraft[]>(DEFAULT_PACKAGES);

  function updatePackage(i: number, patch: Partial<PackageDraft>) {
    setPackages((prev) => prev.map((p, idx) => (idx === i ? { ...p, ...patch } : p)));
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

    const slug = `${slugify(title)}-${Math.random().toString(36).slice(2, 7)}`;

    const { data: gig, error: gigErr } = await supabase
      .from("gigs")
      .insert({
        athlete_id: user.id,
        category_id: categoryId || null,
        title,
        slug,
        description,
        tags: tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
        status,
      })
      .select("id")
      .single();

    if (gigErr || !gig) {
      setError(gigErr?.message ?? "Failed to create gig.");
      setBusy(false);
      return;
    }

    const packagesPayload = packages
      .filter((p) => p.title && p.price)
      .map((p) => ({
        gig_id: gig.id,
        tier: p.tier,
        title: p.title,
        description: p.description || null,
        price_cents: Math.round(Number(p.price) * 100),
        delivery_days: Number(p.delivery_days),
        revisions: Number(p.revisions),
        features: p.features
          .split("\n")
          .map((f) => f.trim())
          .filter(Boolean),
      }));

    if (packagesPayload.length) {
      const { error: pkgErr } = await supabase
        .from("gig_packages")
        .insert(packagesPayload);
      if (pkgErr) {
        setError(pkgErr.message);
        setBusy(false);
        return;
      }
    }

    router.push("/dashboard/gigs");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <Card className="p-6">
        <h2 className="text-lg font-semibold">Basics</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <Input
              label="Gig title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="I will record a 60-second IG shoutout for your brand"
              required
            />
          </div>
          <Select
            label="Category"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            required
          >
            {categories.length === 0 ? <option value="">(none)</option> : null}
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
          <Select
            label="Status"
            value={status}
            onChange={(e) => setStatus(e.target.value as GigStatus)}
          >
            <option value="draft">Draft (not visible)</option>
            <option value="active">Active</option>
            <option value="paused">Paused</option>
          </Select>
          <div className="md:col-span-2">
            <Textarea
              label="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Walk buyers through what they get, your process, deliverables, and turnaround."
              required
            />
          </div>
          <div className="md:col-span-2">
            <Input
              label="Tags (comma separated)"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="instagram, shoutout, brand, post"
            />
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="text-lg font-semibold">Packages</h2>
        <p className="mt-1 text-sm text-[var(--color-fg-muted)]">
          Three tiers help buyers self-select the right scope and price.
        </p>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          {packages.map((p, i) => (
            <div key={p.tier} className="card p-4">
              <div className="text-xs font-semibold uppercase tracking-wide text-[var(--color-brand)]">
                {p.tier}
              </div>
              <Input
                className="mt-2"
                label="Title"
                value={p.title}
                onChange={(e) => updatePackage(i, { title: e.target.value })}
              />
              <Textarea
                className="mt-2 min-h-[5rem]"
                label="What's included"
                value={p.description}
                onChange={(e) => updatePackage(i, { description: e.target.value })}
              />
              <div className="mt-2 grid grid-cols-3 gap-2">
                <Input label="Price ($)" type="number" min="5" value={p.price} onChange={(e) => updatePackage(i, { price: e.target.value })} />
                <Input label="Days" type="number" min="1" value={p.delivery_days} onChange={(e) => updatePackage(i, { delivery_days: e.target.value })} />
                <Input label="Revisions" type="number" min="0" value={p.revisions} onChange={(e) => updatePackage(i, { revisions: e.target.value })} />
              </div>
              <Textarea
                className="mt-2 min-h-[5rem]"
                label="Features (one per line)"
                value={p.features}
                onChange={(e) => updatePackage(i, { features: e.target.value })}
                placeholder={"60-second video\nPost on feed + story\nUsage rights for 30 days"}
              />
            </div>
          ))}
        </div>
      </Card>

      {error ? <p className="text-sm text-[var(--color-danger)]">{error}</p> : null}

      <div className="flex justify-end">
        <Button type="submit" size="lg" disabled={busy}>
          {busy ? "Publishing…" : "Publish gig"}
        </Button>
      </div>
    </form>
  );
}

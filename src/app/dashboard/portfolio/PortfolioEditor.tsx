"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Trash2,
  Plus,
  Image as ImageIcon,
  Video,
  Link2,
  FileText,
  Upload,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input, Select, Textarea } from "@/components/ui/Input";
import { createClient } from "@/lib/supabase/client";
import { uploadToBucket } from "@/lib/storage";
import { cn } from "@/lib/utils";
import type { PortfolioItem, PortfolioType } from "@/types/db";

const TYPE_ICON: Record<PortfolioType, React.ReactNode> = {
  image: <ImageIcon className="h-4 w-4" />,
  video: <Video className="h-4 w-4" />,
  link: <Link2 className="h-4 w-4" />,
  document: <FileText className="h-4 w-4" />,
};

export function PortfolioEditor({
  userId,
  initial,
}: {
  userId: string;
  initial: PortfolioItem[];
}) {
  const router = useRouter();
  const [items, setItems] = useState<PortfolioItem[]>(initial);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [type, setType] = useState<PortfolioType>("image");
  const [url, setUrl] = useState("");
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);

  function reset() {
    setUrl("");
    setThumbnailUrl("");
    setTitle("");
    setDescription("");
    setFile(null);
    setError(null);
  }

  async function add() {
    setBusy(true);
    setError(null);
    try {
      const supabase = createClient();
      let finalUrl = url;
      let finalThumbUrl = thumbnailUrl || null;

      if (file) {
        const result = await uploadToBucket({
          bucket: "portfolio",
          userId,
          file,
          prefix: type,
        });
        if (!result.publicUrl) throw new Error("Upload failed.");
        finalUrl = result.publicUrl;
        if (!finalThumbUrl && type === "image") finalThumbUrl = result.publicUrl;
      }
      if (!finalUrl) throw new Error("Provide a URL or upload a file.");

      const { data, error: insertErr } = await supabase
        .from("portfolio_items")
        .insert({
          athlete_id: userId,
          type,
          url: finalUrl,
          thumbnail_url: finalThumbUrl,
          title: title || null,
          description: description || null,
          position: items.length,
        })
        .select("*")
        .single();
      if (insertErr) throw insertErr;
      setItems((cur) => [...cur, data as PortfolioItem]);
      reset();
      setAdding(false);
      router.refresh();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to add item.");
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    const supabase = createClient();
    await supabase.from("portfolio_items").delete().eq("id", id);
    setItems((cur) => cur.filter((i) => i.id !== id));
    router.refresh();
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="text-sm text-[var(--color-fg-muted)]">
          {items.length} item{items.length === 1 ? "" : "s"}
        </div>
        {!adding ? (
          <Button onClick={() => setAdding(true)}>
            <Plus className="h-4 w-4" /> Add to portfolio
          </Button>
        ) : null}
      </div>

      {adding ? (
        <Card className="p-5">
          <h3 className="text-base font-semibold">Add a portfolio item</h3>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <Select label="Type" value={type} onChange={(e) => setType(e.target.value as PortfolioType)}>
              <option value="image">Image</option>
              <option value="video">Video (YouTube, Vimeo, mp4 URL)</option>
              <option value="link">Link (case study, article)</option>
              <option value="document">Document (PDF)</option>
            </Select>
            <Input label="Title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Brand campaign with Nike" />
          </div>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <Input
              label="URL (optional if uploading)"
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://…"
            />
            <Input
              label="Thumbnail URL (optional)"
              type="url"
              value={thumbnailUrl}
              onChange={(e) => setThumbnailUrl(e.target.value)}
              placeholder="https://…"
            />
          </div>
          <div className="mt-3">
            <label className="label flex items-center gap-2">
              <Upload className="h-4 w-4" /> Upload file (optional)
            </label>
            <input
              type="file"
              accept={type === "video" ? "video/*" : type === "document" ? ".pdf" : "image/*"}
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="block w-full text-sm file:mr-3 file:rounded-md file:border file:border-[var(--color-border)] file:bg-white file:px-3 file:py-1.5 file:text-sm file:font-medium hover:file:border-[var(--color-fg)]"
            />
          </div>
          <div className="mt-3">
            <Textarea label="Description" value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          {error ? <p className="mt-3 text-sm text-[var(--color-danger)]">{error}</p> : null}
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="ghost" onClick={() => { setAdding(false); reset(); }}>Cancel</Button>
            <Button onClick={add} disabled={busy}>
              {busy ? "Adding…" : "Add item"}
            </Button>
          </div>
        </Card>
      ) : null}

      {items.length === 0 ? (
        <Card className="p-10 text-center text-sm text-[var(--color-fg-muted)]">
          No portfolio items yet. Add some samples above.
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <Card key={item.id} className="overflow-hidden">
              <div className="relative aspect-[5/3] bg-[var(--color-bg-subtle)]">
                {item.type === "image" || item.type === "video" ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.thumbnail_url ?? item.url}
                    alt={item.title ?? "portfolio"}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-[var(--color-fg-muted)]">
                    {TYPE_ICON[item.type]}
                  </div>
                )}
                <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide">
                  {TYPE_ICON[item.type]} {item.type}
                </span>
              </div>
              <div className="p-3">
                <div className="line-clamp-1 font-medium">{item.title ?? "(untitled)"}</div>
                {item.description ? (
                  <p className="mt-1 line-clamp-2 text-xs text-[var(--color-fg-muted)]">{item.description}</p>
                ) : null}
                <div className="mt-3 flex items-center justify-between">
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-medium text-[var(--color-brand)]"
                  >
                    Open ↗
                  </a>
                  <button
                    onClick={() => remove(item.id)}
                    className={cn(
                      "rounded p-1.5 text-[var(--color-fg-muted)] hover:bg-red-50 hover:text-[var(--color-danger)]"
                    )}
                    title="Remove"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

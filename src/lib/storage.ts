import { createClient } from "@/lib/supabase/client";

export type UploadResult = {
  path: string;
  publicUrl: string | null;
};

/**
 * Uploads a file to a Supabase Storage bucket under `${userId}/${name}`.
 * Returns the storage path and (for public buckets) a public URL.
 */
export async function uploadToBucket(opts: {
  bucket: "portfolio" | "verification-docs" | "avatars";
  userId: string;
  file: File;
  prefix?: string;
}): Promise<UploadResult> {
  const supabase = createClient();
  const ext = opts.file.name.split(".").pop()?.toLowerCase() ?? "bin";
  const safeStem = (opts.prefix ?? crypto.randomUUID().slice(0, 8))
    .replace(/[^a-z0-9-_]/gi, "-")
    .toLowerCase();
  const path = `${opts.userId}/${safeStem}-${Date.now()}.${ext}`;
  const { error } = await supabase.storage
    .from(opts.bucket)
    .upload(path, opts.file, {
      contentType: opts.file.type || undefined,
      cacheControl: "3600",
      upsert: false,
    });
  if (error) throw error;

  const { data } = supabase.storage.from(opts.bucket).getPublicUrl(path);
  return { path, publicUrl: data?.publicUrl ?? null };
}

export async function createSignedUrl(opts: {
  bucket: "verification-docs";
  path: string;
  expiresIn?: number;
}) {
  const supabase = createClient();
  const { data, error } = await supabase.storage
    .from(opts.bucket)
    .createSignedUrl(opts.path, opts.expiresIn ?? 60 * 60);
  if (error) throw error;
  return data?.signedUrl ?? null;
}

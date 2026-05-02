import { AlertTriangle } from "lucide-react";

export function EnvBanner() {
  const ok =
    !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
    !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (ok) return null;
  return (
    <div className="bg-amber-50 text-amber-900 border-b border-amber-200">
      <div className="container-page flex items-center gap-2 py-2 text-xs">
        <AlertTriangle className="h-4 w-4" />
        <span>
          Supabase env vars missing. Set{" "}
          <code className="rounded bg-white/60 px-1">NEXT_PUBLIC_SUPABASE_URL</code> and{" "}
          <code className="rounded bg-white/60 px-1">NEXT_PUBLIC_SUPABASE_ANON_KEY</code>{" "}
          in <code>.env.local</code> (or Vercel) to enable auth, gigs, and orders.
        </span>
      </div>
    </div>
  );
}

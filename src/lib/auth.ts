import { redirect } from "next/navigation";
import { createClient, hasSupabaseEnv } from "@/lib/supabase/server";
import type { Profile } from "@/types/db";

export async function getSessionUser() {
  if (!hasSupabaseEnv()) return { user: null, profile: null as Profile | null };
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { user: null, profile: null as Profile | null };
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();
  return { user, profile: (profile ?? null) as Profile | null };
}

export async function requireUser(redirectTo = "/sign-in") {
  const session = await getSessionUser();
  if (!session.user) redirect(redirectTo);
  return session as { user: NonNullable<typeof session.user>; profile: Profile | null };
}

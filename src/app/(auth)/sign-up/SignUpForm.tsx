"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trophy, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

type Role = "athlete" | "buyer";

export function SignUpForm({ defaultRole = "buyer" }: { defaultRole?: Role }) {
  const router = useRouter();
  const [role, setRole] = useState<Role>(defaultRole);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [needsConfirm, setNeedsConfirm] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName, role },
        emailRedirectTo:
          typeof window !== "undefined"
            ? `${window.location.origin}/auth/callback`
            : undefined,
      },
    });
    setBusy(false);
    if (error) {
      setError(error.message);
      return;
    }
    if (!data.session) {
      setNeedsConfirm(true);
      return;
    }
    router.push(role === "athlete" ? "/onboarding/athlete" : "/dashboard");
    router.refresh();
  }

  if (needsConfirm) {
    return (
      <div className="space-y-3 text-sm">
        <p>
          Check your inbox at <strong>{email}</strong> and click the confirmation
          link to finish creating your account.
        </p>
        <p className="text-[var(--color-fg-muted)]">
          You can close this tab once confirmed.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div>
        <label className="label">I&apos;m joining as</label>
        <div className="grid grid-cols-2 gap-2">
          <RoleCard
            active={role === "athlete"}
            onClick={() => setRole("athlete")}
            icon={<Trophy className="h-5 w-5" />}
            title="Student athlete"
            subtitle="Sell gigs &amp; book clients"
          />
          <RoleCard
            active={role === "buyer"}
            onClick={() => setRole("buyer")}
            icon={<ShoppingBag className="h-5 w-5" />}
            title="Buyer / brand"
            subtitle="Hire athletes for gigs"
          />
        </div>
      </div>

      <Input
        label="Full name"
        name="full_name"
        value={fullName}
        onChange={(e) => setFullName(e.target.value)}
        required
        autoComplete="name"
      />
      <Input
        label="Email"
        name="email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        autoComplete="email"
      />
      <Input
        label="Password"
        name="password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
        minLength={8}
        autoComplete="new-password"
        hint="At least 8 characters."
      />

      {error ? <p className="text-sm text-[var(--color-danger)]">{error}</p> : null}

      <Button type="submit" className="w-full" disabled={busy}>
        {busy ? "Creating account…" : "Create account"}
      </Button>
    </form>
  );
}

function RoleCard({
  active,
  onClick,
  icon,
  title,
  subtitle,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex flex-col items-start gap-2 rounded-lg border p-3 text-left transition",
        active
          ? "border-[var(--color-brand)] bg-[var(--color-brand-soft)]"
          : "hover:border-[var(--color-fg)]"
      )}
    >
      <span
        className={cn(
          "grid h-9 w-9 place-items-center rounded-md",
          active
            ? "bg-[var(--color-brand)] text-white"
            : "bg-[var(--color-bg-subtle)] text-[var(--color-fg-muted)]"
        )}
      >
        {icon}
      </span>
      <div>
        <div className="font-semibold text-sm">{title}</div>
        <div
          className="text-xs text-[var(--color-fg-muted)]"
          dangerouslySetInnerHTML={{ __html: subtitle }}
        />
      </div>
    </button>
  );
}

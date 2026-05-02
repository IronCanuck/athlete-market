import Link from "next/link";
import { SignUpForm } from "./SignUpForm";

export const metadata = { title: "Join Athlete Market" };

export default async function SignUpPage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string }>;
}) {
  const sp = await searchParams;
  const role = sp.role === "athlete" ? "athlete" : "buyer";
  return (
    <div className="card p-6">
      <h1 className="text-2xl font-semibold tracking-tight">
        Create your account
      </h1>
      <p className="mt-1 text-sm text-[var(--color-fg-muted)]">
        Already have one?{" "}
        <Link href="/sign-in" className="font-medium text-[var(--color-brand)]">
          Sign in
        </Link>
        .
      </p>
      <div className="mt-5">
        <SignUpForm defaultRole={role} />
      </div>
    </div>
  );
}

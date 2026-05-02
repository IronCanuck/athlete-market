import Link from "next/link";
import { SignInForm } from "./SignInForm";

export const metadata = { title: "Sign in to Athlete Market" };

export default function SignInPage() {
  return (
    <div className="card p-6">
      <h1 className="text-2xl font-semibold tracking-tight">Welcome back</h1>
      <p className="mt-1 text-sm text-[var(--color-fg-muted)]">
        New here?{" "}
        <Link href="/sign-up" className="font-medium text-[var(--color-brand)]">
          Create an account
        </Link>
        .
      </p>
      <div className="mt-5">
        <SignInForm />
      </div>
    </div>
  );
}

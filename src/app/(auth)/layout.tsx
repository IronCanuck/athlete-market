import Link from "next/link";
import { Logo } from "@/components/Logo";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="container-page py-10">
      <div className="mx-auto max-w-md">
        <div className="mb-8 text-center">
          <div className="inline-block">
            <Logo />
          </div>
        </div>
        {children}
        <p className="mt-6 text-center text-xs text-[var(--color-fg-muted)]">
          By continuing you agree to our <Link href="/terms" className="underline">Terms</Link>{" "}
          and <Link href="/privacy" className="underline">Privacy Policy</Link>.
        </p>
      </div>
    </div>
  );
}

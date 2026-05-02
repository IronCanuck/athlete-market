import { ButtonLink } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <div className="container-page py-24 text-center">
      <div className="text-7xl font-bold tracking-tighter text-[var(--color-brand)]">
        404
      </div>
      <h1 className="mt-3 text-2xl font-semibold tracking-tight">Page not found</h1>
      <p className="mt-1 text-[var(--color-fg-muted)]">
        The page you&apos;re looking for has moved or never existed.
      </p>
      <div className="mt-6">
        <ButtonLink href="/">Back to home</ButtonLink>
      </div>
    </div>
  );
}

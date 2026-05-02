import Link from "next/link";

export function Logo({ size = 22, asLink = true }: { size?: number; asLink?: boolean }) {
  const inner = (
    <span className="inline-flex items-center gap-2 font-semibold tracking-tight" style={{ fontSize: size }}>
      <span
        aria-hidden
        className="grid place-items-center rounded-lg text-white"
        style={{
          width: size + 12,
          height: size + 12,
          background: "linear-gradient(135deg, #ff7a3d 0%, #ff5a1f 60%, #d63b00 100%)",
          boxShadow: "0 4px 14px rgba(255, 90, 31, 0.35)",
        }}
      >
        <svg viewBox="0 0 24 24" width={size - 4} height={size - 4} fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 18 L11 7 L13 11 L20 4" />
          <path d="M14 4 L20 4 L20 10" />
        </svg>
      </span>
      <span>
        Athlete<span className="text-[var(--color-brand)]">Market</span>
      </span>
    </span>
  );
  if (!asLink) return inner;
  return <Link href="/">{inner}</Link>;
}

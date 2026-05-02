import { cn, initialsOf } from "@/lib/utils";

type AvatarProps = {
  src?: string | null;
  name?: string | null;
  size?: number;
  className?: string;
};

export function Avatar({ src, name, size = 40, className }: AvatarProps) {
  const dim = { width: size, height: size, fontSize: Math.round(size * 0.4) };
  if (src) {
    return (
      <span
        className={cn(
          "inline-flex items-center justify-center overflow-hidden rounded-full bg-[var(--color-bg-subtle)]",
          className
        )}
        style={dim}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={name ?? "avatar"}
          width={size}
          height={size}
          className="h-full w-full object-cover"
        />
      </span>
    );
  }
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-full bg-[var(--color-brand-soft)] font-semibold text-[var(--color-brand)]",
        className
      )}
      style={dim}
    >
      {initialsOf(name)}
    </span>
  );
}

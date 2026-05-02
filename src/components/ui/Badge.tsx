import { cn } from "@/lib/utils";

type Variant = "default" | "brand" | "success" | "warning" | "danger";

const map: Record<Variant, string> = {
  default: "badge",
  brand: "badge badge-brand",
  success: "badge badge-success",
  warning: "badge badge-warning",
  danger: "badge badge-danger",
};

export function Badge({
  variant = "default",
  className,
  ...props
}: { variant?: Variant } & React.HTMLAttributes<HTMLSpanElement>) {
  return <span className={cn(map[variant], className)} {...props} />;
}

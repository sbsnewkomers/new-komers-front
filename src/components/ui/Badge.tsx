import * as React from "react";

export type BadgeVariant = "neutral" | "success" | "info" | "warning" | "danger";
export type BadgeSize = "sm" | "md";

const VARIANT_CLASSES: Record<BadgeVariant, string> = {
  neutral: "bg-white/5 text-(--nebula-muted) ring-white/10",
  success: "bg-white/5 text-white ring-white/10",
  info: "bg-white/5 text-white ring-white/10",
  warning: "bg-white/5 text-white ring-white/10",
  danger: "bg-white/5 text-white ring-white/10",
};

const SIZE_CLASSES: Record<BadgeSize, string> = {
  sm: "px-2 py-0.5 text-[10px]",
  md: "px-2.5 py-1 text-xs",
};

export function Badge({
  variant = "neutral",
  size = "sm",
  icon,
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & {
  variant?: BadgeVariant;
  size?: BadgeSize;
  icon?: React.ReactNode;
}) {
  return (
    <span
      className={`inline-flex w-fit items-center gap-1.5 rounded-full font-medium uppercase tracking-[0.18em] ring-1 ${VARIANT_CLASSES[variant]} ${SIZE_CLASSES[size]} ${className ?? ""}`}
      {...props}
    >
      {icon}
      {children}
    </span>
  );
}


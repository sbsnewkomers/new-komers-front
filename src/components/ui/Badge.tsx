import * as React from "react";

export type BadgeVariant = "neutral" | "success" | "info" | "warning" | "danger";
export type BadgeSize = "sm" | "md";

const VARIANT_CLASSES: Record<BadgeVariant, string> = {
  neutral: "bg-muted text-muted-foreground ring-border",
  success: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  info: "bg-blue-50 text-blue-700 ring-blue-200",
  warning: "bg-yellow-50 text-yellow-700 ring-yellow-200",
  danger: "bg-red-50 text-red-700 ring-red-200",
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
      className={`inline-flex w-fit items-center gap-1.5 rounded-full font-medium uppercase tracking-wide ring-1 ${VARIANT_CLASSES[variant]} ${SIZE_CLASSES[size]} ${className ?? ""}`}
      {...props}
    >
      {icon}
      {children}
    </span>
  );
}


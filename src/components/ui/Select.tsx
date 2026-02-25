import * as React from "react";

export function Select({
  className,
  value,
  onValueChange,
  children,
  placeholder,
  ...props
}: Omit<React.SelectHTMLAttributes<HTMLSelectElement>, "onChange"> & {
  value?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <select
      value={value ?? ""}
      onChange={(e) => onValueChange?.(e.target.value)}
      className={
        "flex h-10 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground " +
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary " +
        (className ?? "")
      }
      {...props}
    >
      {placeholder != null && (
        <option value="" disabled>
          {placeholder}
        </option>
      )}
      {children}
    </select>
  );
}

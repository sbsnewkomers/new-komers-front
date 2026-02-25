"use client";

import * as React from "react";

export function Checkbox({
  checked,
  defaultChecked,
  onCheckedChange,
  disabled,
  className,
  ...props
}: Omit<React.InputHTMLAttributes<HTMLInputElement>, "type" | "onChange"> & {
  onCheckedChange?: (checked: boolean) => void;
}) {
  const isControlled = checked !== undefined;
  const [internalChecked, setInternalChecked] = React.useState(defaultChecked ?? false);
  const isChecked = isControlled ? checked : internalChecked;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const next = e.target.checked;
    if (!isControlled) setInternalChecked(next);
    onCheckedChange?.(next);
  };

  return (
    <input
      type="checkbox"
      checked={isChecked}
      onChange={handleChange}
      disabled={disabled}
      className={
        "h-4 w-4 rounded border-border text-primary focus:ring-2 focus:ring-primary " +
        (className ?? "")
      }
      {...props}
    />
  );
}

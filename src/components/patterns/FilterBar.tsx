"use client";

import * as React from "react";

export function FilterBar({
  search,
  filters,
  actions,
  className,
}: {
  search?: React.ReactNode;
  filters?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={[
        "flex flex-col gap-3 md:flex-row md:items-center",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {search && <div className="flex-1">{search}</div>}
      {filters && <div className="w-full md:w-auto">{filters}</div>}
      {actions && <div className="w-full md:w-auto">{actions}</div>}
    </div>
  );
}


"use client";

import * as React from "react";

export function PageHeader({
  icon,
  title,
  subtitle,
  actions,
  children,
  className,
}: {
  icon?: React.ReactNode;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={["flex flex-col gap-4", className].filter(Boolean).join(" ")}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="mb-1 flex items-center gap-3">
          {icon}
          <div>
            <h2 className="text-xl font-bold text-primary">{title}</h2>
            {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
          </div>
        </div>
        {actions && <div className="flex w-full items-center gap-3 sm:w-auto">{actions}</div>}
      </div>
      {children}
    </div>
  );
}


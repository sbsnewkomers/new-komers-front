"use client";

import * as React from "react";

type DropdownMenuContextValue = {
  open: boolean;
  setOpen: (v: boolean) => void;
};

const DropdownMenuContext = React.createContext<DropdownMenuContextValue | null>(null);

export function DropdownMenu({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false);
  return (
    <DropdownMenuContext.Provider value={{ open, setOpen }}>
      <div className="relative inline-block">{children}</div>
    </DropdownMenuContext.Provider>
  );
}

export function DropdownMenuTrigger({
  asChild,
  children,
  className,
}: {
  asChild?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  const ctx = React.useContext(DropdownMenuContext);
  if (!ctx) return null;
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    ctx.setOpen(!ctx.open);
  };
  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children as React.ReactElement<{ onClick?: (e: React.MouseEvent) => void; className?: string }>, {
      onClick: handleClick,
      className: [className, (children as React.ReactElement & { props: { className?: string } }).props?.className].filter(Boolean).join(" "),
    });
  }
  return (
    <button type="button" onClick={handleClick} className={className}>
      {children}
    </button>
  );
}

export function DropdownMenuContent({
  className,
  children,
  align = "end",
}: {
  className?: string;
  children: React.ReactNode;
  align?: "start" | "end";
}) {
  const ctx = React.useContext(DropdownMenuContext);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) ctx?.setOpen(false);
    }
    if (ctx?.open) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [ctx?.open]);

  if (!ctx?.open) return null;

  const alignClass = align === "end" ? "right-0" : "left-0";

  return (
    <div
      ref={ref}
      className={`absolute z-50 bottom-0 mt-1 min-w-[8rem] rounded-md border border-border bg-background p-1 shadow-lg ${alignClass} ${className ?? ""}`}
    >
      {children}
    </div>
  );
}

export function DropdownMenuItem({
  className,
  onClick,
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const ctx = React.useContext(DropdownMenuContext);
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    onClick?.(e);
    ctx?.setOpen(false);
  };
  return (
    <button
      type="button"
      className={`relative flex w-full cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-muted focus:bg-muted ${className ?? ""}`}
      onClick={handleClick}
      {...props}
    >
      {children}
    </button>
  );
}

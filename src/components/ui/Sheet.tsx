"use client";

import * as React from "react";

type SheetContextValue = {
  open: boolean;
  setOpen: (v: boolean) => void;
};

const SheetContext = React.createContext<SheetContextValue | null>(null);

export function Sheet({
  open,
  onOpenChange,
  children,
}: {
  open: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
}) {
  const [openState, setOpenState] = React.useState(false);
  const isControlled = open !== undefined;
  const isOpen = isControlled ? open : openState;
  const setOpen = React.useCallback(
    (v: boolean) => {
      if (!isControlled) setOpenState(v);
      onOpenChange?.(v);
    },
    [isControlled, onOpenChange]
  );
  return (
    <SheetContext.Provider value={{ open: isOpen, setOpen }}>
      {children}
    </SheetContext.Provider>
  );
}

export function SheetTrigger({
  asChild,
  children,
  onClick,
}: {
  asChild?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
}) {
  const ctx = React.useContext(SheetContext);
  if (!ctx) return null;
  const handleClick = () => {
    ctx.setOpen(true);
    onClick?.();
  };
  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children as React.ReactElement<{ onClick?: () => void }>, { onClick: handleClick });
  }
  return <button type="button" onClick={handleClick}>{children}</button>;
}

export function SheetContent({
  className,
  children,
  side = "right",
}: {
  className?: string;
  children: React.ReactNode;
  side?: "left" | "right";
}) {
  const ctx = React.useContext(SheetContext);

  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") ctx?.setOpen(false);
    };
    if (ctx?.open) {
      document.addEventListener("keydown", handler);
      document.body.style.overflow = "hidden";
      return () => {
        document.removeEventListener("keydown", handler);
        document.body.style.overflow = "";
      };
    }
  }, [ctx?.open]);

  if (!ctx?.open) return null;

  const sideClass = side === "right" ? "right-0 top-0" : "left-0 top-0";

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/80"
        onClick={() => ctx.setOpen(false)}
        aria-hidden
      />
      <div
        className={`fixed z-50 h-full w-full max-w-sm border-border bg-background shadow-lg sm:max-w-md ${sideClass} ${className ?? ""}`}
        role="dialog"
      >
        {children}
      </div>
    </>
  );
}

export function SheetHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={`flex flex-col space-y-1.5 border-b border-border p-4 ${className ?? ""}`} {...props} />;
}

export function SheetTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h2 className={`text-lg font-semibold text-foreground ${className ?? ""}`} {...props} />;
}

export function SheetClose({ children, className, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const ctx = React.useContext(SheetContext);
  return (
    <button type="button" onClick={() => ctx?.setOpen(false)} className={className} {...props}>
      {children}
    </button>
  );
}

export function SheetBody({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={`flex-1 overflow-auto p-4 ${className ?? ""}`} {...props} />;
}

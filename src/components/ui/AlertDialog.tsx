"use client";

import * as React from "react";

type AlertDialogContextValue = {
  open: boolean;
  setOpen: (v: boolean) => void;
};

const AlertDialogContext = React.createContext<AlertDialogContextValue | null>(null);

export function AlertDialog({
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
    <AlertDialogContext.Provider value={{ open: isOpen, setOpen }}>
      {children}
    </AlertDialogContext.Provider>
  );
}

export function AlertDialogContent({
  className,
  children,
}: React.HTMLAttributes<HTMLDivElement>) {
  const ctx = React.useContext(AlertDialogContext);
  const ref = React.useRef<HTMLDivElement>(null);

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

  return (
    <>
      <div
        className="fixed inset-0 z-50 bg-black/80"
        onClick={() => ctx.setOpen(false)}
        aria-hidden
      />
      <div
        ref={ref}
        role="alertdialog"
        className={
          "fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-lg border border-border bg-background p-6 shadow-lg " +
          (className ?? "")
        }
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </>
  );
}

export function AlertDialogHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={`flex flex-col space-y-1.5 ${className ?? ""}`} {...props} />;
}

export function AlertDialogTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h2 className={`text-lg font-semibold leading-none tracking-tight ${className ?? ""}`} {...props} />;
}

export function AlertDialogDescription({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={`text-sm text-muted-foreground ${className ?? ""}`} {...props} />;
}

export function AlertDialogFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`mt-4 flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 ${className ?? ""}`}
      {...props}
    />
  );
}

"use client";

import * as React from "react";

type AlertDialogContextValue = {
  open: boolean;
  setOpen: (v: boolean) => void;
};

const AlertDialogContext = React.createContext<AlertDialogContextValue | null>(
  null
);

export type AlertDialogSize = "sm" | "md" | "lg";

const SIZE_CLASSES: Record<AlertDialogSize, string> = {
  sm: "sm:max-w-sm",
  md: "sm:max-w-md",
  lg: "sm:max-w-lg",
};

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

type AlertDialogContentProps = React.HTMLAttributes<HTMLDivElement> & {
  size?: AlertDialogSize;
};

export function AlertDialogContent({
  className,
  children,
  size = "md",
}: AlertDialogContentProps) {
  const ctx = React.useContext(AlertDialogContext);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") ctx?.setOpen(false);
    };
    if (ctx?.open) {
      document.addEventListener("keydown", handler);
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.removeEventListener("keydown", handler);
        document.body.style.overflow = prev;
      };
    }
  }, [ctx?.open]);

  if (!ctx?.open) return null;

  const sizeClass = SIZE_CLASSES[size];

  return (
    <>
      <div
        className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm animate-in fade-in-0"
        onClick={() => ctx.setOpen(false)}
        aria-hidden
      />
      <div
        ref={ref}
        role="alertdialog"
        aria-modal="true"
        className={
          `fixed left-1/2 top-1/2 z-50 flex w-[calc(100vw-1rem)] -translate-x-1/2 -translate-y-1/2 flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl animate-in zoom-in-95 duration-150 ${sizeClass} ` +
          (className ?? "")
        }
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </>
  );
}

export function AlertDialogHeader({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`flex flex-col space-y-1.5 ${className ?? ""}`}
      {...props}
    />
  );
}

export function AlertDialogTitle({
  className,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h2
      className={`text-lg font-semibold leading-tight tracking-tight text-slate-900 ${className ?? ""}`}
      {...props}
    />
  );
}

export function AlertDialogDescription({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={`text-sm leading-normal text-slate-500 ${className ?? ""}`}
      {...props}
    />
  );
}

export function AlertDialogFooter({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`mt-2 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end ${className ?? ""}`}
      {...props}
    />
  );
}

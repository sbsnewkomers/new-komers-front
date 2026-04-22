"use client";

import * as React from "react";
import { X } from "lucide-react";

type DialogContextValue = {
  open: boolean;
  setOpen: (v: boolean) => void;
};

const DialogContext = React.createContext<DialogContextValue | null>(null);

export type DialogSize =
  | "sm"
  | "md"
  | "lg"
  | "xl"
  | "2xl"
  | "3xl"
  | "4xl"
  | "5xl"
  | "6xl"
  | "7xl"
  | "full";

const SIZE_CLASSES: Record<DialogSize, string> = {
  sm: "sm:max-w-sm",
  md: "sm:max-w-md",
  lg: "sm:max-w-lg",
  xl: "sm:max-w-xl",
  "2xl": "sm:max-w-2xl",
  "3xl": "sm:max-w-3xl",
  "4xl": "sm:max-w-4xl",
  "5xl": "sm:max-w-5xl",
  "6xl": "sm:max-w-6xl",
  "7xl": "lg:max-w-7xl",
  full: "sm:max-w-[95vw]",
};

export function Dialog({
  open,
  onOpenChange,
  children,
}: {
  open: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
}) {
  const [openState, setOpenState] = React.useState(open);
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
    <DialogContext.Provider value={{ open: isOpen, setOpen }}>
      {children}
    </DialogContext.Provider>
  );
}

export function DialogTrigger({
  asChild,
  children,
  onClick,
}: {
  asChild?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
}) {
  const ctx = React.useContext(DialogContext);
  if (!ctx) return null;
  const handleClick = () => {
    ctx.setOpen(true);
    onClick?.();
  };
  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(
      children as React.ReactElement<{ onClick?: () => void }>,
      { onClick: handleClick }
    );
  }
  return (
    <button type="button" onClick={handleClick}>
      {children}
    </button>
  );
}

export function DialogPortal({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

export function DialogOverlay({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 ${className ?? ""}`}
      {...props}
    />
  );
}

type DialogContentProps = React.HTMLAttributes<HTMLDivElement> & {
  onClose?: () => void;
  size?: DialogSize;
  showClose?: boolean;
  preventOverlayClose?: boolean;
};

export function DialogContent({
  className,
  children,
  onClose,
  size = "lg",
  showClose = true,
  preventOverlayClose = false,
}: DialogContentProps) {
  const ctx = React.useContext(DialogContext);
  const ref = React.useRef<HTMLDivElement>(null);
  const isOpen = ctx?.open ?? false;
  const setOpen = ctx?.setOpen;

  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen?.(false);
        onClose?.();
      }
    };
    if (isOpen) {
      document.addEventListener("keydown", handler);
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.removeEventListener("keydown", handler);
        document.body.style.overflow = prevOverflow;
      };
    }
  }, [isOpen, onClose, setOpen]);

  if (!ctx?.open) return null;

  const sizeClass = SIZE_CLASSES[size];

  return (
    <DialogPortal>
      <div
        className="fixed inset-0 z-50 flex items-end justify-center p-2 sm:items-center sm:p-4 animate-in fade-in-0 duration-150"
        onClick={() => {
          if (preventOverlayClose) return;
          ctx.setOpen(false);
          onClose?.();
        }}
      >
        <DialogOverlay />
        <div
          ref={ref}
          role="dialog"
          aria-modal="true"
          className={`relative z-50 flex w-full flex-col overflow-hidden rounded-t-2xl border border-slate-200 bg-white shadow-2xl max-sm:max-h-[calc(100dvh-1rem)] sm:rounded-2xl sm:max-h-[88dvh] sm:w-full ${sizeClass} animate-in slide-in-from-bottom-4 sm:zoom-in-95 sm:slide-in-from-bottom-0 duration-200 ${className ?? ""}`}
          onClick={(e) => e.stopPropagation()}
        >
          {children}
          {showClose && (
            <button
              type="button"
              aria-label="Fermer"
              onClick={() => {
                ctx.setOpen(false);
                onClose?.();
              }}
              className="absolute right-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-200"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </DialogPortal>
  );
}

export function DialogHeader({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`flex shrink-0 flex-col gap-1 border-b border-slate-100 bg-white px-5 pt-5 pb-4 pr-12 ${className ?? ""}`}
      {...props}
    />
  );
}

export function DialogTitle({
  className,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h2
      className={`text-base font-semibold leading-tight tracking-tight text-slate-900 sm:text-lg ${className ?? ""}`}
      {...props}
    />
  );
}

export function DialogDescription({
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

export function DialogBody({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-4 ${className ?? ""}`}
      {...props}
    />
  );
}

export function DialogFooter({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`flex shrink-0 flex-col-reverse gap-2 border-t border-slate-100 bg-white px-5 py-3 sm:flex-row sm:justify-end ${className ?? ""}`}
      {...props}
    />
  );
}

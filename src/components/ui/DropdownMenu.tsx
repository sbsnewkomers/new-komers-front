"use client";

import * as React from "react";
import { createPortal } from "react-dom";

function mergeRefs<T>(
  refs: Array<React.Ref<T> | undefined>,
): React.RefCallback<T> {
  return (value) => {
    for (const ref of refs) {
      if (!ref) continue;
      if (typeof ref === "function") ref(value);
      else (ref as React.MutableRefObject<T | null>).current = value;
    }
  };
}

type DropdownMenuContextValue = {
  open: boolean;
  setOpen: (v: boolean) => void;
  triggerElement: HTMLElement | null;
  setTriggerElement: (el: HTMLElement | null) => void;
};

const DropdownMenuContext = React.createContext<DropdownMenuContextValue | null>(
  null,
);

export function DropdownMenu({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false);
  const [triggerElement, setTriggerElement] = React.useState<HTMLElement | null>(
    null,
  );

  React.useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <DropdownMenuContext.Provider
      value={{
        open,
        setOpen,
        triggerElement,
        setTriggerElement,
      }}
    >
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
    const child = children as React.ReactElement<{
      onClick?: (e: React.MouseEvent) => void;
      className?: string;
      ref?: React.Ref<HTMLElement>;
    }>;
    return React.cloneElement(child, {
      ref: mergeRefs([child.props.ref, (el: HTMLElement | null) => ctx.setTriggerElement(el)]),
      onClick: (e: React.MouseEvent) => {
        child.props.onClick?.(e);
        handleClick(e);
      },
      className: [className, child.props?.className].filter(Boolean).join(" "),
    });
  }
  return (
    <button
      type="button"
      ref={(el) => ctx.setTriggerElement(el)}
      onClick={handleClick}
      className={className}
    >
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
  const open = ctx?.open ?? false;
  const setOpen = ctx?.setOpen;
  const triggerEl = ctx?.triggerElement;

  const menuRef = React.useRef<HTMLDivElement>(null);
  const [portalStyle, setPortalStyle] = React.useState<React.CSSProperties | null>(
    null,
  );
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const updatePosition = React.useCallback(() => {
    const trigger = triggerEl ?? null;
    if (!trigger || typeof window === "undefined") return;
    const rect = trigger.getBoundingClientRect();
    const gap = 4;
    const top = rect.bottom + gap;
    if (align === "end") {
      setPortalStyle({
        position: "fixed",
        top,
        left: rect.right,
        transform: "translateX(-100%)",
        zIndex: 300,
        minWidth: Math.max(rect.width, 128),
      });
    } else {
      setPortalStyle({
        position: "fixed",
        top,
        left: rect.left,
        zIndex: 300,
        minWidth: Math.max(rect.width, 128),
      });
    }
  }, [triggerEl, align]);

  React.useLayoutEffect(() => {
    if (!open) {
      setPortalStyle(null);
      return;
    }
    updatePosition();
  }, [open, updatePosition]);

  React.useLayoutEffect(() => {
    if (!open) return;
    const onScrollOrResize = () => updatePosition();
    window.addEventListener("scroll", onScrollOrResize, true);
    window.addEventListener("resize", onScrollOrResize);
    return () => {
      window.removeEventListener("scroll", onScrollOrResize, true);
      window.removeEventListener("resize", onScrollOrResize);
    };
  }, [open, updatePosition]);

  React.useEffect(() => {
    if (!open || !setOpen) return;
    function handlePointerDown(e: MouseEvent) {
      const t = e.target as Node;
      if (menuRef.current?.contains(t)) return;
      if (triggerEl?.contains(t)) return;
      setOpen?.(false);
    }
    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [open, setOpen, triggerEl]);

  if (!open || !mounted || !portalStyle) return null;

  const content = (
    <div
      ref={menuRef}
      style={portalStyle}
      className={`rounded-md border border-border bg-background p-1 text-popover-foreground shadow-lg ${className ?? ""}`}
    >
      {children}
    </div>
  );

  return createPortal(content, document.body);
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

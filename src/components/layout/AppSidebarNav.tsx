"use client";

import * as React from "react";
import Link from "next/link";

import type { PermissionsUser } from "@/permissions/types";

import { ChevronDown } from "lucide-react";

import type {
  AppNavGroupItem,
  AppNavItem,
  AppNavLinkItem,
} from "@/components/layout/appNavConfig";

function isNavItemVisible(
  item: AppNavItem | AppNavLinkItem,
  user: PermissionsUser | null,
): boolean {
  if ("requireAuth" in item && item.requireAuth && !user) return false;
  if (item.roles?.length) {
    return !!user?.role && item.roles.includes(user.role);
  }
  return true;
}

function isActivePath(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

type AppSidebarNavProps = {
  variant: "desktop" | "mobile";
  pathname: string;
  user: PermissionsUser | null;
  mainItems: readonly AppNavItem[];
  footerItems?: readonly AppNavLinkItem[];
  /** Shown below footer links on desktop; on mobile, only main + footer inside nav (no bottom slot). */
  bottomSlot?: React.ReactNode;
  footerRef?: React.Ref<HTMLDivElement>;
  onLinkClick?: () => void;
};

export function AppSidebarNav({
  variant,
  pathname,
  user,
  mainItems,
  footerItems = [],
  bottomSlot,
  footerRef,
  onLinkClick,
}: AppSidebarNavProps) {
  const [openGroups, setOpenGroups] = React.useState<Record<string, boolean>>(
    {},
  );

  const visibleMain = React.useMemo(
    () => mainItems.filter((i) => isNavItemVisible(i, user)),
    [mainItems, user],
  );

  const visibleFooter = React.useMemo(
    () => footerItems.filter((i) => isNavItemVisible(i, user)),
    [footerItems, user],
  );

  React.useEffect(() => {
    setOpenGroups((prev) => {
      const next = { ...prev };
      for (const item of visibleMain) {
        if (item.type === "group") {
          const anyChildActive = item.children.some((c) =>
            isActivePath(pathname, c.href),
          );
          if (anyChildActive) next[item.id] = true;
        }
      }
      return next;
    });
  }, [pathname, visibleMain]);

  const navLinkClass = (href: string) =>
    "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all text-[13px] font-medium " +
    (isActivePath(pathname, href)
      ? "bg-white/10 border border-white/20 text-white before:content-[''] before:absolute before:left-0 before:top-2 before:bottom-2 before:w-[2px] before:rounded-full before:bg-linear-to-b before:from-(--nebula-gold-light) before:to-(--nebula-gold)"
      : "text-(--nebula-muted) hover:bg-white/5 hover:text-white border border-transparent");

  const childLinkClass = (href: string) =>
    `group flex items-center gap-3 rounded-xl px-3 py-2 transition-all text-[13px] font-medium border ${
      isActivePath(pathname, href)
        ? "bg-white/10 border-white/20 text-white"
        : "border-transparent text-(--nebula-muted) hover:bg-white/5 hover:text-white"
    }`;

  const groupButtonClass = (group: AppNavGroupItem) => {
    const active = group.children.some((c) => isActivePath(pathname, c.href));
    return (
      "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all text-[13px] font-medium w-full text-left border " +
      (active
        ? "bg-white/10 border-white/20 text-white before:content-[''] before:absolute before:left-0 before:top-2 before:bottom-2 before:w-[2px] before:rounded-full before:bg-linear-to-b before:from-(--nebula-gold-light) before:to-(--nebula-gold)"
        : "border-transparent text-(--nebula-muted) hover:bg-white/5 hover:text-white")
    );
  };

  const renderLink = (item: AppNavLinkItem) => {
    const Icon = item.icon;
    return (
      <Link
        key={item.href}
        href={item.href}
        className={navLinkClass(item.href)}
        onClick={onLinkClick}
      >
        <Icon className="h-4 w-4" />
        {item.label}
      </Link>
    );
  };

  const renderGroup = (item: AppNavGroupItem) => {
    const Icon = item.icon;
    const open = !!openGroups[item.id];
    return (
      <div key={item.id}>
        <button
          type="button"
          onClick={() =>
            setOpenGroups((s) => ({ ...s, [item.id]: !openGroups[item.id] }))
          }
          className={groupButtonClass(item)}
        >
          <Icon className="h-5 w-5" />
          {item.label}
          <ChevronDown
            className={`ml-auto h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`}
          />
        </button>
        {open && (
          <div className="ml-8 mt-2 space-y-1">
            {item.children.map((child) => {
              const ChildIcon = child.icon;
              return (
                <Link
                  key={child.href}
                  href={child.href}
                  className={childLinkClass(child.href)}
                  onClick={onLinkClick}
                >
                  <ChildIcon className="h-4 w-4" />
                  {child.label}
                </Link>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  const renderMainNode = (item: AppNavItem) =>
    item.type === "link" ? renderLink(item) : renderGroup(item);

  const navClassName =
    variant === "desktop"
      ? "flex-1 space-y-1 py-4"
      : "flex-1 space-y-1 px-3 py-4 overflow-y-auto";

  if (variant === "mobile") {
    return (
      <nav className={navClassName}>
        {visibleMain.map(renderMainNode)}
        {visibleFooter.map(renderLink)}
      </nav>
    );
  }

  return (
    <>
      <nav className={navClassName}>
        {visibleMain.map(renderMainNode)}
      </nav>

      <div
        ref={footerRef}
        className="mt-auto border-t border-white/10 pt-4 space-y-2"
      >
        {visibleFooter.map(renderLink)}
        {bottomSlot}
      </div>
    </>
  );
}

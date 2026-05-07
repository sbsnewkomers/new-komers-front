import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  BookOpen,
  Database,
  DollarSign,
  LayoutDashboard,
  Network,
  ScrollText,
  Upload,
  Users,
} from "lucide-react";

/** Visibility: optional role allow-list; requireAuth limits to signed-in users. */
export type AppNavVisibility = {
  requireAuth?: boolean;
  roles?: readonly string[];
};

export type AppNavChildItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

export type AppNavLinkItem = AppNavVisibility & {
  type: "link";
  href: string;
  label: string;
  icon: LucideIcon;
};

export type AppNavGroupItem = AppNavVisibility & {
  type: "group";
  id: string;
  label: string;
  icon: LucideIcon;
  children: readonly AppNavChildItem[];
};

export type AppNavItem = AppNavLinkItem | AppNavGroupItem;

export const APP_NAV_MAIN_ITEMS: readonly AppNavItem[] = [
  {
    type: "link",
    href: "/dashboard",
    label: "Tableau de bord",
    icon: LayoutDashboard,
  },
  {
    type: "link",
    href: "/structure",
    label: "Structure",
    icon: Network,
  },
  {
    type: "link",
    href: "/shareholders",
    label: "Actionnaires",
    icon: Users,
    roles: ["SUPER_ADMIN", "ADMIN", "MANAGER"],
  },
  {
    type: "group",
    id: "extracomptables",
    label: "Données extracomptables",
    icon: Database,
    requireAuth: true,
    children: [
      { href: "/loans", label: "Emprunts", icon: DollarSign },
      { href: "/dotations", label: "Dotations", icon: BookOpen },
    ],
  },
  {
    type: "link",
    href: "/import",
    label: "Import des données comptables",
    icon: Upload,
  },
  {
    type: "link",
    href: "/reporting",
    label: "Reporting",
    icon: BarChart3,
  },
  {
    type: "link",
    href: "/audit",
    label: "Journal d'audit",
    icon: ScrollText,
    roles: ["SUPER_ADMIN", "ADMIN"],
  },
] as const;

export const APP_NAV_FOOTER_ITEMS: readonly AppNavLinkItem[] = [
  {
    type: "link",
    href: "/users",
    label: "Utilisateurs",
    icon: Users,
    roles: ["SUPER_ADMIN", "ADMIN", "MANAGER", "HEAD_MANAGER"],
  },
] as const;

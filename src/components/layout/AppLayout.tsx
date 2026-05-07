"use client";

import * as React from "react";

import Link from "next/link";

import { useRouter } from "next/router";

import { usePermissionsContext } from "@/permissions/PermissionsProvider";

import { useWorkspaceContext } from "@/providers/WorkspaceProvider";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/Avatar";
import { AppSidebarNav } from "@/components/layout/AppSidebarNav";
import {
  APP_NAV_FOOTER_ITEMS,
  APP_NAV_MAIN_ITEMS,
} from "@/components/layout/appNavConfig";
import { useImpersonation } from "@/hooks/useImpersonation";

import {
  Bell,
  HelpCircle,
  ChevronRight,
  Menu,
  X,
  Shield,
  Sun,
  Moon,
  User,
} from "lucide-react";

type AppLayoutProps = {
  title: string;

  children: React.ReactNode;

  /** Optional: companies for global company selector */

  companies?: { id: string; name: string }[];

  /** Optional: workspaces for workspace display */

  workspaces?: { id: string; name: string }[];

  selectedCompanyId?: string;

  onCompanyChange?: (id: string) => void;
};

export function AppLayout({
  title,
  children,
  workspaces = [],
}: AppLayoutProps) {
  const router = useRouter();

  const { user, logout } = usePermissionsContext();

  const { workspaces: globalworkspaces } = useWorkspaceContext();

  const [userMenuOpen, setUserMenuOpen] = React.useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [theme, setTheme] = React.useState<"dark" | "light">(() => {
    if (typeof window === "undefined") return "dark";
    const stored = window.localStorage.getItem("nebula-theme");
    return stored === "light" ? "light" : "dark";
  });

  const menuRef = React.useRef<HTMLDivElement>(null);
  const { isImpersonating, exitImpersonation } = useImpersonation();
  const [exitLoading, setExitLoading] = React.useState(false);

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem("nebula-theme", theme);
    document.documentElement.classList.toggle("nebula-light", theme === "light");
  }, [theme]);

  // Récupérer le nom de l'workspace pour les rôles non-admin

  const workspaceName = React.useMemo(() => {
    if (user?.role === "SUPER_ADMIN" || user?.role === "ADMIN") {
      return null; // Les admins voient déjà toutes les workspaces dans la structure
    }

    // Utiliser les workspaces globales si disponibles, sinon utiliser les props

    const orgsToUse =
      globalworkspaces.length > 0 ? globalworkspaces : workspaces;

    // Pour les autres rôles (HEAD_MANAGER, MANAGER, END_USER), utiliser la première workspace de la liste

    return orgsToUse && orgsToUse.length > 0 ? orgsToUse[0].name : null;
  }, [user?.role, workspaces, globalworkspaces]);

  React.useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node))
        setUserMenuOpen(false);
    }

    if (userMenuOpen)
      document.addEventListener("mousedown", handleClickOutside);

    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [userMenuOpen]);

  const pathname = router.pathname;
  const handleExitImpersonation = async () => {
    setExitLoading(true);
    try {
      await exitImpersonation();

      // petit délai pour laisser React re-render
      await new Promise((r) => setTimeout(r, 50));

      router.push("/users");
    } finally {
      setExitLoading(false);
    }
  };

  return (
    <>
      {/* Bannière impersonation — visible uniquement en mode impersonation */}
      {isImpersonating && (
        <div className="fixed left-4 right-4 top-4 z-50">
          <div className="nebula-glass rounded-2xl px-5 py-3 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-[13px]">
              <Shield className="h-4 w-4 shrink-0 text-(--nebula-gold-light)" />
              <span className="text-(--nebula-muted)">
                Mode impersonation — vous naviguez en tant que{" "}
                <strong className="text-white">
                  {user?.firstName && user?.lastName
                    ? `${user.firstName} ${user.lastName}`
                    : user?.email}
                </strong>
              </span>
            </div>
            <button
              type="button"
              onClick={handleExitImpersonation}
              disabled={exitLoading}
              className="rounded-2xl bg-linear-to-r from-(--nebula-gold-light) to-(--nebula-gold) px-5 py-2 text-[12px] font-semibold text-white flex items-center gap-2 nebula-glow hover:scale-105 transition-transform disabled:opacity-50"
            >
              {exitLoading ? "Retour en cours..." : "← Reprendre ma session"}
            </button>
          </div>
        </div>
      )}
      <div className="h-screen w-full overflow-x-hidden nebula-grid-bg p-4">
        <div className="flex gap-4">
      {/* Sidebar */}

          <div className="hidden md:block w-[260px] sticky top-0 h-[calc(100vh-2rem)] nebula-glass-modal p-5 shadow-lg! shadow-primary/20!">
        <div className="flex h-full flex-col gap-2">
          <div className="flex items-center gap-3 px-1 py-2">
            <Link href="/" className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-linear-to-br from-(--nebula-gold-light) to-(--nebula-gold) text-white! nebula-glow">
                <span className="text-xl font-bold">N</span>
              </div>

              <div className="flex flex-col">
                <span className="text-sm font-bold nebula-grad-text uppercase tracking-wide line-clamp-1">
                  NEWKOMERS
                </span>

                <span className="text-[10px] font-medium text-(--nebula-muted) uppercase tracking-wider line-clamp-1">
                  B2B SAAS PLATFORM
                </span>

                {/* {workspaceName && (
                  <>
                    <ChevronRight className="h-4 w-4 text-slate-300" />

                    <span className="text-xs font-semibold text-white bg-linear-to-r from-blue-600 to-purple-600 px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-sm">
                      <Building className="h-3 w-3" />
                      {workspaceName}
                    </span>
                  </>
                )} */}
              </div>
            </Link>
          </div>

          <AppSidebarNav
            variant="desktop"
            pathname={pathname}
            user={user}
            mainItems={APP_NAV_MAIN_ITEMS}
            footerItems={APP_NAV_FOOTER_ITEMS}
            footerRef={menuRef}
            bottomSlot={(
            <div className="relative">
              <button
                type="button"
                onClick={() => setUserMenuOpen((o) => !o)}
                className="flex w-full items-center gap-3 rounded-xl p-2 text-left transition-all hover:bg-white/5 border border-white/10"
              >
                <Avatar className="h-10 w-10 border border-white/10 bg-white/5 rounded-xl flex items-center justify-center">
                    <User className="h-5 w-5 text-black" />
                </Avatar>

                <div className="flex flex-col overflow-hidden">
                  <span className="truncate text-sm font-semibold text-white">
                    {user?.email?.split("@")[0] || "-----"}
                  </span>

                  <span className="truncate text-[10px] font-medium text-(--nebula-muted) uppercase tracking-wider">
                    {user?.role?.replace("_", " ") || "----"}
                  </span>
                </div>
                <span className="ml-auto inline-flex h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.9)]" />
              </button>

              {userMenuOpen && (
                <div className="absolute bottom-full left-0 right-0 mb-2 nebula-glass rounded-2xl p-1 z-50">
                  <button
                    type="button"
                    className="w-full rounded-xl px-4 py-2 text-left text-sm text-white hover:bg-white/5"
                    onClick={() => {
                      setUserMenuOpen(false);

                      void router.push("/profile");
                    }}
                  >
                    Mon Profil
                  </button>

                  <button
                    type="button"
                    className="w-full rounded-xl px-4 py-2 text-left text-sm text-white hover:bg-white/5"
                    onClick={() => {
                      setUserMenuOpen(false);

                      logout();

                      void router.push("/");
                    }}
                  >
                    Déconnexion
                  </button>
                </div>
              )}
            </div>
            )}
          />

        </div>
      </div>

      {/* Main */}

      <div className="flex min-w-0 flex-1 flex-col gap-4">
        <header className="h-16 rounded-3xl sticky top-0 z-10 shadow-lg! shadow-primary/20!">
              <div className="h-full w-full flex items-center rounded-2xl justify-between px-6 nebula-glass-modal backdrop-blur-lg bg-linear-to-l! from-(--nebula-gold-light)/30 via-(--nebula-gold-light)/15 to-transparent">
            {/* Left: mobile menu button + breadcrumbs */}

            <div className="flex min-w-0 items-center gap-3">
              <button
                type="button"
                className="h-9 w-9 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white flex items-center justify-center md:hidden"
                onClick={() => setMobileMenuOpen(true)}
                aria-label="Ouvrir le menu de navigation"
              >
                <Menu className="h-5 w-5" />
              </button>

              <div className="flex min-w-0 items-center gap-1">
                <span className="h-2 w-2 mr-1 rounded-full bg-(--nebula-gold-light) animate-pulse shadow-[0_0_10px_rgba(212,176,106,0.6)]" />
                <span className="text-[10px] uppercase tracking-[0.2em] text-(--nebula-muted)">
                  § Navigation
                </span>

                <ChevronRight className="h-4 w-4 text-primary/60" />
                {workspaceName && (
                  <>
                    <span className="px-3 py-1 rounded-full bg-white/10 border border-white/15 text-[11px] font-mono text-white">
                      {workspaceName}
                    </span>
                    <ChevronRight className="h-4 w-4 text-primary/60" />
                  </>
                )}
                <span className="line-clamp-1 font-semibold text-primary">
                  {title}
                </span>
              </div>
            </div>

            {/* Right Actions */} 

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setTheme((t) => (t === "light" ? "dark" : "light"))}
                className="h-9 w-9 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white flex items-center justify-center"
                aria-label="Basculer le thème"
              >
                {theme === "light" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
              </button>
              <button
                type="button"
                className="h-9 w-9 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white flex items-center justify-center"
                aria-label="Aide"
              >
                <HelpCircle className="h-5 w-5" />
              </button>
              <button
                type="button"
                className="h-9 w-9 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white flex items-center justify-center relative"
                aria-label="Notifications"
              >
                <Bell className="h-5 w-5" />
                <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-(--nebula-gold-light) ring-2 ring-black/40" />
              </button>
            </div>
          </div>
        </header>

        <main className="safe-area-pb flex min-h-0 min-w-0 flex-1 flex-col gap-4 overflow-x-hidden overflow-y-auto p-0">
          {children}
        </main>
      </div>
        </div>

      {/* Mobile sidebar / drawer */}

      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div
            className="fixed inset-0 bg-black/40"
            onClick={() => setMobileMenuOpen(false)}
          />

          <div className="relative z-10 flex h-full w-[min(85vw,260px)] flex-col nebula-glass-modal rounded-none border-r border-white/10">
            <div className="flex items-center justify-between px-4 py-4 border-b border-white/10">
              <Link
                href="/"
                className="flex items-center gap-2 min-w-0 flex-1"
                onClick={() => setMobileMenuOpen(false)}
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-linear-to-br from-(--nebula-gold-light) to-(--nebula-gold) text-white nebula-glow shrink-0">
                  <span className="text-lg font-bold">N</span>
                </div>

                <span className="text-sm font-bold text-white uppercase tracking-wide truncate">
                  NEWKOMERS
                </span>
              </Link>

              <button
                type="button"
                className="h-8 w-8 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white flex items-center justify-center"
                onClick={() => setMobileMenuOpen(false)}
                aria-label="Fermer le menu"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <AppSidebarNav
              variant="mobile"
              pathname={pathname}
              user={user}
              mainItems={APP_NAV_MAIN_ITEMS}
              footerItems={APP_NAV_FOOTER_ITEMS}
              onLinkClick={() => setMobileMenuOpen(false)}
            />

            <div className="border-t border-slate-100 p-4">
              <button
                type="button"
                className="flex w-full items-center justify-between rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-700 hover:bg-slate-100"
                onClick={() => {
                  setMobileMenuOpen(false);

                  logout();

                  void router.push("/");
                }}
              >
                <span>Déconnexion</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    </>
  );
}

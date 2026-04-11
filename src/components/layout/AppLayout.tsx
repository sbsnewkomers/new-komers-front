"use client";

import * as React from "react";

import Link from "next/link";

import { useRouter } from "next/router";

import { usePermissionsContext } from "@/permissions/PermissionsProvider";

import { useWorkspaceContext } from "@/providers/WorkspaceProvider";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/Avatar";

import { Button } from "@/components/ui/Button";
import {
  LayoutDashboard,
  BarChart3,
  Settings,
  BookOpen,
  Network,
  Bell,
  HelpCircle,
  ChevronRight,
  ChevronDown,
  Upload,
  Users,
  ScrollText,
  Menu,
  X,
  Building,
  DollarSign,
  Database,
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
  const [extracomptablesMenuOpen, setExtracomptablesMenuOpen] = React.useState(false);

  const menuRef = React.useRef<HTMLDivElement>(null);

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

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";

    return pathname === href || pathname.startsWith(href + "/");
  };

  const navLinkClass = (href: string) =>
    "group flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all text-sm font-medium " +
    (isActive(href)
      ? "bg-slate-100 text-primary"
      : "text-slate-500 hover:bg-slate-50 hover:text-primary");

  return (
    <div className="grid min-h-screen w-full md:grid-cols-[240px_1fr] lg:grid-cols-[260px_1fr]">
      {/* Sidebar */}

      <div className="hidden border-r border-slate-100 bg-white md:block">
        <div className="flex h-full max-h-screen flex-col gap-2">
          <div className="flex h-20 items-center px-6">
            <Link href="/" className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-white shadow-sm">
                <span className="text-xl font-bold">N</span>
              </div>

              <div className="flex flex-col">
                <span className="text-sm font-bold text-primary uppercase tracking-wide line-clamp-1">
                  NEWKOMERS
                </span>

                <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wider line-clamp-1">
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

          <nav className="flex-1 space-y-1 px-4 py-4">
            <Link href="/dashboard" className={navLinkClass("/dashboard")}>
              <LayoutDashboard className="h-5 w-5" />
              Dashboard
            </Link>

            <Link href="/structure" className={navLinkClass("/structure")}>
              <Network className="h-5 w-5" />
              Structure
            </Link>

            {(user?.role === "SUPER_ADMIN" ||
              user?.role === "ADMIN" ||
              user?.role === "MANAGER") && (
                <Link
                  href="/shareholders"
                  className={navLinkClass("/shareholders")}
                >
                  <Users className="h-5 w-5" />
                  Shareholders
                </Link>
              )}
            {(user?.role === "SUPER_ADMIN" ||
              user?.role === "ADMIN" ||
              user?.role === "HEAD_MANAGER" ||
              user?.role === "MANAGER") && (
                <div>
                  <button
                    onClick={() => setExtracomptablesMenuOpen(!extracomptablesMenuOpen)}
                    className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all text-sm font-medium w-full text-left ${isActive("/loans") || isActive("/dotations")
                      ? "bg-slate-100 text-primary"
                      : "text-slate-500 hover:bg-slate-50 hover:text-primary"
                      }`}
                  >
                    <Database className="h-5 w-5" />
                    Données extracomptables
                    <ChevronDown
                      className={`ml-auto h-4 w-4 transition-transform ${extracomptablesMenuOpen ? "rotate-180" : ""
                        }`}
                    />
                  </button>
                  {extracomptablesMenuOpen && (
                    <div className="ml-8 mt-1 space-y-1">
                      <Link
                        href="/loans"
                        className={`group flex items-center gap-3 rounded-lg px-3 py-2 transition-all text-sm font-medium ${isActive("/loans")
                          ? "bg-primary/10 text-primary"
                          : "text-slate-500 hover:bg-slate-50 hover:text-primary"
                          }`}
                      >
                        <DollarSign className="h-4 w-4" />
                        Emprunts
                      </Link>
                      <Link
                        href="/dotations"
                        className={`group flex items-center gap-3 rounded-lg px-3 py-2 transition-all text-sm font-medium ${isActive("/dotations")
                          ? "bg-primary/10 text-primary"
                          : "text-slate-500 hover:bg-slate-50 hover:text-primary"
                          }`}
                      >
                        <BookOpen className="h-4 w-4" />
                        Dotations
                      </Link>
                    </div>
                  )}
                </div>
              )}

            {/* <Link href="/budget" className={navLinkClass("/budget")}>
              <BookOpen className="h-5 w-5" />
              Accounting
            </Link> */}

            <Link href="/import" className={navLinkClass("/import")}>
              <Upload className="h-5 w-5" />
              Mapping
            </Link>

            <Link href="/reporting" className={navLinkClass("/reporting")}>
              <BarChart3 className="h-5 w-5" />
              Reporting
            </Link>

            {(user?.role === "SUPER_ADMIN" || user?.role === "ADMIN") && (
              <Link href="/audit" className={navLinkClass("/audit")}>
                <ScrollText className="h-5 w-5" />
                Audit
              </Link>
            )}
          </nav>

          <div
            className="mt-auto border-t border-slate-100 p-4 space-y-2"
            ref={menuRef}
          >
            {(user?.role === "SUPER_ADMIN" ||
              user?.role === "ADMIN" ||
              user?.role === "MANAGER" ||
              user?.role === "HEAD_MANAGER") && (
                <Link href="/users" className={navLinkClass("/users")}>
                  <Users className="h-5 w-5" />
                  Users
                </Link>
              )}

            <Link href="/settings" className={navLinkClass("/settings")}>
              <Settings className="h-5 w-5" />
              Settings
            </Link>

            <div className="relative">
              <button
                type="button"
                onClick={() => setUserMenuOpen((o) => !o)}
                className="flex w-full items-center gap-3 rounded-xl p-2 text-left transition-all hover:bg-slate-50"
              >
                <Avatar className="h-10 w-10 border border-slate-100 bg-emerald-100">
                  <AvatarImage src="" />

                  <AvatarFallback className="bg-emerald-100 text-emerald-700 font-semibold">
                    {(user?.email ?? "JW").slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>

                <div className="flex flex-col overflow-hidden">
                  <span className="truncate text-sm font-semibold text-primary">
                    {user?.email?.split("@")[0] || "-----"}
                  </span>

                  <span className="truncate text-[10px] font-medium text-slate-500 uppercase tracking-wider">
                    {user?.role?.replace("_", " ") || "----"}
                  </span>
                </div>
              </button>

              {userMenuOpen && (
                <div className="absolute bottom-full left-0 right-0 mb-2 rounded-xl border border-slate-100 bg-white p-1 shadow-lg z-50">
                  <button
                    type="button"
                    className="w-full rounded-lg px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
                    onClick={() => {
                      setUserMenuOpen(false);

                      void router.push("/profile");
                    }}
                  >
                    Mon Profil
                  </button>

                  <button
                    type="button"
                    className="w-full rounded-lg px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50"
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
          </div>
        </div>
      </div>

      {/* Main */}

      <div className="flex flex-col bg-background">
        <header className="flex h-16 items-center justify-between border-b border-slate-100 bg-white px-4 md:px-6">
          {/* Left: mobile menu button + breadcrumbs */}

          <div className="flex items-center gap-3">
            <button
              type="button"
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 md:hidden"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Ouvrir le menu de navigation"
            >
              <Menu className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-1 text-sm text-slate-500">
              {/* <span
                className="cursor-pointer hover:text-primary transition-colors"
                onClick={() => void router.push("/")}
              >
                NewKomers
              </span>

              <ChevronRight className="h-4 w-4 text-slate-300" /> */}

              {workspaceName && (
                <>
                  <Building className="size-9 p-1.5 text-white bg-linear-to-r from-cyan-400 to-blue-600 rounded-full" />
                  <span className="font-semibold text-blue-600 drop-shadow-sm">
                    {workspaceName}
                  </span>

                  <ChevronRight className="h-4 w-4 text-slate-300" />
                </>
              )}

              <span className="font-medium text-primary line-clamp-1">
                {title}
              </span>

            </div>
          </div>

          {/* Right Actions */}

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1 border-l border-slate-100 pl-4">
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 text-slate-400 hover:bg-slate-50 hover:text-primary border border-slate-300!"
              >
                <HelpCircle className="h-5 w-5" />
              </Button>

              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 text-slate-400 hover:bg-slate-50 hover:text-primary relative border border-slate-300!"
              >
                <Bell className="h-5 w-5" />

                <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />
              </Button>
            </div>
          </div>
        </header>

        <main className="flex flex-1 flex-col gap-6 p-6 bg-slate-50 max-h-[calc(100vh-64px)] overflow-y-auto">
          {children}
        </main>
      </div>

      {/* Mobile sidebar / drawer */}

      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div
            className="fixed inset-0 bg-black/40"
            onClick={() => setMobileMenuOpen(false)}
          />

          <div className="relative z-10 flex h-full w-[260px] flex-col bg-white border-r border-slate-100 shadow-xl">
            <div className="flex items-center justify-between px-4 py-4 border-b border-slate-100">
              <Link
                href="/"
                className="flex items-center gap-2 min-w-0 flex-1"
                onClick={() => setMobileMenuOpen(false)}
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-white shadow-sm shrink-0">
                  <span className="text-lg font-bold">N</span>
                </div>

                <span className="text-sm font-bold text-primary uppercase tracking-wide truncate">
                  NEWKOMERS
                </span>
              </Link>

              <button
                type="button"
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
                onClick={() => setMobileMenuOpen(false)}
                aria-label="Fermer le menu"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto">
              <Link
                href="/dashboard"
                className={navLinkClass("/dashboard")}
                onClick={() => setMobileMenuOpen(false)}
              >
                <LayoutDashboard className="h-5 w-5" />
                Dashboard
              </Link>

              <Link
                href="/structure"
                className={navLinkClass("/structure")}
                onClick={() => setMobileMenuOpen(false)}
              >
                <Network className="h-5 w-5" />
                Structure
              </Link>

              {(user?.role === "SUPER_ADMIN" ||
                user?.role === "ADMIN" ||
                user?.role === "MANAGER") && (
                  <Link
                    href="/shareholders"
                    className={navLinkClass("/shareholders")}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Users className="h-5 w-5" />
                    Shareholders
                  </Link>
                )}

              {(user?.role === "SUPER_ADMIN" ||
                user?.role === "ADMIN" ||
                user?.role === "HEAD_MANAGER" ||
                user?.role === "MANAGER") && (
                  <div>
                    <button
                      onClick={() => setExtracomptablesMenuOpen(!extracomptablesMenuOpen)}
                      className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all text-sm font-medium w-full text-left ${isActive("/loans") || isActive("/dotations")
                        ? "bg-slate-100 text-primary"
                        : "text-slate-500 hover:bg-slate-50 hover:text-primary"
                        }`}
                    >
                      <Database className="h-5 w-5" />
                      Données extracomptables
                      <ChevronDown
                        className={`ml-auto h-4 w-4 transition-transform ${extracomptablesMenuOpen ? "rotate-180" : ""
                          }`}
                      />
                    </button>
                    {extracomptablesMenuOpen && (
                      <div className="ml-8 mt-1 space-y-1">
                        <Link
                          href="/loans"
                          className={`group flex items-center gap-3 rounded-lg px-3 py-2 transition-all text-sm font-medium ${isActive("/loans")
                            ? "bg-primary/10 text-primary"
                            : "text-slate-500 hover:bg-slate-50 hover:text-primary"
                            }`}
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          <DollarSign className="h-4 w-4" />
                          Emprunts
                        </Link>
                        <Link
                          href="/dotations"
                          className={`group flex items-center gap-3 rounded-lg px-3 py-2 transition-all text-sm font-medium ${isActive("/dotations")
                            ? "bg-primary/10 text-primary"
                            : "text-slate-500 hover:bg-slate-50 hover:text-primary"
                            }`}
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          <BookOpen className="h-4 w-4" />
                          Dotations
                        </Link>
                      </div>
                    )}
                  </div>
                )}

              <Link
                href="/budget"
                className={navLinkClass("/budget")}
                onClick={() => setMobileMenuOpen(false)}
              >
                <BookOpen className="h-5 w-5" />
                Accounting
              </Link>

              <Link
                href="/import"
                className={navLinkClass("/import")}
                onClick={() => setMobileMenuOpen(false)}
              >
                <Upload className="h-5 w-5" />
                Mapping
              </Link>

              <Link
                href="/reporting"
                className={navLinkClass("/reporting")}
                onClick={() => setMobileMenuOpen(false)}
              >
                <BarChart3 className="h-5 w-5" />
                Reporting
              </Link>

              {(user?.role === "SUPER_ADMIN" || user?.role === "ADMIN") && (
                <Link
                  href="/audit"
                  className={navLinkClass("/audit")}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <ScrollText className="h-5 w-5" />
                  Audit
                </Link>
              )}

              {(user?.role === "SUPER_ADMIN" ||
                user?.role === "ADMIN" ||
                user?.role === "MANAGER" ||
                user?.role === "HEAD_MANAGER") && (
                  <Link
                    href="/users"
                    className={navLinkClass("/users")}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Users className="h-5 w-5" />
                    Users
                  </Link>
                )}

              <Link
                href="/settings"
                className={navLinkClass("/settings")}
                onClick={() => setMobileMenuOpen(false)}
              >
                <Settings className="h-5 w-5" />
                Settings
              </Link>
            </nav>

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
  );
}

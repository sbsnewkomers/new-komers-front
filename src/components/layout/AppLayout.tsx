"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { usePermissionsContext } from "@/permissions/PermissionsProvider";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import {
  LayoutDashboard,
  BarChart3,
  Settings,
  BookOpen,
  Network,
  Search,
  Bell,
  HelpCircle,
  ChevronRight,
  Upload,
  Users,
  ScrollText,
} from "lucide-react";

type AppLayoutProps = {
  title: string;
  children: React.ReactNode;
  /** Optional: companies for global company selector */
  companies?: { id: string; name: string }[];
  selectedCompanyId?: string;
  onCompanyChange?: (id: string) => void;
};

export function AppLayout({ title, children, companies = [], selectedCompanyId = "", onCompanyChange }: AppLayoutProps) {
  const router = useRouter();
  const { user, logout } = usePermissionsContext();
  const [userMenuOpen, setUserMenuOpen] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setUserMenuOpen(false);
    }
    if (userMenuOpen) document.addEventListener("mousedown", handleClickOutside);
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
                <span className="text-sm font-bold text-primary uppercase tracking-wide">
                  NEWKOMERS
                </span>
                <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">
                  B2B SaaS Platform
                </span>
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
            {(user?.role === "SUPER_ADMIN" || user?.role === "ADMIN" || user?.role === "MANAGER") && (
              <Link href="/shareholders" className={navLinkClass("/shareholders")}>
                <Users className="h-5 w-5" />
                Shareholders
              </Link>
            )}
            <Link href="/budget" className={navLinkClass("/budget")}>
              <BookOpen className="h-5 w-5" />
              Accounting
            </Link>
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
            {(user?.role === "SUPER_ADMIN" || user?.role === "ADMIN" || user?.role === "MANAGER") && (
              <Link href="/settings/users" className={navLinkClass("/settings")}>
                <Users className="h-5 w-5" />
                Users
              </Link>
            )}
            <Link href="/permissions-assign" className={navLinkClass("/permissions-assign")}>
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
                    {user?.email?.split("@")[0] || "James Wilson"}
                  </span>
                  <span className="truncate text-[10px] font-medium text-slate-500 uppercase tracking-wider">
                    {user?.role?.replace("_", " ") || "CFO ADMIN"}
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
        <header className="flex h-16 items-center justify-between border-b border-slate-100 bg-white px-6">
          {/* Breadcrumbs */}
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <span className="cursor-pointer hover:text-primary transition-colors">
              NewKomers
            </span>
            <ChevronRight className="h-4 w-4 text-slate-300" />
            <span className="font-medium text-primary">{title}</span>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-4">
            {/* {companies.length > 0 && (
              <Select
                value={selectedCompanyId}
                onValueChange={onCompanyChange}
                placeholder="Entreprise"
                className="border-none bg-slate-100 text-sm font-medium text-slate-700 shadow-none focus:ring-0"
              >
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
            )} */}

            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                type="search"
                placeholder="Global search..."
                className="h-10 w-[240px] rounded-lg border-none bg-slate-100 pl-10 text-sm placeholder:text-slate-400 focus-visible:ring-0 lg:w-[320px]"
              />
            </div>

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
    </div>
  );
}

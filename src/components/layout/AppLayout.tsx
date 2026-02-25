"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { usePermissionsContext } from "@/permissions/PermissionsProvider";
import { Avatar, AvatarFallback } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Building2, Upload, LayoutDashboard, FileText, PieChart, ShieldCheck } from "lucide-react";

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
    "flex items-center gap-3 rounded-lg px-3 py-2 transition-all " +
    (isActive(href)
      ? "bg-primary/10 text-primary font-medium"
      : "text-muted-foreground hover:bg-muted/60 hover:text-primary");

  return (
    <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
      {/* Sidebar */}
      <div className="hidden border-r border-border bg-muted/40 md:block">
        <div className="flex h-full max-h-screen flex-col gap-2">
          <div className="flex h-14 items-center border-b border-border px-4 lg:h-[60px] lg:px-6">
            <Link href="/" className="font-semibold text-foreground">
              NEWKOMERS
            </Link>
          </div>
          <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
            <Link href="/dashboard" className={navLinkClass("/dashboard")}>
              <LayoutDashboard className="w-5 h-5" />
              Dashboard
            </Link>
            <Link href="/structure" className={navLinkClass("/structure")}>
              <Building2 className="w-5 h-5" />
              Structure
            </Link>
            <Link href="/import" className={navLinkClass("/import")}>
              <Upload className="w-5 h-5" />
              Import
            </Link>
            <Link href="/reporting" className={navLinkClass("/reporting")}>
              <FileText className="w-5 h-5" />
              Reporting
            </Link>
            <Link href="/budget" className={navLinkClass("/budget")}>
              <PieChart className="w-5 h-5" />
              Budget
            </Link>
            {(user?.role === "SUPER_ADMIN" || user?.role === "ADMIN") && (
              <Link href="/permissions-assign" className={navLinkClass("/permissions-assign")}>
                <ShieldCheck className="w-5 h-5" />
                Permissions
              </Link>
            )}
          </nav>
          <div className="mt-auto border-t border-border p-4" ref={menuRef}>
            <div className="relative">
              <button
                type="button"
                onClick={() => setUserMenuOpen((o) => !o)}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-muted-foreground transition-all hover:bg-muted/60 hover:text-primary"
              >
                <Avatar>
                  <AvatarFallback>
                    {(user?.email ?? "?").slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="truncate text-sm">{user?.email ?? "Invité"}</span>
              </button>
              {userMenuOpen && (
                <div className="absolute bottom-full left-0 right-0 mb-1 rounded-md border border-border bg-background py-1 shadow-lg">
                  <button
                    type="button"
                    className="w-full px-4 py-2 text-left text-sm text-foreground hover:bg-muted/60"
                    onClick={() => { setUserMenuOpen(false); }}
                  >
                    Mon Profil
                  </button>
                  <button
                    type="button"
                    className="w-full px-4 py-2 text-left text-sm text-foreground hover:bg-muted/60"
                    onClick={() => { setUserMenuOpen(false); logout(); void router.push("/"); }}
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
      <div className="flex flex-col">
        <header className="flex h-14 items-center gap-4 border-b border-border bg-muted/40 px-4 lg:h-[60px] lg:px-6">
          <h1 className="text-lg font-semibold">{title}</h1>
          <div className="ml-auto flex items-center gap-2">
            {companies.length > 0 && (
              <Select
                value={selectedCompanyId}
                onValueChange={onCompanyChange}
                placeholder="Entreprise"
                className="w-[200px]"
              >
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </Select>
            )}
            <Input type="search" placeholder="Rechercher..." className="w-[180px]" />
            <Button variant="ghost" size="icon" aria-label="Notifications">
              <span className="text-lg">🔔</span>
            </Button>
          </div>
        </header>
        <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6 bg-[#f6f7f8]">
          {children}
        </main>
      </div>
    </div>
  );
}

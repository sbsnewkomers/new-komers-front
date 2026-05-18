import Link from "next/link";
import { usePermissionsContext } from "@/permissions/PermissionsProvider";
import * as React from "react";

interface NavigationProps {
  navScrolled: boolean;
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
}

export default function Navigation({ navScrolled, mobileOpen, setMobileOpen }: NavigationProps) {
  const { user } = usePermissionsContext();

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 px-6 transition-all duration-700 ${navScrolled
        ? "bg-black/95 backdrop-blur-2xl border-white/20 shadow-2xl shadow-black/50"
        : "bg-black/40 backdrop-blur-lg border-white/5"
        } border-b`}
      aria-label="Navigation"
    >
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between gap-8">
        <a
          href="#hero"
          className="group relative shrink-0 transition-all duration-700 hover:scale-105"
        >
          <div className="flex flex-col leading-none group cursor-pointer">
            {/* Logo principal */}
            <span className="relative text-[24px] font-extrabold tracking-[0.15em] text-white transition-all duration-500">

              {/* Glow effect */}
              <span className="absolute inset-0 blur-md opacity-0 group-hover:opacity-70 transition duration-500 bg-gradient-to-r from-yellow-400 via-yellow-300 to-yellow-500"></span>

              {/* Text */}
              <span className="relative bg-gradient-to-r from-yellow-500 via-yellow-300 to-yellow-400 bg-clip-text text-transparent drop-shadow-[0_0_8px_rgba(255,215,0,0.6)]">
                NK
              </span>
            </span>

            {/* Sous-titre */}
            <span className="mt-1 text-[10px] font-medium tracking-[0.35em] text-white/50 uppercase transition-all duration-500 group-hover:text-yellow-300 group-hover:tracking-[0.4em]">
              SOFTWARE
            </span>

            {/* Ligne animée */}
            <span className="mt-2 h-[2px] w-0 bg-gradient-to-r from-yellow-500 to-yellow-300 transition-all duration-500 group-hover:w-full"></span>
          </div>

          {/* Animated underline */}
          <div className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-yellow-400 via-yellow-300 to-yellow-400 transition-all duration-700 group-hover:w-full"></div>

          {/* Subtle glow effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/5 to-yellow-300/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700 blur-sm"></div>
        </a>

        <ul className="hidden items-center justify-center gap-10 text-[14px] font-medium text-white/80 md:flex">
          <li>
            <a
              href="#hero"
              className="relative group px-4 py-2 rounded-full bg-gradient-to-r from-yellow-400 to-yellow-300 text-black font-semibold shadow-lg shadow-yellow-400/30 transition-all duration-500 hover:shadow-xl hover:shadow-yellow-400/50 hover:scale-105"
            >
              <span className="relative z-10">Accueil</span>
              <div className="absolute inset-0 rounded-full bg-yellow-400 opacity-0 group-hover:opacity-20 transition-opacity duration-500 blur-xl"></div>
            </a>
          </li>
          <li>
            <a
              href="#features"
              className="relative group px-4 py-2 transition-all duration-500 hover:text-yellow-400 hover:scale-105"
            >
              <span className="relative z-10">Services</span>
              <div className="absolute -bottom-1 left-1/2 w-0 h-0.5 bg-gradient-to-r from-yellow-400 to-yellow-300 transition-all duration-500 group-hover:w-full group-hover:left-0"></div>
            </a>
          </li>
          <li>
            <a
              href="#pricing"
              className="relative group px-4 py-2 transition-all duration-500 hover:text-yellow-400 hover:scale-105"
            >
              <span className="relative z-10">Tarifation</span>
              <div className="absolute -bottom-1 left-1/2 w-0 h-0.5 bg-gradient-to-r from-yellow-400 to-yellow-300 transition-all duration-500 group-hover:w-full group-hover:left-0"></div>
            </a>
          </li>
          <li>
            <a
              href="#about"
              className="relative group px-4 py-2 transition-all duration-500 hover:text-yellow-400 hover:scale-105"
            >
              <span className="relative z-10">About us</span>
              <div className="absolute -bottom-1 left-1/2 w-0 h-0.5 bg-gradient-to-r from-yellow-400 to-yellow-300 transition-all duration-500 group-hover:w-full group-hover:left-0"></div>
            </a>
          </li>
        </ul>

        <div className="flex items-center justify-end gap-4">
          <Link
            href={user ? "/dashboard" : "/login"}
            className="group relative hidden rounded-full bg-gradient-to-r from-yellow-400 via-yellow-300 to-yellow-400 px-6 py-3 text-[14px] font-bold text-black shadow-lg shadow-yellow-400/30 hover:shadow-xl hover:shadow-yellow-400/50 hover:scale-105 transition-all duration-500 sm:inline-flex items-center gap-2"
          >
            <span className="relative z-10">Se connecter</span>
            <svg className="w-4 h-4 relative z-10 transition-transform duration-500 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-yellow-400 to-yellow-300 opacity-0 group-hover:opacity-30 transition-opacity duration-500 blur-xl"></div>
          </Link>
          <div className="flex -space-x-2 shrink-0">
            <button
              type="button"
              onClick={() => setMobileOpen(!mobileOpen)}
              className={`landing-mobile-menu ${mobileOpen ? 'open' : ''} relative group inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-white/20 bg-white/10 text-white md:hidden`}
              aria-label="Menu"
              aria-expanded={mobileOpen}
            >
              <span className="sr-only">Menu</span>
              <div className="flex flex-col gap-1.5">
                <span className="landing-mobile-menu-line h-0.5 w-6 rounded-full bg-white"></span>
                <span className="landing-mobile-menu-line h-0.5 w-6 rounded-full bg-white"></span>
                <span className="landing-mobile-menu-line h-0.5 w-6 rounded-full bg-white"></span>
              </div>
            </button>
          </div>
        </div>
      </div>

      {mobileOpen ? (
        <div className="md:hidden border-t border-white/10 py-5">
          <ul className="flex flex-col gap-4 text-sm text-(--text-muted)">
            <li>
              <a href="#hero" onClick={() => setMobileOpen(false)} className="hover:text-(--accent)">
                Accueil
              </a>
            </li>
            <li>
              <a href="#features" onClick={() => setMobileOpen(false)} className="hover:text-(--accent)">
                Services
              </a>
            </li>
            <li>
              <a href="#pricing" onClick={() => setMobileOpen(false)} className="hover:text-(--accent)">
                Tarifation
              </a>
            </li>
            <li>
              <a href="#about" onClick={() => setMobileOpen(false)} className="hover:text-(--accent)">
                About us
              </a>
            </li>
            <li className="pt-3">
              <Link
                href={user ? "/dashboard" : "/login"}
                onClick={() => setMobileOpen(false)}
                className="inline-flex w-full items-center justify-center rounded-full bg-yellow-400 px-5 py-2.5 text-[13px] font-semibold text-black"
              >
                {user ? "Espace client" : "Se connecter"}
              </Link>
            </li>
          </ul>
        </div>
      ) : null}
    </nav>
  );
}

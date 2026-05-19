import Link from "next/link";
import { usePermissionsContext } from "@/permissions/PermissionsProvider";
import * as React from "react";

interface NavigationProps {
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
}

const navLinks = [
  { href: "#hero",     label: "Accueil",    section: "hero" },
  { href: "#features", label: "Services",   section: "features" },
  { href: "#pricing",  label: "Tarifation", section: "pricing" },
  { href: "#about",    label: "About us",   section: "about" },
];

export default function Navigation({ mobileOpen, setMobileOpen }: NavigationProps) {
  const { user } = usePermissionsContext();
  const [activeSection, setActiveSection] = React.useState("hero");
  const [scrolled, setScrolled] = React.useState(false);

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  React.useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY + 120;
      const positions = navLinks
        .map(({ section }) => {
          const el = document.getElementById(section);
          return { section, top: el ? el.offsetTop : 0 };
        })
        .sort((a, b) => a.top - b.top);

      let current = positions[0].section;
      for (const { section, top } of positions) {
        if (top <= scrollY) current = section;
      }
      setActiveSection(current);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? "bg-black/75 backdrop-blur-xl border-b border-white/[0.07] shadow-xl shadow-black/30"
          : ""
      }`}
      aria-label="Navigation"
    >
      <div className="mx-auto flex h-[70px] max-w-[1190px] items-center justify-between px-6">
        {/* Logo */}
        <a href="#hero" className="group relative shrink-0 transition-all duration-700 hover:scale-105">
          <div className="flex flex-col leading-none cursor-pointer">
            <span className="relative text-[24px] font-extrabold tracking-[0.15em] text-white transition-all duration-500">
              <span className="absolute inset-0 blur-md opacity-0 group-hover:opacity-70 transition duration-500 bg-gradient-to-r from-yellow-400 via-yellow-300 to-yellow-500" />
              <span className="relative bg-gradient-to-r from-yellow-500 via-yellow-300 to-yellow-400 bg-clip-text text-transparent drop-shadow-[0_0_8px_rgba(255,215,0,0.6)]">
                NK
              </span>
            </span>
            <span className="mt-1 text-[10px] font-medium tracking-[0.35em] text-white/50 uppercase transition-all duration-500 group-hover:text-yellow-300 group-hover:tracking-[0.4em]">
              SOFTWARE
            </span>
            <span className="mt-2 h-[2px] w-0 bg-gradient-to-r from-yellow-500 to-yellow-300 transition-all duration-500 group-hover:w-full" />
          </div>
        </a>

        {/* Desktop nav links */}
        <ul className="hidden items-center gap-[65px] md:flex">
          {navLinks.map(({ href, label, section }) => {
            const isActive = activeSection === section;
            return (
              <li key={section} className="flex flex-col items-center gap-[6px]">
                <a
                  href={href}
                  className={`text-[18px] leading-[26px] transition-colors duration-300 ${
                    isActive
                      ? "font-semibold text-white"
                      : "font-normal text-white/75 hover:text-white"
                  }`}
                >
                  {label}
                </a>
                <span
                  className="h-[2px] rounded-[1.5px] bg-[#EAB308] transition-all duration-300"
                  style={{ width: isActive ? "100%" : "0%" }}
                />
              </li>
            );
          })}
        </ul>

        {/* Se connecter */}
        <div className="hidden md:flex">
          <Link
            href={user ? "/dashboard" : "/login"}
            className="flex items-center justify-center rounded-[10px] bg-[#EAB308] font-bold text-black transition-all duration-200 hover:bg-yellow-300 hover:shadow-lg hover:shadow-yellow-400/20 active:scale-95"
            style={{ padding: "12px 28px", fontSize: 16, lineHeight: "19px" }}
          >
            {user ? "Mon espace" : "Se connecter"}
          </Link>
        </div>

        {/* Mobile hamburger */}
        <button
          type="button"
          onClick={() => setMobileOpen(!mobileOpen)}
          className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white md:hidden transition-colors hover:bg-white/10"
          aria-label="Menu"
          aria-expanded={mobileOpen}
        >
          <span className="sr-only">Menu</span>
          <div className="flex flex-col gap-1.5">
            <span className={`h-0.5 w-5 rounded-full bg-white transition-all duration-300 ${mobileOpen ? "rotate-45 translate-y-2" : ""}`} />
            <span className={`h-0.5 w-5 rounded-full bg-white transition-all duration-300 ${mobileOpen ? "opacity-0" : ""}`} />
            <span className={`h-0.5 w-5 rounded-full bg-white transition-all duration-300 ${mobileOpen ? "-rotate-45 -translate-y-2" : ""}`} />
          </div>
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen ? (
        <div className="border-t border-white/10 bg-black/95 backdrop-blur-xl px-6 py-5 md:hidden">
          <ul className="flex flex-col gap-4 text-base text-white">
            {navLinks.map(({ href, label, section }) => (
              <li key={section}>
                <a
                  href={href}
                  onClick={() => setMobileOpen(false)}
                  className={`block py-1 transition-colors ${
                    activeSection === section ? "text-[#EAB308] font-semibold" : "text-white/75 hover:text-white"
                  }`}
                >
                  {label}
                </a>
              </li>
            ))}
            <li className="pt-3">
              <Link
                href={user ? "/dashboard" : "/login"}
                onClick={() => setMobileOpen(false)}
                className="block w-full rounded-[10px] bg-[#EAB308] py-3 text-center text-base font-bold text-black"
              >
                {user ? "Mon espace" : "Se connecter"}
              </Link>
            </li>
          </ul>
        </div>
      ) : null}
    </nav>
  );
}

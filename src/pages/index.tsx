import Head from "next/head";
import { usePermissionsContext } from "@/permissions/PermissionsProvider";
import * as React from "react";
import Navigation from "@/components/landing/Navigation";
import Hero from "@/components/landing/Hero";
import Stats from "@/components/landing/Stats";
import Features from "@/components/landing/Features";
import About from "@/components/landing/About";
import Pricing from "@/components/landing/Pricing";
import FAQ from "@/components/landing/FAQ";
import Footer from "@/components/landing/Footer";

export default function LandingPage() {
  const { } = usePermissionsContext();
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [navScrolled, setNavScrolled] = React.useState(false);
  const [billingYearly, setBillingYearly] = React.useState(false);
  const [openFAQ, setOpenFAQ] = React.useState<number | null>(null);
  const [mousePosition, setMousePosition] = React.useState({ x: 0, y: 0 });
  const [isLoaded, setIsLoaded] = React.useState(false);

  React.useEffect(() => {
    const onScroll = () => setNavScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  React.useEffect(() => {
    if (!mobileOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [mobileOpen]);

  React.useEffect(() => {
    const timer = setTimeout(() => setIsLoaded(true), 100);
    return () => clearTimeout(timer);
  }, []);

  React.useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);


  return (
    <div className={`landing force-dark min-h-screen selection:bg-(--accent)/20 ${isLoaded ? 'loaded' : ''}`}>
      <Head>
        <title>NK Software — La Clarté Financière pour les Holdings &amp; Groupes</title>
        <meta
          name="description"
          content="Centralisez vos flux, automatisez vos consolidations et pilotez votre trésorerie multi-entités depuis une interface conçue pour la haute performance."
        />
      </Head>

      {/* Mouse follower effect */}
      <div
        className="landing-mouse-follower"
        style={{
          transform: `translate(${mousePosition.x - 12}px, ${mousePosition.y - 12}px)`,
        }}
      />

      {/* ── Navigation ── */}
      <Navigation navScrolled={navScrolled} mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />

      <main className="relative overflow-hidden">
        {/* ── Hero ── */}
        <Hero isLoaded={isLoaded} />

        {/* ── Section Statistiques Premium ── */}
        <Stats />

        {/* ── Features Section (Bento Grid Financier) ── */}
        <Features />

        {/* ── Section Vision & Chiffres Clés ── */}
        <About />

        {/* ── Pricing ── */}
        <Pricing billingYearly={billingYearly} setBillingYearly={setBillingYearly} />

        {/* ── FAQ ── */}
        <FAQ openFAQ={openFAQ} setOpenFAQ={setOpenFAQ} />

        {/* ── CTA banner ── */}
        <section className="relative py-24 px-6 text-center">
          <div className="pointer-events-none absolute left-1/2 top-1/2 h-[400px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(ellipse,rgba(212,176,106,0.09)_0%,transparent_70%)] blur-[80px]" />
          <div className="relative z-10 mx-auto max-w-3xl">
            <h2 className="text-[clamp(30px,4vw,52px)] font-black leading-tight text-white">
              Prêt à piloter votre structure?
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-[15px] leading-relaxed text-(--text-muted)">
              Que vous soyez une holding en croissance, une direction financière multi-entités ou un grand groupe —
              notre cockpit s&apos;adapte à votre écosystème.
            </p>
            <div className="mt-10">
              <a
                href="#pricing"
                className="inline-flex items-center gap-2 rounded-full bg-(--accent) px-10 py-4 text-sm font-bold text-black shadow-[0_8px_40px_rgba(212,176,106,0.3)] hover:opacity-90 transition-opacity"
              >
                Voir la démo →
              </a>
            </div>
          </div>
        </section>
      </main>

      {/* ── Footer ── */}
      <Footer />
    </div>
  );
}

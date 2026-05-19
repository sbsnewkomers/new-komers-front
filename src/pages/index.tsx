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
  const [billingYearly, setBillingYearly] = React.useState(false);
  const [openFAQ, setOpenFAQ] = React.useState<number | null>(null);
  const [mousePosition, setMousePosition] = React.useState({ x: 0, y: 0 });
  const [isLoaded, setIsLoaded] = React.useState(false);

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
    <div
      className={`landing force-dark min-h-screen selection:bg-(--accent)/20 ${isLoaded ? 'loaded' : ''}`}
    >
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
      <Navigation mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />

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
        <section className="relative overflow-hidden px-6 py-24">
          <div
            className="relative mx-auto max-w-6xl overflow-hidden rounded-[32px] border border-white/10"
            style={{
              backgroundImage: "url('/landing/background-beforefooter.png')",
              backgroundSize: "cover",
              backgroundPosition: "center",
              backgroundRepeat: "no-repeat",
            }}
          >
            {/* Overlay */}
            <div className="absolute inset-0 bg-black/55 backdrop-blur-[2px]" />

            {/* Glow effects */}
            <div className="absolute -top-20 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-yellow-500/10 blur-3xl" />
            <div className="absolute bottom-0 right-0 h-60 w-60 rounded-full bg-yellow-400/10 blur-3xl" />

            {/* Content */}
            <div className="relative z-10 flex flex-col items-center px-8 py-20 text-center md:px-16">
              <span className="mb-5 rounded-full border border-yellow-400/20 bg-yellow-400/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-yellow-400">
                NEWKOMERS
              </span>

              <h2 className="max-w-3xl text-[clamp(34px,5vw,64px)] font-black leading-[1.05] tracking-tight text-white">
                Prêt à piloter votre
                <span className="bg-gradient-to-r from-yellow-300 to-yellow-500 bg-clip-text text-transparent">
                  {" "}
                  structure
                </span>{" "}
                ?
              </h2>

              <p className="mt-6 max-w-2xl text-[15px] leading-8 text-white/70 md:text-[17px]">
                Que vous soyez une holding en croissance, une direction
                financière multi-entités ou un grand groupe, notre cockpit
                s’adapte parfaitement à votre écosystème et à vos besoins de
                consolidation financière.
              </p>

              <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row">
                <a
                  href="#pricing"
                  className="group inline-flex items-center gap-2 rounded-xl bg-[#EAB308] px-8 py-4 text-sm font-bold text-black shadow-[0_0_30px_rgba(234,179,8,0.25)] transition-all duration-300 hover:scale-[1.03] hover:bg-yellow-400"
                >
                  Voir la démo
                  <span className="transition-transform duration-300 group-hover:translate-x-1">
                    →
                  </span>
                </a>

                <a
                  href="#contact"
                  className="inline-flex items-center rounded-xl border border-white/10 bg-white/5 px-8 py-4 text-sm font-semibold text-white transition-all duration-300 hover:bg-white/10"
                >
                  Contacter l’équipe
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ── Footer ── */}
      <Footer />
    </div>
  );
}

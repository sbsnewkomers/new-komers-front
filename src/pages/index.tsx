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
        <section className="relative px-6 py-24 text-center">
          <div
            className="relative mx-auto max-w-4xl overflow-hidden rounded-2xl px-8 py-20 md:px-16"
            style={{
              backgroundImage: "url('/landing/background-beforefooter.png')",
              backgroundSize: "cover",
              backgroundPosition: "center",
              backgroundRepeat: "no-repeat",
            }}
          >
            {/* Dark overlay for readability */}
            <div className="absolute inset-0 rounded-2xl bg-black/55" />
            {/* Subtle border */}
            <div className="absolute inset-0 rounded-2xl" style={{ boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.12)" }} />

            {/* Eyebrow badge */}
            <div className="relative z-10 mb-6 flex justify-center">
              <span className="inline-flex items-center gap-2 rounded-full border border-[#EAB308]/25 bg-[#EAB308]/10 px-3 py-1.5">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
                <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#EAB308]">Slots disponibles</span>
              </span>
            </div>

            <h2 className="relative z-10 text-[clamp(28px,4vw,52px)] font-black leading-tight text-white">
              Prêt à piloter votre structure ?
            </h2>
            <p className="relative z-10 mx-auto mt-5 max-w-xl text-[16px] leading-relaxed" style={{ color: "rgba(255,255,255,0.6)" }}>
              Que vous soyez une holding en croissance, une direction financière multi-entités ou un grand groupe —
              notre cockpit s&apos;adapte à votre écosystème.
            </p>
            <div className="relative z-10 mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <a
                href="#pricing"
                className="inline-flex items-center gap-2 rounded-[10px] bg-[#EAB308] px-10 py-4 text-[15px] font-bold text-black transition-all duration-200 hover:bg-yellow-300 hover:shadow-lg hover:shadow-yellow-400/20 active:scale-95"
              >
                Voir la démo
                <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </a>
              <a
                href="#faq"
                className="inline-flex items-center gap-2 rounded-[10px] px-8 py-4 text-[15px] font-medium text-white/70 transition-colors duration-200 hover:text-white"
                style={{ border: "1px solid rgba(255,255,255,0.15)" }}
              >
                En savoir plus
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

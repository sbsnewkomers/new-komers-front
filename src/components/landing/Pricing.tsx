import Link from "next/link";
import * as React from "react";

interface PricingProps {
  billingYearly: boolean;
  setBillingYearly: (yearly: boolean) => void;
}

function TickIcon({ gold }: { gold?: boolean }) {
  return (
    <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="10" stroke={gold ? "#EAB308" : "rgba(255,255,255,0.5)"} strokeWidth="1.5" />
      <path d="M8 12l3 3 5-5" stroke={gold ? "#EAB308" : "rgba(255,255,255,0.5)"} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Separator() {
  return (
    <div
      className="w-full"
      style={{ height: 1, background: "linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.12) 50%, rgba(255,255,255,0) 100%)" }}
    />
  );
}

function GlowButton({ href, children }: { href: string; children: React.ReactNode }) {
  const inner = (
    <div className="group relative isolate flex h-11 w-44 items-center rounded-[10px] transition-all duration-300 hover:scale-105 hover:-translate-y-0.5">
      <div
        className="pointer-events-none absolute -inset-2.5 rounded-[10px] opacity-20 blur-[10px] transition-opacity duration-300 group-hover:opacity-40"
        style={{ background: "conic-gradient(from 196deg at 50% 50%, #EAB308 0deg, #EAB308 360deg)", mixBlendMode: "screen" }}
        aria-hidden
      />
      <div
        className="relative z-10 flex w-full items-center gap-3 rounded-[8px] px-5 py-2.5 transition-colors duration-300 group-hover:bg-black/70"
        style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(10px)", boxShadow: "0 4px 12px rgba(0,0,0,0.2)" }}
      >
        <span className="text-[16px] leading-[22px] text-white transition-colors duration-300 group-hover:text-[#EAB308]">{children}</span>
        <svg className="h-4 w-4 shrink-0 text-white transition-all duration-300 group-hover:text-[#EAB308] group-hover:translate-x-0.5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </div>
  );

  if (href.startsWith("/")) return <Link href={href}>{inner}</Link>;
  return <a href={href}>{inner}</a>;
}

export default function Pricing({ billingYearly, setBillingYearly }: PricingProps) {
  const [isLoaded, setIsLoaded] = React.useState(false);
  React.useEffect(() => {
    const t = setTimeout(() => setIsLoaded(true), 100);
    return () => clearTimeout(t);
  }, []);

  const starterFeatures = [
    "Jusqu'à 5 SIREN liées",
    "Consolidation basique quotidienne",
    "Reporting standard (P&L, Bilan)",
    "Limited customization options",
  ];
  const proFeatures = [
    "SIREN illimitées",
    "Consolidation automatique",
    "Module de projection cash (12 mois)",
    "Outils de l'IA",
    "Expert-format Expert-Comptable",
  ];
  const enterpriseFeatures = [
    "Tout le plan Business",
    "Accès API complet (REST)",
    "Key Account Manager dédié",
    "ISO / SAML enforcement",
  ];

  return (
    <section id="pricing" className="relative overflow-hidden">
      {/* Background image */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: "url('/landing/pricing.png')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      />
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/65" />
      {/* Ambient gold glow */}
      <div
        className="pointer-events-none absolute right-[-120px] bottom-[-200px] h-[600px] w-[600px] rounded-full"
        style={{ background: "#EAB308", filter: "blur(200px)", opacity: 0.12 }}
        aria-hidden
      />
      {/* Top gradient — blends from page background */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-48 bg-gradient-to-b from-[#080808] to-transparent" />
      {/* Bottom gradient — blends to page background */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-48 bg-gradient-to-t from-[#080808] to-transparent" />

      {/* Content */}
      <div className="relative z-20 px-6 py-28 md:py-36">
        <div className="mx-auto max-w-[1200px]">

          {/* Heading */}
          <div className={`mb-12 flex flex-col items-center gap-5 text-center transition-all duration-700 ${isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
            {/* Eyebrow badge */}
            <span className="inline-flex items-center gap-2 rounded-full border border-[#EAB308]/25 bg-[#EAB308]/8 px-3 py-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-[#EAB308]" />
              <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#EAB308]">Tarification</span>
            </span>

            <h2 className="font-bold text-white" style={{ fontSize: "clamp(36px, 5vw, 64px)", lineHeight: 1.15, maxWidth: 711 }}>
              Choisissez le Plan qui Vous Convient
            </h2>
            <p className="text-center" style={{ maxWidth: 680, fontSize: 17, lineHeight: "26px", color: "rgba(255,255,255,0.6)" }}>
              Accédez aux fonctionnalités essentielles dès le départ. Passez au plan Pro pour débloquer
              la puissance de l&apos;IA, la consolidation automatique et un niveau de liberté inédit.
            </p>

            {/* Billing toggle */}
            <div
              className="flex items-center p-2 transition-all duration-300"
              style={{ background: "rgba(255,255,255,0.08)", borderRadius: 333, border: "1px solid rgba(255,255,255,0.1)" }}
            >
              <button
                type="button"
                onClick={() => setBillingYearly(true)}
                className="flex items-center justify-center transition-all duration-300 hover:scale-105"
                style={{
                  padding: "6px 28px",
                  borderRadius: 20,
                  fontSize: 15,
                  lineHeight: "24px",
                  background: billingYearly ? "rgba(255,255,255,0.18)" : "transparent",
                  color: billingYearly ? "#ffffff" : "rgba(255,255,255,0.45)",
                }}
              >
                Annuel
              </button>
              <button
                type="button"
                onClick={() => setBillingYearly(false)}
                className="flex items-center justify-center transition-all duration-300 hover:scale-105"
                style={{
                  padding: "6px 28px",
                  borderRadius: 20,
                  fontSize: 15,
                  lineHeight: "24px",
                  background: !billingYearly ? "rgba(255,255,255,0.18)" : "transparent",
                  color: !billingYearly ? "#ffffff" : "rgba(255,255,255,0.45)",
                }}
              >
                Mensuel
              </button>
            </div>
          </div>

          {/* Cards */}
          <div className="pricing-row flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-center lg:gap-0">

            {/* Starter */}
            <div className={`pricing-starter flex flex-col gap-8 p-7 transition-all duration-700 delay-300 ${isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
              <div className="flex flex-col gap-5 px-1">
                <div className="flex flex-col gap-1">
                  <span style={{ fontSize: 16, lineHeight: "22px", color: "rgba(255,255,255,0.8)" }}>Starter</span>
                  <span style={{ fontSize: 13, lineHeight: "20px", color: "rgba(255,255,255,0.4)" }}>
                    Idéal pour les jeunes groupes en croissance.
                  </span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="font-bold text-white" style={{ fontSize: 38, lineHeight: "46px", letterSpacing: "-0.04em" }}>
                    {billingYearly ? "$4 704" : "$490"}
                  </span>
                  <span style={{ fontSize: 14, color: "rgba(255,255,255,0.5)" }}>
                    / {billingYearly ? "an" : "mois"}
                  </span>
                </div>
              </div>
              <Separator />
              <div className="flex flex-col gap-4 px-1">
                <span style={{ fontSize: 13, lineHeight: "20px", color: "rgba(255,255,255,0.45)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Ce qui est inclus</span>
                <ul className="flex flex-col gap-3">
                  {starterFeatures.map((f) => (
                    <li key={f} className="flex items-start gap-3">
                      <TickIcon />
                      <span style={{ fontSize: 15, lineHeight: "22px", color: "rgba(255,255,255,0.7)" }}>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="px-1">
                <GlowButton href="/login">S&apos;abonner</GlowButton>
              </div>
            </div>

            {/* Pro */}
            <div className={`pricing-pro relative flex flex-col gap-8 p-7 transition-all duration-700 delay-400 ${isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
              {/* Pro badge */}
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#EAB308] px-4 py-1 text-[11px] font-bold uppercase tracking-wider text-black">
                  ★ Recommandé
                </span>
              </div>

              <div className="flex flex-col gap-5 px-1">
                <div className="flex flex-col gap-1">
                  <span className="font-bold" style={{ fontSize: 24, lineHeight: "32px", color: "#EAB308" }}>Pro</span>
                  <span style={{ fontSize: 13, lineHeight: "20px", color: "rgba(255,255,255,0.6)" }}>
                    La puissance de la consolidation automatique.
                  </span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="font-bold text-white" style={{ fontSize: 38, lineHeight: "46px", letterSpacing: "-0.04em" }}>
                    {billingYearly ? "$12 384" : "$1 290"}
                  </span>
                  <span style={{ fontSize: 14, color: "rgba(255,255,255,0.55)" }}>
                    / {billingYearly ? "an" : "mois"}
                  </span>
                  {billingYearly && (
                    <span className="inline-flex items-center justify-center rounded-full bg-[#EAB308] px-2 py-0.5 text-[11px] font-bold text-black">
                      -20%
                    </span>
                  )}
                </div>
              </div>
              <Separator />
              <div className="flex flex-col gap-4 px-1">
                <span style={{ fontSize: 13, lineHeight: "20px", color: "rgba(255,255,255,0.45)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Ce qui est inclus</span>
                <ul className="flex flex-col gap-3">
                  {proFeatures.map((f) => (
                    <li key={f} className="flex items-start gap-3">
                      <TickIcon gold />
                      <span style={{ fontSize: 15, lineHeight: "22px", color: "rgba(255,255,255,0.75)" }}>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="px-1">
                <GlowButton href="/login">S&apos;abonner</GlowButton>
              </div>
            </div>

            {/* Enterprise */}
            <div className={`pricing-enterprise flex flex-col gap-8 p-7 transition-all duration-700 delay-500 ${isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
              <div className="flex flex-col gap-5 px-1">
                <div className="flex flex-col gap-1">
                  <span style={{ fontSize: 16, lineHeight: "22px", color: "rgba(255,255,255,0.8)" }}>Enterprise</span>
                  <span style={{ fontSize: 13, lineHeight: "20px", color: "rgba(255,255,255,0.4)" }}>
                    Pour les ETI et directions financières exigeantes.
                  </span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="font-bold text-white" style={{ fontSize: 34, lineHeight: "42px" }}>Sur devis</span>
                </div>
              </div>
              <Separator />
              <div className="flex flex-col gap-4 px-1">
                <span style={{ fontSize: 13, lineHeight: "20px", color: "rgba(255,255,255,0.45)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Ce qui est inclus</span>
                <ul className="flex flex-col gap-3">
                  {enterpriseFeatures.map((f) => (
                    <li key={f} className="flex items-start gap-3">
                      <TickIcon />
                      <span style={{ fontSize: 15, lineHeight: "22px", color: "rgba(255,255,255,0.7)" }}>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="px-1">
                <GlowButton href="#faq">Nous contacter</GlowButton>
              </div>
            </div>

          </div>
        </div>
      </div>

      <style jsx>{`
        .pricing-starter,
        .pricing-pro,
        .pricing-enterprise {
          background: rgba(18, 14, 10, 0.85);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border-radius: 20px;
          transition: all 0.4s cubic-bezier(0.22, 1, 0.36, 1);
        }
        .pricing-starter,
        .pricing-enterprise {
          border: 1px solid rgba(255, 255, 255, 0.08);
          min-height: 420px;
        }
        .pricing-starter:hover,
        .pricing-enterprise:hover {
          border-color: rgba(234, 179, 8, 0.2);
          box-shadow: 0 0 40px rgba(234, 179, 8, 0.08), 0 20px 40px rgba(0,0,0,0.3);
          transform: translateY(-4px);
        }
        .pricing-pro {
          border: 1px solid rgba(234, 179, 8, 0.3);
          min-height: 480px;
          box-shadow: 0 0 60px rgba(234, 179, 8, 0.1);
          z-index: 10;
        }
        .pricing-pro:hover {
          box-shadow: 0 0 80px rgba(234, 179, 8, 0.18), 0 20px 48px rgba(0,0,0,0.4);
          transform: translateY(-6px);
        }

        @media (min-width: 1024px) {
          .pricing-starter {
            width: 380px;
            min-height: 520px;
            flex-shrink: 0;
            border-radius: 20px 0 0 20px;
            border-right: none;
          }
          .pricing-pro {
            width: 400px;
            min-height: 600px;
            flex-shrink: 0;
            border-radius: 20px;
          }
          .pricing-enterprise {
            width: 380px;
            min-height: 520px;
            flex-shrink: 0;
            border-radius: 0 20px 20px 0;
            border-left: none;
          }
        }
      `}</style>
    </section>
  );
}

import Link from "next/link";
import * as React from "react";

interface PricingProps {
  billingYearly: boolean;
  setBillingYearly: (yearly: boolean) => void;
}

function TickIcon({ gold }: { gold?: boolean }) {
  return (
    <svg
      className="h-6 w-6 shrink-0"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
    >
      <circle
        cx="12"
        cy="12"
        r="10"
        stroke={gold ? "#EAB308" : "rgba(255,255,255,0.8)"}
        strokeWidth="1.5"
      />
      <path
        d="M8 12l3 3 5-5"
        stroke={gold ? "#EAB308" : "rgba(255,255,255,0.8)"}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function Separator() {
  return (
    <div
      className="w-full"
      style={{
        height: 1,
        background: "linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.2) 50%, rgba(255,255,255,0) 100%)",
      }}
    />
  );
}

function GlowButton({ href, children }: { href: string; children: React.ReactNode }) {
  const inner = (
    <div className="relative isolate flex h-11 w-40 items-center gap-3 rounded-[10px]" style={{ borderRadius: 10 }}>
      {/* Glow blur behind */}
      <div
        className="pointer-events-none absolute -inset-2.5 rounded-[10px]"
        style={{
          background: "conic-gradient(from 196deg at 50% 50%, #EAB308 0deg, #EAB308 95deg, #EAB308 186deg, #EAB308 275deg, #EAB308 360deg)",
          mixBlendMode: "screen",
          opacity: 0.2,
          filter: "blur(10px)",
        }}
        aria-hidden
      />
      {/* Button surface */}
      <div
        className="relative z-10 flex w-full items-center gap-3 rounded-[8px] px-5 py-2.5"
        style={{
          background: "rgba(0,0,0,0.5)",
          backdropFilter: "blur(10px)",
          boxShadow: "0 1px 0 rgba(0,0,0,0.05), 0 4px 4px rgba(0,0,0,0.05), 0 10px 10px rgba(0,0,0,0.1)",
        }}
      >
        <span className="text-[18px] leading-[22px] text-white">{children}</span>
        <svg className="h-5 w-5 shrink-0 text-white" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </div>
  );

  if (href.startsWith("/")) {
    return <Link href={href}>{inner}</Link>;
  }
  return <a href={href}>{inner}</a>;
}

export default function Pricing({ billingYearly, setBillingYearly }: PricingProps) {
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
    <section id="pricing" className="relative overflow-hidden py-24 px-6">
      {/* Large gold glow at bottom-right — matches Figma Ellipse 854 */}
      <div
        className="pointer-events-none absolute right-[-120px] bottom-[-200px] h-[600px] w-[600px] rounded-full"
        style={{
          background: "#EAB308",
          filter: "blur(200px)",
          opacity: 0.18,
        }}
        aria-hidden
      />

      <div className="mx-auto max-w-[1200px] relative z-10">
        {/* Heading */}
        <div className="mb-[45px] flex flex-col items-center gap-5 text-center">
          <h2
            className="font-bold text-white"
            style={{ fontSize: 70, lineHeight: "84px", maxWidth: 711 }}
          >
            Choisissez le Plan qui Vous Convient
          </h2>
          <p
            className="text-center"
            style={{ maxWidth: 780, fontSize: 20, lineHeight: "24px", color: "#D9D9D9" }}
          >
            Vous donner accès aux fonctionnalités essentielles et à plus de 1 000 outils créatifs.
            Passez au plan Pro pour débloquer des capacités d&apos;IA puissantes, la synchronisation dans le cloud
            et un tout nouveau niveau de liberté créative.
          </p>

          {/* Toggle — Yearly first (active by default), then Monthly */}
          <div
            className="flex items-center p-[10px]"
            style={{ background: "rgba(255,255,255,0.1)", borderRadius: 333 }}
          >
            <button
              type="button"
              onClick={() => setBillingYearly(true)}
              className="flex items-center justify-center transition-colors"
              style={{
                padding: "5px 32px",
                borderRadius: 20,
                fontSize: 16,
                lineHeight: "24px",
                background: billingYearly ? "rgba(255,255,255,0.2)" : "transparent",
                color: billingYearly ? "#ffffff" : "#919191",
              }}
            >
              Yearly
            </button>
            <button
              type="button"
              onClick={() => setBillingYearly(false)}
              className="flex items-center justify-center transition-colors"
              style={{
                padding: "5px 32px",
                borderRadius: 20,
                fontSize: 16,
                lineHeight: "24px",
                background: !billingYearly ? "rgba(255,255,255,0.2)" : "transparent",
                color: !billingYearly ? "#ffffff" : "#919191",
              }}
            >
              Monthly
            </button>
          </div>
        </div>

        {/* Cards — stacked on mobile, connected row on desktop */}
        <div className="pricing-row flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-center lg:gap-0">

          {/* Starter */}
          <div className="pricing-starter flex flex-col gap-[35px] p-6">
            <div className="flex flex-col gap-6 px-2">
              <div className="flex flex-col gap-[6px]">
                <span style={{ fontSize: 18, lineHeight: "22px", color: "#fff" }}>Starter</span>
                <span style={{ fontSize: 14, lineHeight: "20px", color: "#9CA3AF" }}>
                  Idéal pour les jeunes groupes en croissance.
                </span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="font-bold text-white" style={{ fontSize: 40, lineHeight: "48px", letterSpacing: "-0.04em" }}>
                  {billingYearly ? "$4 704" : "$490"}
                </span>
                <span style={{ fontSize: 16, color: "rgba(255,255,255,0.75)" }}>
                  / {billingYearly ? "an" : "month"}
                </span>
              </div>
            </div>
            <Separator />
            <div className="flex flex-col gap-[15px] px-2">
              <span style={{ fontSize: 16, lineHeight: "24px", color: "rgba(255,255,255,0.75)" }}>Ce qui est inclus</span>
              <ul className="flex flex-col gap-[14px]">
                {starterFeatures.map((f) => (
                  <li key={f} className="flex items-start gap-3">
                    <TickIcon />
                    <span style={{ fontSize: 16, lineHeight: "24px", color: "#C6C6C6" }}>{f}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="px-2">
              <GlowButton href="/login">Subscribe</GlowButton>
            </div>
          </div>

          {/* Pro */}
          <div className="pricing-pro relative flex flex-col gap-[35px] p-6">
            <div className="flex flex-col gap-6 px-2">
              <div className="flex flex-col gap-[6px]">
                <span className="font-bold" style={{ fontSize: 30, lineHeight: "36px", color: "#EAB308" }}>Pro</span>
                <span style={{ fontSize: 16, lineHeight: "24px", color: "rgba(255,255,255,0.75)" }}>
                  La puissance de la consolidation automatique.
                </span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="font-bold text-white" style={{ fontSize: 40, lineHeight: "48px", letterSpacing: "-0.04em" }}>
                  {billingYearly ? "$12 384" : "$1290"}
                </span>
                <span style={{ fontSize: 16, color: "rgba(255,255,255,0.75)" }}>
                  / {billingYearly ? "an" : "month"}
                </span>
                {billingYearly && (
                  <span className="flex items-center justify-center font-bold text-black"
                    style={{ padding: "5px 8px", background: "#EAB308", borderRadius: 24, fontSize: 12, lineHeight: "14px" }}>
                    -20%
                  </span>
                )}
              </div>
            </div>
            <Separator />
            <div className="flex flex-col gap-[15px] px-2">
              <span style={{ fontSize: 16, lineHeight: "24px", color: "rgba(255,255,255,0.75)" }}>Ce qui est inclus</span>
              <ul className="flex flex-col gap-[14px]">
                {proFeatures.map((f) => (
                  <li key={f} className="flex items-start gap-3">
                    <TickIcon gold />
                    <span style={{ fontSize: 16, lineHeight: "24px", color: "#C6C6C6" }}>{f}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="px-2">
              <GlowButton href="/login">Subscribe</GlowButton>
            </div>
          </div>

          {/* Enterprise */}
          <div className="pricing-enterprise flex flex-col gap-[35px] p-6">
            <div className="flex flex-col gap-6 px-2">
              <div className="flex flex-col gap-[6px]">
                <span style={{ fontSize: 18, lineHeight: "22px", color: "#fff" }}>Enterprise</span>
                <span style={{ fontSize: 14, lineHeight: "20px", color: "#9CA3AF" }}>
                  Pour les ETI et directions financières exigeantes.
                </span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="font-bold text-white" style={{ fontSize: 36, lineHeight: "44px" }}>Sur devis</span>
              </div>
            </div>
            <Separator />
            <div className="flex flex-col gap-[15px] px-2">
              <span style={{ fontSize: 16, lineHeight: "24px", color: "rgba(255,255,255,0.75)" }}>Ce qui est inclus</span>
              <ul className="flex flex-col gap-[14px]">
                {enterpriseFeatures.map((f) => (
                  <li key={f} className="flex items-start gap-3">
                    <TickIcon />
                    <span style={{ fontSize: 16, lineHeight: "24px", color: "#C6C6C6" }}>{f}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="px-2">
              <GlowButton href="#faq">Subscribe</GlowButton>
            </div>
          </div>

        </div>
      </div>

      <style jsx>{`
        /* Mobile: all cards fully rounded and stacked */
        .pricing-starter,
        .pricing-pro,
        .pricing-enterprise {
          background: #1B1B1C;
          border-radius: 20px;
        }
        .pricing-starter,
        .pricing-enterprise {
          border: 1px solid rgba(255, 255, 255, 0.1);
          min-height: 400px;
        }
        .pricing-pro {
          min-height: 500px;
          box-shadow: 0 0 60px rgba(234, 179, 8, 0.12);
          z-index: 10;
        }

        /* Desktop: connected card layout, Pro stands taller */
        @media (min-width: 1024px) {
          .pricing-starter {
            width: 400px;
            min-height: 529px;
            flex-shrink: 0;
            border-radius: 20px 0 0 20px;
          }
          .pricing-pro {
            width: 400px;
            min-height: 609px;
            flex-shrink: 0;
            border-radius: 20px;
          }
          .pricing-enterprise {
            width: 400px;
            min-height: 529px;
            flex-shrink: 0;
            border-radius: 0 20px 20px 0;
          }
        }
      `}</style>
    </section>
  );
}

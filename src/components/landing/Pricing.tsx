import Link from "next/link";
import * as React from "react";

interface PricingProps {
  billingYearly: boolean;
  setBillingYearly: (yearly: boolean) => void;
}

export default function Pricing({ billingYearly, setBillingYearly }: PricingProps) {
  const plans = [
    {
      name: "Starter",
      description: "Pour les groupes en croissance",
      price: billingYearly ? "$4 704" : "$490",
      period: billingYearly ? "an" : "month",
      features: [
        "Jusqu'à 5 SIREN liées",
        "Consolidation basique quotidienne",
        "Reporting standard (P&L, Bilan)",
        "Options de personnalisation limitées",
      ],
      highlighted: false,
      cta: "Commencer",
      href: "/login"
    },
    {
      name: "Pro",
      description: "Puissance maximale",
      price: billingYearly ? "$12 384" : "$1290",
      period: billingYearly ? "an" : "month",
      features: [
        "SIREN illimitées",
        "Consolidation automatique",
        "Module de projection cash (12 mois)",
        "Outils d'IA avancés",
        "Format Expert-Comptable",
      ],
      highlighted: true,
      badge: "POPULAIRE",
      cta: "Choisir Pro",
      href: "/login"
    },
    {
      name: "Enterprise",
      description: "Pour les grandes organisations",
      price: "Sur devis",
      period: "",
      features: [
        "Tout le plan Pro inclus",
        "Accès API complet (REST)",
        "Key Account Manager dédié",
        "Sécurité ISO / SAML",
        "SLA personnalisé",
      ],
      highlighted: false,
      cta: "Nous contacter",
      href: "#contact"
    }
  ];

  return (
    <section id="pricing" className="relative py-24 px-6 overflow-hidden">
      {/* Background image */}
      <div
        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: 'url(/landing/pricing.png)' }}
      />
      <div className="absolute inset-0 bg-black/60 z-10"></div>
      <div className="mx-auto max-w-6xl relative z-20">
        <div className="mb-14 text-center">
          <h2 className="text-[clamp(30px,4vw,52px)] font-black leading-tight text-white">
            Choisissez le Plan qui
            <br />
            Vous Convient
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-[15px] leading-relaxed text-(--text-muted)">
            Vous donnez accès aux fonctionnalités essentielles et à plus de 1000 outils créatifs. Passez du Pro
            pour débloquer des capacités d&apos;IA puissantes, la synchronisation dans le cloud et un tout
            nouveau niveau de liberté créative.
          </p>

          {/* Billing toggle */}
          <div className="mt-8 inline-flex items-center rounded-full border border-white/10 bg-white/5 p-1">
            <button
              type="button"
              onClick={() => setBillingYearly(false)}
              className={`rounded-full px-5 py-2 text-[13px] font-semibold transition-colors ${!billingYearly ? "bg-(--accent) text-black" : "text-(--text-muted) hover:text-white"
                }`}
            >
              Monthly
            </button>
            <button
              type="button"
              onClick={() => setBillingYearly(true)}
              className={`rounded-full px-5 py-2 text-[13px] font-semibold transition-colors ${billingYearly ? "bg-(--accent) text-black" : "text-(--text-muted) hover:text-white"
                }`}
            >
              Yearly
            </button>
          </div>
        </div>

        <div className="grid items-start gap-6 lg:grid-cols-3">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`landing-pricing-card ${plan.highlighted ? 'highlighted' : ''} group relative flex flex-col rounded-3xl border ${plan.highlighted
                ? "border-2 border-yellow-400/30 bg-gradient-to-br from-black/90 via-black/80 to-black/90"
                : "border-white/10 bg-black/80"
                } backdrop-blur-sm p-8`}
            >
              {/* Badge POPULAIRE */}
              {plan.badge && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <div className="landing-pricing-badge relative">
                    <span className="relative rounded-full bg-yellow-400 px-4 py-1.5 text-[11px] font-black uppercase tracking-wider text-black">
                      {plan.badge}
                    </span>
                  </div>
                </div>
              )}

              <div className="mb-8">
                <div className="flex items-center gap-3 mb-4">
                  <div>
                    <h4 className="text-[22px] font-bold text-white">{plan.name}</h4>
                    <p className="text-[13px] text-white/50">{plan.description}</p>
                  </div>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-[56px] font-black text-white leading-none">
                    {plan.price}
                  </span>
                  {plan.period && (
                    <span className="text-[16px] text-white/50">/{plan.period}</span>
                  )}
                </div>
              </div>

              <ul className="mb-8 flex-1 space-y-4 text-[14px]">
                {plan.features.map((f) => (
                  <li key={f} className={`flex items-center gap-3 ${plan.highlighted ? "text-white/80" : "text-white/70"
                    }`}>
                    {plan.highlighted ? (
                      <div className="w-5 h-5 rounded-full bg-yellow-400/30 border border-yellow-400/50 flex items-center justify-center flex-shrink-0">
                        <svg className="w-2.5 h-2.5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    ) : (
                      <div className="w-5 h-5 rounded-full bg-yellow-400/20 border border-yellow-400/40 flex items-center justify-center flex-shrink-0">
                        <div className="w-1.5 h-1.5 rounded-full bg-yellow-400"></div>
                      </div>
                    )}
                    {f}
                  </li>
                ))}
              </ul>

              {plan.href.startsWith("/") ? (
                <Link
                  href={plan.href}
                  className={`group/btn relative overflow-hidden rounded-2xl ${plan.highlighted
                    ? "bg-gradient-to-r from-yellow-400 to-yellow-300 text-black font-bold hover:shadow-xl hover:shadow-yellow-400/30 hover:scale-105"
                    : "border border-white/20 bg-white/5 text-white font-semibold hover:bg-white/10 hover:border-white/30 hover:shadow-lg hover:shadow-white/10"
                    } py-4 text-center text-[14px] transition-all duration-300`}
                >
                  <span className="relative z-10">{plan.cta}</span>
                  <div className={`absolute inset-0 ${plan.highlighted
                    ? "bg-gradient-to-r from-yellow-300 to-yellow-400 opacity-0 group-hover/btn:opacity-100"
                    : "bg-gradient-to-r from-white/10 to-transparent opacity-0 group-hover/btn:opacity-100"
                    } transition-opacity duration-300`}></div>
                </Link>
              ) : (
                <a
                  href={plan.href}
                  className={`group/btn relative overflow-hidden rounded-2xl ${plan.highlighted
                    ? "bg-gradient-to-r from-yellow-400 to-yellow-300 text-black font-bold hover:shadow-xl hover:shadow-yellow-400/30 hover:scale-105"
                    : "border border-white/20 bg-white/5 text-white font-semibold hover:bg-white/10 hover:border-white/30 hover:shadow-lg hover:shadow-white/10"
                    } py-4 text-center text-[14px] transition-all duration-300`}
                >
                  <span className="relative z-10">{plan.cta}</span>
                  <div className={`absolute inset-0 ${plan.highlighted
                    ? "bg-gradient-to-r from-yellow-300 to-yellow-400 opacity-0 group-hover/btn:opacity-100"
                    : "bg-gradient-to-r from-white/10 to-transparent opacity-0 group-hover/btn:opacity-100"
                    } transition-opacity duration-300`}></div>
                </a>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

interface FAQProps {
  openFAQ: number | null;
  setOpenFAQ: (index: number | null) => void;
}

export default function FAQ({ openFAQ, setOpenFAQ }: FAQProps) {
  const faqItems = [
    {
      question: "À qui sert cette plateforme ?",
      answer:
        "Une plateforme financière qui vous aide à consolider, projeter et piloter votre structure en temps réel — que vous soyez une jeune holding en croissance, des directions financières multi-entités ou des grands groupes exigeants.",
    },
    {
      question: "Comment NK Software se connecte-t-il à nos outils comptables et ERP existants ?",
      answer:
        "NK Software s'intègre nativement avec les principaux logiciels comptables (Sage, Cegid, QuickBooks) et ERP du marché via notre API REST ou nos connecteurs natifs.",
    },
    {
      question: "Y a-t-il une limite au nombre de filiales ou de codes SIREN que l'on peut intégrer ?",
      answer:
        "Non, avec le plan Pro et Enterprise, vous pouvez intégrer un nombre illimité de filiales et de codes SIREN. Le plan Starter est limité à 5 SIRENs.",
    },
    {
      question: "Comment la plateforme gère-t-elle la sécurité et la confidentialité de nos données financières ?",
      answer:
        "Toutes les données sont chiffrées en AES-256, hébergées en France et conformes au RGPD. Nous offrons une authentification SAML/SSO pour les plans Enterprise.",
    },
    {
      question: "Est-il possible de simuler différents scénarios de trésorerie (What-If) pour le groupe ?",
      answer:
        "Oui, notre module de projection Cash Burn intègre des scénarios What-If multi-entités sur 12 mois, avec export PDF et Excel pour vos présentations.",
    },
  ];

  return (
    <section id="faq" className="relative overflow-hidden">
      {/* Background image — no fixed attachment for smooth scroll */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: "url('/landing/FAQ.png')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      />
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/65" />
      {/* Top gradient — blends from page background */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-48 bg-gradient-to-b from-[#080808] to-transparent" />
      {/* Bottom gradient — blends to page background */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-48 bg-gradient-to-t from-[#080808] to-transparent" />

      {/* Content */}
      <div className="relative z-20 px-6 py-28 md:py-36">
        <div className="mx-auto max-w-4xl">

          {/* Header */}
          <div className="mb-16 text-center">
            {/* Eyebrow badge */}
            <div className="mb-6 flex justify-center">
              <span className="inline-flex items-center gap-2 rounded-full border border-[#EAB308]/25 bg-[#EAB308]/8 px-3 py-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-[#EAB308]" />
                <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#EAB308]">FAQ</span>
              </span>
            </div>

            <h2 className="text-[clamp(30px,4vw,52px)] font-black leading-tight text-white">
              Questions souvent
              <br />
              <span style={{ color: "#EAB308" }}>posées</span>
            </h2>
            <p
              className="mx-auto mt-5 max-w-2xl text-[16px] leading-relaxed"
              style={{ color: "rgba(255,255,255,0.55)" }}
            >
              Une question ? Nous avons les réponses. Découvrez tout ce que vous devez savoir sur notre plateforme
              de pilotage, nos abonnements et nos fonctionnalités de consolidation financière.
            </p>
          </div>

          {/* Accordion */}
          <div className="space-y-3">
            {faqItems.map((item, idx) => {
              const isOpen = openFAQ === idx;
              return (
                <div
                  key={idx}
                  className="overflow-hidden rounded-2xl border transition-all duration-300"
                  style={{
                    background: isOpen
                      ? "linear-gradient(135deg, rgba(234,179,8,0.07) 0%, rgba(234,179,8,0.03) 100%)"
                      : "rgba(10,8,6,0.6)",
                    backdropFilter: "blur(12px)",
                    WebkitBackdropFilter: "blur(12px)",
                    borderColor: isOpen ? "rgba(234,179,8,0.3)" : "rgba(255,255,255,0.1)",
                    boxShadow: isOpen
                      ? "0 20px 48px rgba(0,0,0,0.4), 0 0 0 1px rgba(234,179,8,0.1)"
                      : "0 4px 16px rgba(0,0,0,0.2)",
                    transform: isOpen ? "scale(1.01)" : "scale(1)",
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setOpenFAQ(isOpen ? null : idx)}
                    className="flex w-full items-center justify-between px-7 py-5 text-left transition-colors duration-200 hover:text-[#EAB308]"
                    aria-expanded={isOpen}
                  >
                    <span className="flex-1 pr-4 text-[15px] font-semibold leading-snug text-white transition-colors duration-200">
                      {item.question}
                    </span>
                    <div
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border transition-all duration-300"
                      style={{
                        background: isOpen
                          ? "#EAB308"
                          : "rgba(234,179,8,0.08)",
                        borderColor: isOpen ? "#EAB308" : "rgba(255,255,255,0.12)",
                      }}
                    >
                      <svg
                        className={`h-4 w-4 transition-transform duration-300 ${isOpen ? "rotate-180 text-black" : "text-white/70"}`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                        aria-hidden
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </button>

                  {isOpen ? (
                    <div
                      className="px-7 pb-6 pt-4 text-[14px] leading-relaxed"
                      style={{
                        color: "rgba(255,255,255,0.65)",
                        borderTop: "1px solid rgba(255,255,255,0.08)",
                      }}
                    >
                      {item.answer}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>

        </div>
      </div>
    </section>
  );
}

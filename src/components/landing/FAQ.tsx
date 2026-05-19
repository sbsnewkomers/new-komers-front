import * as React from "react";

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
    <section
      id="faq"
      className="relative py-24 px-6 min-h-screen"
      style={{
        backgroundImage: 'url(/landing/FAQ.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'fixed'
      }}
    >
      {/* Overlay for better text readability */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/60" />

      <div className="relative z-10 mx-auto max-w-4xl">
        <div className="mb-16 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 mb-6 rounded-full"
            style={{
              background: "linear-gradient(90deg, rgba(234,179,8,0.13) 0%, rgba(234,179,8,0.04) 100%)",
              border: "0.94px solid rgba(255,255,255,0.15)",
            }}>
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-[clamp(32px,4vw,56px)] font-black leading-tight text-white mb-6">
            Questions souvent
            <br />
            <span style={{ color: "#EAB308" }}>
              posées
            </span>
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-[16px] leading-relaxed"
            style={{ color: "rgba(255,255,255,0.7)" }}>
            Une question ? Nous avons les réponses. Découvrez tout ce que vous devez savoir sur notre plateforme
            de pilotage, nos abonnements et nos fonctionnalités de consolidation financière.
          </p>
        </div>

        <div className="space-y-4">
          {faqItems.map((item, idx) => (
            <div
              key={idx}
              className={`landing-faq-item ${openFAQ === idx ? 'open' : ''} overflow-hidden rounded-2xl border transition-all duration-300 hover:shadow-xl`}
              style={{
                background: "linear-gradient(90deg, rgba(234,179,8,0.05) 0%, rgba(234,179,8,0.02) 100%)",
                borderColor: "rgba(255,255,255,0.15)",
                transform: openFAQ === idx ? 'scale(1.02)' : 'scale(1)',
                boxShadow: openFAQ === idx ? '0 20px 40px rgba(0,0,0,0.3), 0 0 60px rgba(234,179,8,0.1)' : '0 4px 20px rgba(0,0,0,0.1)'
              }}
            >
              <button
                type="button"
                onClick={() => setOpenFAQ(openFAQ === idx ? null : idx)}
                className="flex w-full items-center justify-between px-8 py-6 text-left text-[16px] font-semibold text-white transition-colors duration-200 group hover:text-[#EAB308]"
                aria-expanded={openFAQ === idx}
              >
                <span className="flex-1 pr-4">{item.question}</span>
                <div className={`flex items-center justify-center w-10 h-10 rounded-full border transition-all duration-300`}
                  style={{
                    background: openFAQ === idx ? "#EAB308" : "linear-gradient(90deg, rgba(234,179,8,0.13) 0%, rgba(234,179,8,0.04) 100%)",
                    borderColor: "rgba(255,255,255,0.15)"
                  }}>
                  <svg
                    className={`landing-faq-icon h-5 w-5 text-white transition-transform duration-300 ${openFAQ === idx ? "rotate-180" : ""}`}
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
              {openFAQ === idx ? (
                <div className="px-8 pb-6 text-[15px] leading-relaxed pt-4 animate-fadeIn"
                  style={{
                    color: "rgba(255,255,255,0.7)",
                    borderTop: "1px solid rgba(255,255,255,0.15)"
                  }}>
                  {item.answer}
                </div>
              ) : null}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

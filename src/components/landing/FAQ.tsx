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
    <section id="faq" className="py-24 px-6">
      <div className="mx-auto max-w-3xl">
        <div className="mb-14 text-center">
          <h2 className="text-[clamp(30px,4vw,52px)] font-black leading-tight text-white">
            Questions souvent
            <br />
            posées
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-[15px] leading-relaxed text-(--text-muted)">
            Une question ? Nous avons les réponses. Découvrez tout ce que vous devez savoir sur notre plateforme
            de pilotage, nos abonnements et nos fonctionnalités de consolidation financière.
          </p>
        </div>

        <div className="space-y-3">
          {faqItems.map((item, idx) => (
            <div
              key={idx}
              className={`landing-faq-item ${openFAQ === idx ? 'open' : ''} overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02]`}
            >
              <button
                type="button"
                onClick={() => setOpenFAQ(openFAQ === idx ? null : idx)}
                className="flex w-full items-center justify-between px-6 py-5 text-left text-[14px] font-semibold text-white hover:text-(--accent)"
                aria-expanded={openFAQ === idx}
              >
                <span>{item.question}</span>
                <svg
                  className={`landing-faq-icon h-5 w-5 shrink-0 text-(--text-muted) ${openFAQ === idx ? "rotate-180" : ""}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                  aria-hidden
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {openFAQ === idx ? (
                <div className="px-6 pb-5 text-[13px] leading-relaxed text-(--text-muted)">
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

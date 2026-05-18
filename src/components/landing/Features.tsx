export default function Features() {
  const features = [
    {
      title: "Projection & Cash Burn",
      desc: "Anticipez vos besoins de financement à 12, 24 ou 36 mois. Nos modèles prédictifs intègrent vos saisonnalités et vos charges structurelles.",
      gridClass: "md:col-span-5",
    },
    {
      title: "Consolidation de Données Multi-SIREN",
      desc: "Gérez un nombre illimité d'entités juridiques sans effort. Notre moteur d'agrégation synchronise vos balances générales en temps réel via API.",
      gridClass: "md:col-span-7",
    },
    {
      title: "Analyse et Métriques Extracomptables",
      desc: "Dépassez le cadre de la comptabilité traditionnelle en enrichissant vos analyses financières avec des données opérationnelles pour offrir une vision stratégique globale de votre groupe.",
      gridClass: "md:col-span-7",
    },
    {
      title: "Journal d'Audit",
      desc: "Garantissez une transparence totale et une fiabilité chirurgicale de vos chiffres auprès de vos actionnaires.",
      gridClass: "md:col-span-5",
    },
  ];

  return (
    <section id="features" className="relative overflow-hidden px-6 py-24 text-white">
      {/* Subtle background glows */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/4 top-1/4 h-96 w-96 rounded-full bg-yellow-400/[0.03] blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 h-96 w-96 rounded-full bg-yellow-400/[0.02] blur-[120px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-16 grid items-center gap-12 lg:grid-cols-2">
          <div>
            <h2 className="text-[clamp(32px,4.5vw,56px)] font-extrabold leading-[1.1] tracking-tight text-white">
              Précision Chirurgicale <br />
              pour <span className="text-[#EAB308]">Votre Groupe</span>.
            </h2>
            <p className="mt-4 max-w-md text-[15px] leading-relaxed text-white/60">
              Plus qu&apos;un simple dashboard, <span className="font-semibold text-white">NK Software</span> est le cockpit de votre direction financière.
            </p>
          </div>

          {/* Wireframe icon */}
          <div className="hidden items-center justify-end pr-8 lg:flex">
            <div className="relative h-40 w-40 animate-spin-slow opacity-70">
              <svg viewBox="0 0 100 100" className="h-full w-full fill-none stroke-white/40" strokeWidth="1">
                <polygon points="50,5 93,30 93,80 50,95 7,80 7,30" />
                <polygon points="50,5 50,95" />
                <polygon points="7,30 93,80" />
                <polygon points="93,30 7,80" />
                <polygon points="50,5 93,80" />
                <polygon points="50,5 7,80" />
                <polygon points="50,95 93,30" />
                <polygon points="50,95 7,30" />
                <polygon points="7,30 93,30" />
                <polygon points="7,80 93,80" />
              </svg>
            </div>
          </div>
        </div>

        {/* 2×2 asymmetric bento grid */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-12">
          {features.map((feature, index) => (
            <div
              key={index}
              className={`landing-feature-card group relative flex min-h-[240px] flex-col justify-between rounded-2xl border border-yellow-400/[0.18] p-8 ${feature.gridClass}`}
              style={{ background: "linear-gradient(135deg, #1d1308 0%, #110e08 55%, #0c0a07 100%)" }}
            >
              {/* Top: description + arrow button */}
              <div className="flex items-start justify-between gap-6">
                <p className="max-w-[82%] text-[14px] leading-relaxed text-white/60 transition-colors duration-300 group-hover:text-white/80">
                  {feature.desc}
                </p>
                <div className="landing-feature-arrow flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#EAB308] text-black shadow-lg shadow-yellow-400/10">
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 19.5l15-15m0 0H8.25m11.25 0v11.25" />
                  </svg>
                </div>
              </div>

              {/* Bottom: title */}
              <div className="mt-8">
                <h3 className="text-[22px] font-medium tracking-tight text-white/90 md:text-[24px]">
                  {feature.title}
                </h3>
              </div>
            </div>
          ))}
        </div>
      </div>

      <style jsx>{`
        .landing-feature-card {
          transition: all 0.5s;
        }
        .landing-feature-card:hover {
          transform: scale(1.01);
          border-color: rgba(234, 179, 8, 0.45);
        }
        .landing-feature-arrow {
          transition: transform 0.3s;
        }
        .landing-feature-card:hover .landing-feature-arrow {
          transform: translateX(0.5px) translateY(-0.5px);
        }
      `}</style>
    </section>
  );
}

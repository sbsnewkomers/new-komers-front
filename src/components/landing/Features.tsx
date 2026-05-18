export default function Features() {
  const features = [
    {
      title: "Projection & Cash Burn",
      desc: "Anticipez vos besoins de financement à 12, 24 ou 36 mois. Nos modèles prédictifs intègrent vos saisonnalités et vos charges structurelles.",
      gridClass: "md:col-span-5",
      bgEffect: "bg-gradient-to-br from-yellow-500/[0.04] to-transparent group-hover:from-yellow-500/[0.08]"
    },
    {
      title: "Consolidation de Données Multi-SIREN",
      desc: "Gérez un nombre illimité d'entités juridiques sans effort. Notre moteur d'agrégation synchronise vos balances générales en temps réel via API.",
      gridClass: "md:col-span-7",
      bgEffect: "hover:border-yellow-500/40"
    },
    {
      title: "Analyse et Métriques Extracomptables",
      desc: "Dépassez le cadre de la comptabilité traditionnelle en enrichissant vos analyses financières avec des données opérationnelles pour offrir une vision stratégique globale de votre groupe.",
      gridClass: "md:col-span-7",
      bgEffect: "hover:border-yellow-500/40"
    },
    {
      title: "Journal d'Audit",
      desc: "Garantissez une transparence totale et une fiabilité chirurgicale de vos chiffres auprès de vos actionnaires.",
      gridClass: "md:col-span-5",
      bgEffect: "bg-gradient-to-tl from-yellow-500/[0.04] to-transparent group-hover:from-yellow-500/[0.08]"
    },
  ];

  return (
    <section id="features" className="relative py-24 px-6 overflow-hidden bg-black text-white">
      {/* Effets d'arrière-plan subtils */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-yellow-400/[0.03] rounded-full blur-[120px]"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-yellow-400/[0.02] rounded-full blur-[120px]"></div>
      </div>

      <div className="mx-auto max-w-6xl relative z-10">
        {/* Header Section */}
        <div className="mb-16 grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-[clamp(32px,4.5vw,56px)] font-extrabold leading-[1.1] tracking-tight">
              Précision Chirurgicale <br />
              pour <span className="text-yellow-400">Votre Groupe</span>.
            </h2>
            <p className="mt-4 max-w-md text-[15px] leading-relaxed text-white/60">
              Plus qu&apos;un simple dashboard, <span className="font-semibold text-white">NKOMERS</span> est le cockpit de votre direction financière.
            </p>
          </div>

          {/* Icône géométrique animée en SVG */}
          <div className="hidden lg:flex items-center justify-end pr-8">
            <div className="relative w-40 h-40 animate-spin-slow opacity-70">
              <svg viewBox="0 0 100 100" className="w-full h-full stroke-white/40 fill-none" strokeWidth="1">
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

        {/* Bento Grid layout asymétrique comme sur l'image */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {features.map((feature, index) => (
            <div
              key={index}
              className={`landing-feature-card group relative flex flex-col justify-between rounded-2xl border border-white/[0.08] bg-[#121214]/40 backdrop-blur-md p-8 min-h-[240px] ${feature.gridClass} ${feature.bgEffect}`}
            >
              {/* Top Row: Description & Bouton Flèche oblique */}
              <div className="flex justify-between items-start gap-6">
                <p className="text-[14px] leading-relaxed text-white/60 group-hover:text-white/80 transition-colors duration-300 max-w-[82%]">
                  {feature.desc}
                </p>

                {/* Bouton flèche oblique jaune fixe (comme sur ton modèle) */}
                <div className="landing-feature-arrow flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-yellow-400 text-black shadow-lg shadow-yellow-400/10">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 19.5l15-15m0 0H8.25m11.25 0v11.25" />
                  </svg>
                </div>
              </div>

              {/* Bottom Row: Titre principal en bas */}
              <div className="mt-8">
                <h3 className="text-[22px] md:text-[24px] font-medium tracking-tight text-white/90">
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
          border: 1px solid #fff;
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

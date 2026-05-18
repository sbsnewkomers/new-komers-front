export default function About() {
  const stats = [
    {
      value: "2026",
      title: "Année de création",
      subtitle: "Lance sa carrière dans le domaine",
      offsetTop: false
    },
    {
      value: "50",
      title: "Les projets sont lancés",
      subtitle: "Beaucoup de projets sont réalisés",
      offsetTop: true
    },
    {
      value: "42",
      title: "Les clients sont satisfaits",
      subtitle: "Ces personnes nous aiment",
      offsetTop: false
    },
    {
      value: "10",
      title: "Projets en cours",
      subtitle: "Ce que nous faisons en ce moment",
      offsetTop: true
    }
  ];

  return (
    <section id="about" className="relative bg-black text-white py-24 px-6 overflow-hidden">
      {/* Points de lueur dorés discrets en arrière-plan */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/3 right-1/4 w-2 h-2 bg-yellow-500/40 rounded-full blur-[1px]"></div>
        <div className="absolute top-1/2 left-1/3 w-1.5 h-1.5 bg-yellow-500/30 rounded-full blur-[1px]"></div>
        <div className="absolute top-1/4 left-1/6 w-2 h-2 bg-yellow-500/20 rounded-full blur-[2px]"></div>
      </div>

      <div className="mx-auto max-w-6xl relative z-10">

        {/* Bloc Introduction aligné à droite */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-20">
          <div className="lg:col-start-4 lg:col-span-9">
            <p className="text-[18px] md:text-[21px] font-normal leading-relaxed text-white/90 tracking-tight">
              <span className="text-white/40 text-xs font-mono align-super mr-3">2026</span>
              Que vous pilotiez des holdings en pleine croissance, des directions financières multi-entités ou des groupes d&apos;entreprises exigeants, notre plateforme automatisée est conçue pour donner une clarté absolue à votre structure — de manière fiable, précise et instantanée. <span className="text-white/60">Et les résultats ? Les chiffres parlent d&apos;eux-mêmes :</span>
            </p>
          </div>
        </div>

        {/* Grille des Statistiques avec lignes de liaison */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-16 relative">
          {stats.map((stat, index) => (
            <div key={index} className={`landing-about-stat relative flex flex-col items-start group ${stat.offsetTop ? 'md:pt-12' : ''}`}>
              <div className="text-[64px] font-bold tracking-tight text-white leading-none">{stat.value}</div>
              <div className="mt-3 text-[15px] font-medium text-white">{stat.title}</div>
              <div className="mt-1 text-[13px] text-white/50">{stat.subtitle}</div>

              {/* Ligne & décorations */}
              <div className="mt-6 flex items-center w-full gap-3">
                <div className="flex -space-x-2 shrink-0">
                  {/* Placeholder pour avatars ou miniatures */}
                </div>
                <div className="landing-about-line"></div>
                <div className={`${stat.offsetTop ? 'h-8' : 'h-4'} w-[1px] bg-white/30 shrink-0`}></div>
              </div>
            </div>
          ))}
        </div>

        {/* Bouton d'action "Voir la démo" inférieur */}
        <div className="mt-20 flex flex-wrap items-center justify-center gap-6">
          <a
            href="#demo"
            className="inline-flex items-center gap-3 rounded-full bg-yellow-400 px-8 py-4 text-[15px] font-bold text-black shadow-lg shadow-yellow-400/10 hover:bg-yellow-300 transition-colors"
          >
            Voir la démo
            <svg className="w-4 h-4 stroke-[2.5]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </a>

          <div className="flex items-center gap-2 text-[13px] text-white/40 font-medium">
            <span>Slots are available</span>
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
          </div>
        </div>

      </div>
    </section>
  );
}

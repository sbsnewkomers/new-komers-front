const stats = [
  {
    value: "2026",
    title: "Année de création",
    subtitle: "Lance sa carrière dans le domaine",
    offsetTop: false,
    decoration: "avatars" as const,
    avatarColors: ["#4a3728", "#5c4033", "#3d2b1f"],
  },
  {
    value: "50",
    title: "Les projets sont lancés",
    subtitle: "Beaucoup de projets sont réalisés",
    offsetTop: true,
    decoration: "thumbnails" as const,
    thumbColors: ["#2a1f0e", "#1e1a10", "#2e2210"],
  },
  {
    value: "42",
    title: "Les clients sont satisfaits",
    subtitle: "Ces personnes nous aiment",
    offsetTop: false,
    decoration: "avatars" as const,
    avatarColors: ["#1a2a3a", "#2a3a4a", "#1e3040"],
  },
  {
    value: "10",
    title: "Projets en cours",
    subtitle: "Ce que nous faisons en ce moment",
    offsetTop: true,
    decoration: "thumbnails" as const,
    thumbColors: ["#1a1510", "#241c0e", "#1e1a0c"],
  },
];

function AvatarStack({ colors }: { colors: string[] }) {
  return (
    <div className="flex shrink-0 -space-x-3">
      {colors.map((bg, i) => (
        <div
          key={i}
          className="relative h-10 w-10 rounded-full border-2 overflow-hidden"
          style={{ borderColor: "#111", background: bg, zIndex: colors.length - i }}
        >
          {/* Subtle face silhouette */}
          <div className="absolute inset-0 flex items-end justify-center pb-0">
            <div className="w-5 h-5 rounded-full bg-white/10" style={{ marginBottom: -4 }} />
          </div>
          <div className="absolute top-2 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-white/15" />
        </div>
      ))}
    </div>
  );
}

function ThumbnailStrip({ colors }: { colors: string[] }) {
  return (
    <div
      className="flex shrink-0 gap-0.5 rounded-xl p-1"
      style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" }}
    >
      {colors.map((bg, i) => (
        <div
          key={i}
          className="h-9 w-12 rounded-lg"
          style={{
            background: `linear-gradient(135deg, ${bg} 0%, rgba(255,255,255,0.04) 100%)`,
            border: "1px solid rgba(255,255,255,0.06)",
          }}
        />
      ))}
    </div>
  );
}

export default function About() {
  return (
    <section
      id="about"
      className="relative text-white py-24 px-6 overflow-hidden"
      style={{
        backgroundImage: "url('/landing/AboutUs-background.png')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >

      <div className="mx-auto max-w-6xl relative z-10">

        {/* Intro paragraph */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-20">
          <div className="lg:col-start-4 lg:col-span-9">
            <p className="text-[18px] md:text-[21px] font-normal leading-relaxed text-white/90 tracking-tight">
              <span className="text-white/40 text-xs font-mono align-super mr-3">2026</span>
              Que vous pilotiez des holdings en pleine croissance, des directions financières multi-entités ou des
              groupes d&apos;entreprises exigeants, notre plateforme automatisée est conçue pour donner une clarté
              absolue à votre structure — de manière fiable, précise et instantanée.{" "}
              <span className="text-white/60">Et les résultats ? Les chiffres parlent d&apos;eux-mêmes :</span>
            </p>
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-16">
          {stats.map((stat, index) => (
            <div
              key={index}
              className={`relative flex flex-col items-start ${stat.offsetTop ? "lg:pt-12" : ""}`}
            >
              {/* Number */}
              <div className="text-[64px] font-bold tracking-tight text-white leading-none">
                {stat.value}
              </div>

              {/* Title & subtitle */}
              <div className="mt-3 text-[15px] font-medium text-white">{stat.title}</div>
              <div className="mt-1 text-[13px] text-white/50">{stat.subtitle}</div>

              {/* Decoration row: avatar/thumbnail + line + arrow + tick */}
              <div className="mt-6 flex items-center w-full gap-3">
                {stat.decoration === "avatars" ? (
                  <AvatarStack colors={stat.avatarColors!} />
                ) : (
                  <ThumbnailStrip colors={stat.thumbColors!} />
                )}

                {/* Horizontal line */}
                <div className="flex flex-1 items-center gap-1 min-w-0">
                  <div className="h-px flex-1 bg-white/20" />
                  {/* Arrow head pointing left */}
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none" className="shrink-0 text-white/30">
                    <path d="M8 1L2 5L8 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>

                {/* Vertical tick */}
                <div
                  className="shrink-0 w-px bg-white/30"
                  style={{ height: stat.offsetTop ? 32 : 16 }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* CTA row */}
        <div className="mt-20 flex flex-wrap items-center justify-center gap-6">
          <a
            href="#pricing"
            className="inline-flex items-center gap-3 rounded-full bg-yellow-400 px-8 py-4 text-[15px] font-bold text-black shadow-lg shadow-yellow-400/10 hover:bg-yellow-300 transition-colors"
          >
            Voir la démo
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </a>
          <div className="flex items-center gap-2 text-[13px] text-white/40 font-medium">
            <span>Slots are available</span>
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          </div>
        </div>

      </div>
    </section>
  );
}

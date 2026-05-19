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
          className="relative h-10 w-10 overflow-hidden rounded-full border-2"
          style={{ borderColor: "#111", background: bg, zIndex: colors.length - i }}
        >
          <div className="absolute inset-0 flex items-end justify-center pb-0">
            <div className="h-5 w-5 rounded-full bg-white/10" style={{ marginBottom: -4 }} />
          </div>
          <div className="absolute top-2 left-1/2 -translate-x-1/2 h-4 w-4 rounded-full bg-white/15" />
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
    <section id="about" className="relative overflow-hidden text-white">
      {/* Background image */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: "url('/landing/AboutUs-background.png')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      />
      {/* Dark overlay for readability */}
      <div className="absolute inset-0 bg-black/60" />
      {/* Top gradient — blends in from page background */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-48 bg-gradient-to-b from-[#080808] to-transparent" />
      {/* Bottom gradient — blends out to page background */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-48 bg-gradient-to-t from-[#080808] to-transparent" />

      {/* Content */}
      <div className="relative z-20 px-6 py-28 md:py-36">
        <div className="mx-auto max-w-6xl">

          {/* Eyebrow badge */}
          <div className="mb-14 flex justify-end lg:justify-start">
            <span className="inline-flex items-center gap-2 rounded-full border border-[#EAB308]/25 bg-[#EAB308]/8 px-3 py-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-[#EAB308]" />
              <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#EAB308]">Notre Vision</span>
            </span>
          </div>

          {/* Intro paragraph */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 mb-20">
            <div className="lg:col-start-4 lg:col-span-9">
              <p className="text-[18px] font-normal leading-relaxed tracking-tight text-white/85 md:text-[20px]">
                <span className="mr-3 align-super font-mono text-xs text-white/35">2026</span>
                Que vous pilotiez des holdings en pleine croissance, des directions financières multi-entités ou des
                groupes d&apos;entreprises exigeants, notre plateforme automatisée est conçue pour donner une clarté
                absolue à votre structure — de manière fiable, précise et instantanée.{" "}
                <span className="text-white/55">Et les résultats ? Les chiffres parlent d&apos;eux-mêmes :</span>
              </p>
            </div>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-1 gap-x-8 gap-y-16 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat, index) => (
              <div
                key={index}
                className={`group relative flex flex-col items-start ${stat.offsetTop ? "lg:pt-12" : ""}`}
              >
                {/* Number */}
                <div className="text-[64px] font-bold leading-none tracking-tight text-white transition-colors duration-300 group-hover:text-[#EAB308]">
                  {stat.value}
                </div>

                {/* Title & subtitle */}
                <div className="mt-3 text-[15px] font-medium text-white/90">{stat.title}</div>
                <div className="mt-1 text-[13px] text-white/45">{stat.subtitle}</div>

                {/* Decoration row */}
                <div className="mt-6 flex w-full items-center gap-3">
                  {stat.decoration === "avatars" ? (
                    <AvatarStack colors={stat.avatarColors!} />
                  ) : (
                    <ThumbnailStrip colors={stat.thumbColors!} />
                  )}

                  <div className="flex min-w-0 flex-1 items-center gap-1">
                    <div className="h-px flex-1 bg-white/15" />
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" className="shrink-0 text-white/25">
                      <path d="M8 1L2 5L8 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>

                  <div
                    className="w-px shrink-0 bg-white/25"
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
              className="inline-flex items-center gap-3 rounded-full bg-[#EAB308] px-8 py-4 text-[15px] font-bold text-black shadow-lg shadow-yellow-400/15 transition-all duration-200 hover:bg-yellow-300 hover:shadow-yellow-400/25 active:scale-95"
            >
              Voir la démo
              <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </a>
            <div className="flex items-center gap-2 text-[13px] font-medium text-white/35">
              <span>Slots are available</span>
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}

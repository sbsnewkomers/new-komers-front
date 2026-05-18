export default function Stats() {
  const stats = [
    { value: "100+", label: "Clients" },
    { value: "50+", label: "Projets" },
    { value: "42+", label: "Avis 5 Étoiles" },
  ];

  return (
    <section className="relative border-y border-white/5 py-16 px-6 overflow-hidden">
      {/* Effet de lueur subtile en arrière-plan */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-yellow-400/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="mx-auto max-w-5xl relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-white/5 gap-y-10 md:gap-y-0">
          {stats.map((s) => (
            <div key={s.label} className="landing-stat-item flex flex-col items-center justify-center px-8 group">
              {/* Chiffre avec effet de scale subtil au survol */}
              <div className="text-[clamp(36px,5vw,56px)] font-black text-white">
                {s.value}
              </div>
              {/* Label avec style cohérent au hero */}
              <div className="mt-2 text-[14px] font-medium text-yellow-400">
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

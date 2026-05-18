import * as React from "react";

interface HeroProps {
  isLoaded: boolean;
}

export default function Hero({ isLoaded }: HeroProps) {
  return (
    <section
      id="hero"
      className="relative flex min-h-screen flex-col items-center justify-center px-6 pt-24 pb-20 text-center overflow-hidden"
    >
      {/* Background image only */}
      <div
        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: 'url(/landing/hero.png)' }}
      />

      <div className="relative z-10 mx-auto max-w-4xl">
        {/* Social proof chip */}
        <div className="mb-8 inline-flex items-center gap-3">
          <div className="flex -space-x-2">
            {(["#8b6914", "#a07820", "#c49a2c", "#d4b06a"] as const).map((color, i) => (
              <div
                key={i}
                className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-black text-[10px] font-bold text-white"
                style={{ background: `linear-gradient(135deg, ${color}, #3a2a0a)` }}
                aria-hidden
              >
                {["A", "B", "C", "D"][i]}
              </div>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <div className="flex" aria-label="5 étoiles">
              {[1, 2, 3, 4, 5].map((i) => (
                <svg key={i} className="h-3.5 w-3.5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20" aria-hidden>
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
            </div>
            <span className="text-[13px] text-(--text-muted)">42+ happy clients</span>
          </div>
        </div>

        <h1 className={`landing-hero-title text-balance text-[clamp(38px,5.5vw,72px)] font-black leading-[1.08] text-white mb-2 ${isLoaded ? '' : 'opacity-0 translate-y-8'}`}>
          La Clarté <span className="text-yellow-400">Financière</span> pour
          <br />
          Les Holdings &amp; <span className="text-yellow-400">Groupes</span>&nbsp;.
        </h1>

        <p className={`landing-hero-content delay-300 mx-auto mt-6 max-w-2xl text-[16px] leading-relaxed text-(--text-muted) ${isLoaded ? '' : 'opacity-0 translate-y-8'}`}>
          Centralisez vos flux, automatisez vos consolidations et pilotez votre trésorerie multi-entités depuis
          une interface conçue pour la haute performance.
        </p>

        <div className={`landing-hero-content delay-500 mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row ${isLoaded ? '' : 'opacity-0 translate-y-8'}`}>
          <a
            href="#pricing"
            className="group relative inline-flex items-center justify-center rounded-full bg-yellow-400 px-8 py-3.5 text-sm font-semibold text-black shadow-[0_8px_30px_rgba(250,204,21,0.4)] hover:bg-yellow-300 transition-all duration-300 hover:scale-105 hover:shadow-[0_12px_40px_rgba(250,204,21,0.5)]"
          >
            <span className="relative z-10">Voir la démo</span>
            <div className="absolute inset-0 rounded-full bg-yellow-400 opacity-0 group-hover:opacity-20 transition-opacity duration-300 blur-xl"></div>
          </a>
          <a
            href="#features"
            className="group relative inline-flex items-center justify-center rounded-full border border-white/30 bg-black px-8 py-3.5 text-sm font-semibold text-white hover:border-white/50 hover:bg-white/5 transition-all duration-300 hover:scale-105"
          >
            <span className="relative z-10">Voir les détails</span>
            <div className="absolute inset-0 rounded-full border border-yellow-400/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          </a>
        </div>
      </div>
    </section>
  );
}

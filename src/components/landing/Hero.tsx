interface HeroProps {
  isLoaded: boolean;
}

export default function Hero({ isLoaded }: HeroProps) {
  return (
    <section
      id="hero"
      className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 pb-20 pt-24 text-center"
    >
      {/* Background image */}
      <div
        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url(/landing/hero.png)" }}
      />

      {/* Gradient fade at bottom so stats section blends in */}
      <div
        className="pointer-events-none absolute bottom-0 left-0 right-0 z-10 h-48"
        style={{ background: "linear-gradient(180deg, rgba(0,0,0,0) 0%, #010101 100%)" }}
      />

      <div className="relative z-20 mx-auto max-w-[1005px]">
        {/* Social proof chip */}
        <div
          className="mb-7 inline-flex items-center gap-[13px] rounded-full"
          style={{
            padding: "15px 24px",
            background: "linear-gradient(90deg, rgba(255,84,31,0.13) 0%, rgba(255,84,31,0.04) 100%)",
            border: "0.94px solid rgba(255,255,255,0.15)",
          }}
        >
          {/* Avatar stack */}
          <div className="flex items-center">
            {(["#8b6914", "#a07820", "#c49a2c", "#d4b06a"] as const).map((color, i) => (
              <div
                key={i}
                className="relative flex h-[41px] w-[41px] overflow-hidden rounded-full border-[1.5px] border-black/40"
                style={{
                  background: `linear-gradient(145deg, ${color} 0%, #3a2a0a 100%)`,
                  marginLeft: i === 0 ? 0 : "-10px",
                  zIndex: 5 - i,
                  boxShadow: "inset 0 1px 2px rgba(255,255,255,0.15), inset 0 -1px 2px rgba(0,0,0,0.4)",
                }}
                aria-hidden
              >
                {/* Head */}
                <div
                  className="absolute rounded-full"
                  style={{
                    width: 14,
                    height: 14,
                    background: `linear-gradient(135deg, rgba(255,255,255,0.35), rgba(255,255,255,0.12))`,
                    top: 8,
                    left: "50%",
                    transform: "translateX(-50%)",
                  }}
                />
                {/* Shoulders */}
                <div
                  className="absolute rounded-full"
                  style={{
                    width: 28,
                    height: 20,
                    background: `linear-gradient(135deg, rgba(255,255,255,0.22), rgba(255,255,255,0.08))`,
                    bottom: -6,
                    left: "50%",
                    transform: "translateX(-50%)",
                  }}
                />
              </div>
            ))}
          </div>

          {/* Stars + label */}
          <div className="flex flex-col items-start gap-1">
            <div className="flex" aria-label="5 étoiles">
              {[1, 2, 3, 4, 5].map((i) => (
                <svg
                  key={i}
                  className="h-[15.86px] w-[15.86px] text-[#EAB308]"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                  aria-hidden
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
            </div>
            <span style={{ fontSize: "16.86px", lineHeight: "22px", letterSpacing: "-0.36px", color: "rgba(255,255,255,0.65)" }}>
              42+ happy clients
            </span>
          </div>
        </div>

        {/* Heading */}
        <h1
          className={`text-balance font-bold text-white transition-all duration-700 ${
            isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
          style={{ fontSize: 80, lineHeight: "88px", textAlign: "center" }}
        >
          La Clarté <span style={{ color: "#EAB308" }}>Financière</span> pour
          <br />
          Les Holdings &amp;&nbsp;<span style={{ color: "#EAB308" }}>Groupes</span>&nbsp;.
        </h1>

        {/* Subtitle */}
        <p
          className={`mx-auto transition-all duration-700 delay-200 ${
            isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
          style={{
            marginTop: 27,
            maxWidth: 681,
            fontSize: 22,
            lineHeight: "26px",
            textAlign: "center",
            color: "rgba(255,255,255,0.7)",
          }}
        >
          Centralisez vos flux, automatisez vos consolidations et pilotez votre trésorerie multi-entités depuis
          une interface conçue pour la haute performance.
        </p>

        {/* CTAs */}
        <div
          className={`flex flex-col items-center justify-center gap-[23px] sm:flex-row transition-all duration-700 delay-300 ${
            isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
          style={{ marginTop: 27 }}
        >
          <a
            href="#pricing"
            className="flex items-center justify-center rounded-[10px] bg-[#EAB308] font-bold text-black transition-opacity hover:opacity-90"
            style={{ padding: "15px 35px", fontSize: 20, lineHeight: "19px", minWidth: 184 }}
          >
            Voir la démo
          </a>
          <a
            href="#features"
            className="flex items-center justify-center rounded-[10px] font-normal text-white transition-colors hover:border-white/50"
            style={{
              padding: "15px 35px",
              fontSize: 20,
              lineHeight: "19px",
              border: "1px solid rgba(252,252,252,0.23)",
              minWidth: 198,
            }}
          >
            Voir les détails
          </a>
        </div>
      </div>
    </section>
  );
}

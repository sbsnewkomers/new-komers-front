export default function Footer() {
  return (
    <footer className="relative overflow-hidden text-white">
      {/* Background image */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: "url('/landing/footer-background.png')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      />
      {/* Dark overlay — light enough to let the image breathe */}
      <div className="absolute inset-0 bg-black/45" />
      {/* Top gradient — blends from page background into the footer image */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-48 bg-gradient-to-b from-[#080808] via-[#080808]/60 to-transparent" />

      {/* Content */}
      <div className="relative z-20 mx-auto max-w-[1190px] px-6 pb-12 pt-24">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-[1.6fr_1fr_1fr_1fr]">

          {/* Brand */}
          <div>
            {/* Logo matching Navigation */}
            <div className="flex flex-col leading-none">
              <span className="text-[22px] font-extrabold tracking-[0.15em] bg-gradient-to-r from-yellow-500 via-yellow-300 to-yellow-400 bg-clip-text text-transparent">
                NK
              </span>
              <span className="mt-0.5 text-[9px] font-medium tracking-[0.35em] text-white/40 uppercase">
                SOFTWARE
              </span>
            </div>
            <p className="mt-5 max-w-xs text-[13px] leading-relaxed" style={{ color: "rgba(255,255,255,0.4)" }}>
              Une plateforme financière qui vous aide à consolider, projeter et piloter votre structure en temps
              réel — que vous soyez une jeune holding en croissance, des directions financières multi-entités ou
              des grands groupes exigeants.
            </p>
          </div>

          {/* Produit */}
          <div>
            <h4 className="mb-5 text-[11px] font-bold uppercase tracking-[0.2em]" style={{ color: "#EAB308" }}>Produit</h4>
            <ul className="space-y-3 text-[13px]" style={{ color: "rgba(255,255,255,0.45)" }}>
              <li><a href="#features" className="transition-colors duration-200 hover:text-[#EAB308]">Consolidation</a></li>
              <li><a href="#features" className="transition-colors duration-200 hover:text-[#EAB308]">Reporting Automatique</a></li>
              <li><a href="#features" className="transition-colors duration-200 hover:text-[#EAB308]">Cash-Burn Engine</a></li>
              <li><a href="#hero" className="transition-colors duration-200 hover:text-[#EAB308]">Sécurité</a></li>
            </ul>
          </div>

          {/* Légal */}
          <div>
            <h4 className="mb-5 text-[11px] font-bold uppercase tracking-[0.2em]" style={{ color: "#EAB308" }}>Légal</h4>
            <ul className="space-y-3 text-[13px]" style={{ color: "rgba(255,255,255,0.45)" }}>
              <li><a href="#" className="transition-colors duration-200 hover:text-[#EAB308]">Confidentialité</a></li>
              <li><a href="#" className="transition-colors duration-200 hover:text-[#EAB308]">Mentions Légales</a></li>
              <li><a href="#" className="transition-colors duration-200 hover:text-[#EAB308]">CGU-CGV</a></li>
              <li><a href="#faq" className="transition-colors duration-200 hover:text-[#EAB308]">Contact Us</a></li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="mb-5 text-[11px] font-bold uppercase tracking-[0.2em]" style={{ color: "#EAB308" }}>Support</h4>
            <ul className="space-y-3 text-[13px]" style={{ color: "rgba(255,255,255,0.45)" }}>
              <li><a href="#faq" className="transition-colors duration-200 hover:text-[#EAB308]">Centre d&apos;aide</a></li>
              <li><a href="#" className="transition-colors duration-200 hover:text-[#EAB308]">API Documentation</a></li>
              <li><a href="#faq" className="transition-colors duration-200 hover:text-[#EAB308]">Contact</a></li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div
          className="mt-14 flex flex-col gap-4 pt-6 text-xs md:flex-row md:items-center md:justify-between"
          style={{ borderTop: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.3)" }}
        >
          <span>© 2026 NK Software. Tous droits réservés.</span>
          <div className="flex flex-wrap items-center gap-3">
            <span
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px]"
              style={{ border: "1px solid rgba(255,255,255,0.08)" }}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" aria-hidden />
              SÉCURITÉ PAR CHIFFREMENT AES-256
            </span>
            <span
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px]"
              style={{ border: "1px solid rgba(255,255,255,0.08)" }}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" aria-hidden />
              Système Opérationnel
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}

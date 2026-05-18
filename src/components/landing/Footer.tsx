export default function Footer() {
  return (
    <footer
      className="relative text-white"
      style={{
        backgroundImage: "url('/landing/footer-background.png')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      <div className="h-px" style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent)" }} />

      <div className="mx-auto max-w-[1190px] px-6 py-16">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-[1.6fr_1fr_1fr_1fr]">
          {/* Brand */}
          <div>
            <span className="font-bold text-white" style={{ fontFamily: "Inter, sans-serif", fontSize: 24, letterSpacing: "-0.6px" }}>
              NK Software
            </span>
            <p className="mt-4 max-w-xs text-[13px] leading-relaxed" style={{ color: "rgba(255,255,255,0.5)" }}>
              Une plateforme financière qui vous aide à consolider, projeter et piloter votre structure en temps
              réel — que vous soyez une jeune holding en croissance, des directions financières multi-entités ou
              des grands groupes exigeants.
            </p>
          </div>

          {/* Produit */}
          <div>
            <h4 className="mb-4 text-xs font-bold uppercase tracking-widest" style={{ color: "#EAB308" }}>Produit</h4>
            <ul className="space-y-2.5 text-[13px]" style={{ color: "rgba(255,255,255,0.5)" }}>
              <li><a href="#features" className="hover:text-[#EAB308] transition-colors">Consolidation</a></li>
              <li><a href="#features" className="hover:text-[#EAB308] transition-colors">Reporting Automatique</a></li>
              <li><a href="#features" className="hover:text-[#EAB308] transition-colors">Cash-Burn Engine</a></li>
              <li><a href="#hero" className="hover:text-[#EAB308] transition-colors">Sécurité</a></li>
            </ul>
          </div>

          {/* Légal */}
          <div>
            <h4 className="mb-4 text-xs font-bold uppercase tracking-widest" style={{ color: "#EAB308" }}>Légal</h4>
            <ul className="space-y-2.5 text-[13px]" style={{ color: "rgba(255,255,255,0.5)" }}>
              <li><a href="#" className="hover:text-[#EAB308] transition-colors">Confidentialité</a></li>
              <li><a href="#" className="hover:text-[#EAB308] transition-colors">Mentions Légales</a></li>
              <li><a href="#" className="hover:text-[#EAB308] transition-colors">CGU-CGV</a></li>
              <li><a href="#faq" className="hover:text-[#EAB308] transition-colors">Contact Us</a></li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="mb-4 text-xs font-bold uppercase tracking-widest" style={{ color: "#EAB308" }}>Support</h4>
            <ul className="space-y-2.5 text-[13px]" style={{ color: "rgba(255,255,255,0.5)" }}>
              <li><a href="#faq" className="hover:text-[#EAB308] transition-colors">Centre d&apos;aide</a></li>
              <li><a href="#" className="hover:text-[#EAB308] transition-colors">API Documentation</a></li>
              <li><a href="#faq" className="hover:text-[#EAB308] transition-colors">Contact</a></li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div
          className="mt-12 flex flex-col gap-4 pt-6 text-xs md:flex-row md:items-center md:justify-between"
          style={{ borderTop: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.4)" }}
        >
          <span>© 2026 Newkomers. Tous droits réservés.</span>
          <div className="flex flex-wrap items-center gap-3">
            <span
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px]"
              style={{ border: "1px solid rgba(255,255,255,0.1)" }}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" aria-hidden />
              SÉCURITÉ PAR CHIFFREMENT AES-256
            </span>
            <span
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px]"
              style={{ border: "1px solid rgba(255,255,255,0.1)" }}
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

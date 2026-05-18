export default function Footer() {
  return (
    <footer className="relative bg-black text-white">
      {/* Ligne de séparation supérieure */}
      <div className="h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>

      <div className="mx-auto max-w-7xl px-6 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">

          {/* Section branding - gauche */}
          <div className="lg:col-span-5">
            <div className="mb-8">
              <h3 className="text-2xl font-bold text-white mb-2">NK Software</h3>
              <p className="text-white/60 text-sm leading-relaxed max-w-md">
                La plateforme financière qui vous aide à consolider, projeter et piloter votre structure en temps réel.
              </p>
            </div>

            {/* Badges de confiance */}
            <div className="flex flex-wrap gap-3">
              <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/10 bg-white/5 text-xs text-white/60">
                <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
                GDPR Compliant
              </span>
              <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/10 bg-white/5 text-xs text-white/60">
                <div className="w-2 h-2 rounded-full bg-blue-400"></div>
                ISO 27001
              </span>
            </div>
          </div>

          {/* Navigation - centre et droite */}
          <div className="lg:col-span-6 lg:col-start-8">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
              <div>
                <h4 className="text-sm font-semibold text-white mb-4">Produit</h4>
                <ul className="space-y-3">
                  <li><a href="#features" className="text-sm text-white/60 hover:text-white transition-colors">Fonctionnalités</a></li>
                  <li><a href="#pricing" className="text-sm text-white/60 hover:text-white transition-colors">Tarifs</a></li>
                  <li><a href="#about" className="text-sm text-white/60 hover:text-white transition-colors">À propos</a></li>
                  <li><a href="#faq" className="text-sm text-white/60 hover:text-white transition-colors">FAQ</a></li>
                </ul>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-white mb-4">Entreprise</h4>
                <ul className="space-y-3">
                  <li><a href="#" className="text-sm text-white/60 hover:text-white transition-colors">Blog</a></li>
                  <li><a href="#" className="text-sm text-white/60 hover:text-white transition-colors">Carrières</a></li>
                  <li><a href="#" className="text-sm text-white/60 hover:text-white transition-colors">Presse</a></li>
                  <li><a href="#" className="text-sm text-white/60 hover:text-white transition-colors">Partenaires</a></li>
                </ul>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-white mb-4">Légal</h4>
                <ul className="space-y-3">
                  <li><a href="#" className="text-sm text-white/60 hover:text-white transition-colors">Confidentialité</a></li>
                  <li><a href="#" className="text-sm text-white/60 hover:text-white transition-colors">Conditions</a></li>
                  <li><a href="#" className="text-sm text-white/60 hover:text-white transition-colors">Cookies</a></li>
                  <li><a href="#" className="text-sm text-white/60 hover:text-white transition-colors">Licences</a></li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom section */}
        <div className="mt-16 pt-8 border-t border-white/10">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <p className="text-sm text-white/50">
              © 2026 NK Software. Tous droits réservés.
            </p>

            <div className="flex items-center gap-6">
              <a href="#" className="text-sm text-white/50 hover:text-white transition-colors">
                Politique de confidentialité
              </a>
              <a href="#" className="text-sm text-white/50 hover:text-white transition-colors">
                Conditions d'utilisation
              </a>
              <a href="#" className="text-sm text-white/50 hover:text-white transition-colors">
                Cookies
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

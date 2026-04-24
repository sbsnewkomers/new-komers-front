import Head from "next/head";
import Link from "next/link";
import { usePermissionsContext } from "@/permissions/PermissionsProvider";

export default function LandingPage() {
  const { user, logout } = usePermissionsContext();

  return (
    <div className="landing min-h-screen selection:bg-[#64FFDA]/30">
      <Head>
        <title>NEWKOMERS | Pilotage Financier de Groupe</title>
        <meta name="description" content="Centralisez vos flux, automatisez vos consolidations et pilotez votre trésorerie multi-entités." />
      </Head>

      <header className="fixed top-0 w-full z-50 glass-panel border-b border-border">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-(--accent) rounded-xl flex items-center justify-center">
              <span className="material-symbols-outlined text-primary font-bold">query_stats</span>
            </div>
            <span className="text-2xl font-bold tracking-tighter text-white">NEWKOMERS</span>
          </Link>
          <nav className="hidden lg:flex items-center gap-10">
            <a className="text-sm font-medium text-(--text-muted) hover:text-(--accent) transition-colors" href="#features">Solutions</a>
            <a className="text-sm font-medium text-(--text-muted) hover:text-(--accent) transition-colors" href="#social">Clientèle</a>
            <a className="text-sm font-medium text-(--text-muted) hover:text-(--accent) transition-colors" href="#pricing">Tarification</a>
            <a className="text-sm font-medium text-(--text-muted) hover:text-(--accent) transition-colors" href="#contact">Contact</a>
          </nav>
          <div className="flex items-center gap-6">
            {user ? (
              <>
                <Link className="text-sm font-medium text-(--text-muted) hover:text-white transition-colors" href="/dashboard">Espace client</Link>
                <button
                  type="button"
                  onClick={() => logout()}
                  className="text-sm font-semibold bg-white text-primary px-6 py-2.5 rounded-full hover:bg-(--accent) transition-all"
                >
                  Déconnexion
                </button>
              </>
            ) : (
              <>
                <Link className="text-sm font-medium text-(--text-muted) hover:text-white transition-colors" href="/login">Se connecter</Link>
                <Link className="text-sm font-semibold bg-white text-primary px-6 py-2.5 rounded-full hover:bg-(--accent) transition-all" href="/login">
                  Démarrer l&apos;essai
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="relative overflow-hidden">
        <section className="relative px-4 pt-44 pb-32 gradient-bg sm:px-6">
          <div className="max-w-7xl mx-auto text-center">
            <div className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full glass-panel border-border mb-10">
              <span className="flex h-2 w-2 rounded-full bg-(--accent)"></span>
              <span className="text-xs font-semibold uppercase tracking-widest text-(--accent)">Standard de Reporting Financier 2.0</span>
            </div>
            <h1 className="serif-heading text-5xl md:text-7xl font-bold text-white mb-8 max-w-5xl mx-auto leading-tight">
              La clarté financière absolue pour les <span className="italic text-(--accent)">holdings & groupes</span>.
            </h1>
            <p className="text-xl text-(--text-muted) max-w-2xl mx-auto mb-12 leading-relaxed">
              Centralisez vos flux, automatisez vos consolidations et pilotez votre trésorerie multi-entités depuis une interface conçue pour la haute performance.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-5 mb-24">
              <Link
                href={user ? "/dashboard" : "/login"}
                className="w-full sm:w-auto px-10 py-5 bg-(--accent) text-primary font-bold rounded-xl hover:scale-105 transition-all shadow-xl shadow-(--accent)/10 text-center"
              >
                Découvrir la plateforme
              </Link>
              <a
                href="#contact"
                className="w-full sm:w-auto px-10 py-5 glass-panel text-white font-bold rounded-xl hover:bg-white/5 transition-all text-center inline-block"
              >
                Planifier une démo
              </a>
            </div>
            <div className="relative max-w-6xl mx-auto group">
              <div className="absolute -inset-4 bg-linear-to-tr from-(--accent)/20 to-indigo-500/20 rounded-[40px] blur-3xl opacity-30 group-hover:opacity-50 transition-opacity"></div>
              <div className="relative glass-panel rounded-[32px] p-2 border border-white/10 shadow-2xl overflow-hidden">
                <div className="bg-primary rounded-[30px] overflow-hidden border border-white/5">
                  <div className="h-14 border-b border-white/5 bg-primary-light flex items-center px-6 gap-4">
                    <div className="flex gap-2">
                      <div className="w-3 h-3 rounded-full bg-red-500/50"></div>
                      <div className="w-3 h-3 rounded-full bg-yellow-500/50"></div>
                      <div className="w-3 h-3 rounded-full bg-green-500/50"></div>
                    </div>
                    <div className="flex-1 max-w-md mx-auto">
                      <div className="bg-primary border border-white/5 rounded-lg h-7 flex items-center px-3 gap-2">
                        <span className="material-symbols-outlined text-[14px] text-(--text-muted)">lock</span>
                        <span className="text-[10px] text-(--text-muted) tracking-wide">newkomers.app/consolidated-dashboard</span>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-12 h-[600px]">
                    <aside className="col-span-2 border-r border-white/5 p-6 space-y-8">
                      <div className="space-y-4">
                        <div className="h-2 w-20 bg-white/10 rounded"></div>
                        <div className="h-2 w-24 bg-white/5 rounded"></div>
                        <div className="h-2 w-16 bg-white/5 rounded"></div>
                      </div>
                      <div className="space-y-4 pt-10">
                        <div className="h-2 w-full bg-(--accent)/20 rounded"></div>
                        <div className="h-2 w-full bg-white/5 rounded"></div>
                        <div className="h-2 w-full bg-white/5 rounded"></div>
                      </div>
                    </aside>
                    <div className="col-span-10 p-8">
                      <div className="grid grid-cols-3 gap-6 mb-8">
                        <div className="h-32 bg-primary-light rounded-2xl border border-white/5 p-4">
                          <div className="w-8 h-8 rounded bg-(--accent)/10 mb-4"></div>
                          <div className="h-2 w-12 bg-white/20 rounded mb-2"></div>
                          <div className="h-4 w-24 bg-white/40 rounded"></div>
                        </div>
                        <div className="h-32 bg-primary-light rounded-2xl border border-white/5 p-4">
                          <div className="w-8 h-8 rounded bg-indigo-500/10 mb-4"></div>
                          <div className="h-2 w-12 bg-white/20 rounded mb-2"></div>
                          <div className="h-4 w-24 bg-white/40 rounded"></div>
                        </div>
                        <div className="h-32 bg-primary-light rounded-2xl border border-white/5 p-4">
                          <div className="w-8 h-8 rounded bg-emerald-500/10 mb-4"></div>
                          <div className="h-2 w-12 bg-white/20 rounded mb-2"></div>
                          <div className="h-4 w-24 bg-white/40 rounded"></div>
                        </div>
                      </div>
                      <div className="h-[340px] bg-primary-light rounded-2xl border border-white/5 relative overflow-hidden">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          alt="Analytics Preview"
                          className="w-full h-full object-cover opacity-30 grayscale"
                          src="https://lh3.googleusercontent.com/aida-public/AB6AXuDhjFDm6TmezmaIBSrrlvOIoU11u9JnJx4ZKuP-Vl2wMG1RoSVY7XW2GryFDoi-nzYbj8QkaZ5YyCVMaXhmMq_vq7oqphzMB0xxkdHNY2_SZSPHTRYnnwa780pDRz3SRTXZZtxncqlYM2Ks_f5Lb0Fg46AeIIxAeSTzAoeT767A8Pysp8TqeYV89xZH6bNg5Bs9KZBk5m9Tgg9hNgy5Xf-zs8wzAbwnXCJ9RMOH-6KoOJohQP_KucaZvSV0O90pxHjtjzbLAQ2x9sOX"
                        />
                        <div className="absolute inset-0 bg-linear-to-t from-primary-light to-transparent"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-24 border-y border-border bg-primary-light/30" id="social">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <div className="flex flex-col items-center gap-12">
              <div className="flex items-center gap-4">
                <div className="h-px w-12 bg-border"></div>
                <span className="text-xs font-bold uppercase tracking-[0.3em] text-(--text-muted)">Approuvé par l&apos;élite financière</span>
                <div className="h-px w-12 bg-border"></div>
              </div>
              <div className="flex flex-wrap justify-center items-center gap-16 md:gap-24 grayscale opacity-60">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-3xl">diamond</span>
                  <span className="text-xl font-bold tracking-widest text-white">LUMINA</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-3xl">token</span>
                  <span className="text-xl font-bold tracking-widest text-white">ARCANE</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-3xl">layers</span>
                  <span className="text-xl font-bold tracking-widest text-white">STRATOS</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-3xl">grid_view</span>
                  <span className="text-xl font-bold tracking-widest text-white">NEXUS</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-32" id="features">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <div className="text-center mb-24">
              <h2 className="serif-heading text-4xl md:text-5xl font-bold text-white mb-6">Précision chirurgicale pour votre groupe</h2>
              <p className="text-(--text-muted) text-lg max-w-2xl mx-auto">
                Plus qu&apos;un simple dashboard, NEWKOMERS est le cockpit de votre direction financière.
              </p>
            </div>
            <div className="grid md:grid-cols-2 gap-20 items-center mb-32">
              <div className="space-y-8">
                <div className="w-14 h-14 rounded-2xl bg-(--accent-soft) border border-(--accent)/20 flex items-center justify-center text-(--accent)">
                  <span className="material-symbols-outlined text-3xl">hub</span>
                </div>
                <h3 className="serif-heading text-3xl font-bold text-white leading-tight">Consolidation de Données Multi-SIREN</h3>
                <p className="text-(--text-muted) leading-relaxed text-lg">
                  Gérez un nombre illimité d&apos;entités juridiques sans effort. Notre moteur d&apos;agrégation synchronise vos balances générales en temps réel via API.
                </p>
                <ul className="space-y-4">
                  <li className="flex items-center gap-3 text-sm text-white/80">
                    <span className="material-symbols-outlined text-(--accent) text-xl">check_circle</span>
                    Élimination automatique des intercos
                  </li>
                  <li className="flex items-center gap-3 text-sm text-white/80">
                    <span className="material-symbols-outlined text-(--accent) text-xl">check_circle</span>
                    Mappage intelligent des plans de comptes
                  </li>
                </ul>
              </div>
              <div className="feature-ui-card rounded-3xl p-8 shadow-2xl relative">
                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-8">
                    <div className="h-4 w-32 bg-white/10 rounded"></div>
                    <div className="h-8 w-8 rounded-full bg-(--accent)/20"></div>
                  </div>
                  <div className="h-40 w-full bg-white/5 rounded-xl border border-white/5 flex items-end p-4 gap-2">
                    <div className="flex-1 bg-(--accent)/40 rounded-t h-[30%]"></div>
                    <div className="flex-1 bg-(--accent)/60 rounded-t h-[50%]"></div>
                    <div className="flex-1 bg-(--accent)/80 rounded-t h-[80%]"></div>
                    <div className="flex-1 bg-(--accent) rounded-t h-[60%]"></div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="h-12 bg-white/5 rounded-lg border border-white/5"></div>
                    <div className="h-12 bg-white/5 rounded-lg border border-white/5"></div>
                  </div>
                </div>
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-20 items-center">
              <div className="order-2 md:order-1 feature-ui-card rounded-3xl p-8 shadow-2xl">
                <div className="space-y-6">
                  <div className="flex items-center gap-4 border-b border-white/5 pb-4">
                    <div className="w-10 h-10 rounded-lg bg-indigo-500/20"></div>
                    <div className="h-3 w-40 bg-white/20 rounded"></div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center text-xs text-white/40 uppercase tracking-widest">
                      <span>Scénario Optimiste</span>
                      <span className="text-(--accent)">+12.4%</span>
                    </div>
                    <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full w-[70%] bg-(--accent)"></div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center text-xs text-white/40 uppercase tracking-widest">
                      <span>Pessimiste</span>
                      <span className="text-red-400">-4.2%</span>
                    </div>
                    <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full w-[40%] bg-red-400"></div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="order-1 md:order-2 space-y-8">
                <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                  <span className="material-symbols-outlined text-3xl">insights</span>
                </div>
                <h3 className="serif-heading text-3xl font-bold text-white leading-tight">Projection & Cash Burn</h3>
                <p className="text-(--text-muted) leading-relaxed text-lg">
                  Anticipez vos besoins de financement à 12, 24 ou 36 mois. Nos modèles prédictifs intègrent vos saisonnalités et vos charges structurelles.
                </p>
                <ul className="space-y-4">
                  <li className="flex items-center gap-3 text-sm text-white/80">
                    <span className="material-symbols-outlined text-indigo-400 text-xl">check_circle</span>
                    Simulation de scénarios &quot;What-if&quot;
                  </li>
                  <li className="flex items-center gap-3 text-sm text-white/80">
                    <span className="material-symbols-outlined text-indigo-400 text-xl">check_circle</span>
                    Alerte de seuil de trésorerie critique
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        <section className="py-32 bg-primary-light/20" id="pricing">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <div className="text-center mb-24">
              <span className="text-(--accent) font-bold tracking-[0.2em] text-xs uppercase mb-4 block">Tarification Transparente</span>
              <h2 className="serif-heading text-4xl md:text-5xl font-bold text-white">Évoluez à votre rythme</h2>
            </div>
            <div className="grid lg:grid-cols-3 gap-8">
              <div className="pricing-card glass-panel rounded-3xl p-10 flex flex-col">
                <div className="mb-10">
                  <h4 className="text-lg font-bold text-white mb-2">Starter</h4>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold text-white">490€</span>
                    <span className="text-(--text-muted)]">/mois</span>
                  </div>
                  <p className="text-sm text-(--text-muted) mt-4">Idéal pour les jeunes groupes en croissance.</p>
                </div>
                <ul className="space-y-5 mb-12 flex-1">
                  <li className="flex items-center gap-3 text-sm">
                    <span className="material-symbols-outlined text-(--accent) text-lg">done</span>
                    Jusqu&apos;à 5 SIREN inclus
                  </li>
                  <li className="flex items-center gap-3 text-sm">
                    <span className="material-symbols-outlined text-(--accent) text-lg">done</span>
                    Synchronisation bancaire quotidienne
                  </li>
                  <li className="flex items-center gap-3 text-sm">
                    <span className="material-symbols-outlined text-(--accent) text-lg">done</span>
                    Reporting standard (P&L, Bilan)
                  </li>
                </ul>
                <Link href="/login" className="w-full py-4 rounded-xl border border-white/10 text-white font-bold hover:bg-white/5 transition-all text-center block">
                  Démarrer Starter
                </Link>
              </div>
              <div className="pricing-card bg-primary-light border-2 border-(--accent) rounded-3xl p-10 flex flex-col relative">
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-(--accent) text-primary px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wider">Recommandé</div>
                <div className="mb-10">
                  <h4 className="text-lg font-bold text-white mb-2">Business</h4>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold text-white">1 290€</span>
                    <span className="text-(--text-muted)]">/mois</span>
                  </div>
                  <p className="text-sm text-(--text-muted) mt-4">La puissance de la consolidation automatique.</p>
                </div>
                <ul className="space-y-5 mb-12 flex-1">
                  <li className="flex items-center gap-3 text-sm font-semibold text-white">
                    <span className="material-symbols-outlined text-(--accent) text-lg">done</span>
                    SIREN illimités
                  </li>
                  <li className="flex items-center gap-3 text-sm">
                    <span className="material-symbols-outlined text-(--accent) text-lg">done</span>
                    Consolidation automatique
                  </li>
                  <li className="flex items-center gap-3 text-sm">
                    <span className="material-symbols-outlined text-(--accent) text-lg">done</span>
                    Module de projection cash (12 mois)
                  </li>
                  <li className="flex items-center gap-3 text-sm">
                    <span className="material-symbols-outlined text-(--accent) text-lg">done</span>
                    Export format Expert-Comptable
                  </li>
                </ul>
                <Link href="/login" className="w-full py-4 rounded-xl bg-(--accent) text-primary font-bold hover:scale-[1.02] transition-all text-center block">
                  Démarrer Business
                </Link>
              </div>
              <div className="pricing-card glass-panel rounded-3xl p-10 flex flex-col">
                <div className="mb-10">
                  <h4 className="text-lg font-bold text-white mb-2">Enterprise</h4>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold text-white">Sur devis</span>
                  </div>
                  <p className="text-sm text-(--text-muted) mt-4">Pour les ETI et directions financières exigeantes.</p>
                </div>
                <ul className="space-y-5 mb-12 flex-1">
                  <li className="flex items-center gap-3 text-sm">
                    <span className="material-symbols-outlined text-(--accent) text-lg">done</span>
                    Tout le plan Business
                  </li>
                  <li className="flex items-center gap-3 text-sm">
                    <span className="material-symbols-outlined text-(--accent) text-lg">done</span>
                    Accès API complet (REST)
                  </li>
                  <li className="flex items-center gap-3 text-sm">
                    <span className="material-symbols-outlined text-(--accent) text-lg">done</span>
                    Key Account Manager dédié
                  </li>
                  <li className="flex items-center gap-3 text-sm">
                    <span className="material-symbols-outlined text-(--accent) text-lg">done</span>
                    SSO / SAML enforcement
                  </li>
                </ul>
                <a href="#contact" className="w-full py-4 rounded-xl border border-white/10 text-white font-bold hover:bg-white/5 transition-all text-center block">
                  Contacter les ventes
                </a>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-32 sm:px-6" id="contact">
          <div className="relative bg-linear-to-br from-indigo-900 to-primary rounded-[40px] p-12 md:p-24 text-center overflow-hidden border border-white/10 shadow-2xl">
            <div className="absolute -top-24 -right-24 w-96 h-96 bg-(--accent)/10 blur-[100px] rounded-full"></div>
            <div className="relative z-10">
              <h2 className="serif-heading text-4xl md:text-6xl font-bold text-white mb-8">
                Reprenez le contrôle de votre récit financier.
              </h2>
              <div className="flex flex-col sm:flex-row gap-6 justify-center">
                <Link href={user ? "/dashboard" : "/login"} className="px-12 py-5 bg-white text-primary font-bold rounded-2xl hover:bg-(--accent) transition-all inline-block">
                  Déployer NEWKOMERS
                </Link>
                <a href="#contact" className="px-12 py-5 glass-panel text-white font-bold rounded-2xl border border-white/10 hover:bg-white/5 transition-all inline-block">
                  Parler à un conseiller
                </a>
              </div>
              <div className="mt-12 flex items-center justify-center gap-8 opacity-40 text-xs font-semibold tracking-widest text-white uppercase flex-wrap">
                <span className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm">verified_user</span>
                  RGPD Compliant
                </span>
                <span className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm">encrypted</span>
                  AES-256 Encryption
                </span>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-primary border-t border-border pt-24 pb-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-16 mb-24">
            <div className="col-span-2">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-8 h-8 bg-(--accent) rounded-lg flex items-center justify-center">
                  <span className="material-symbols-outlined text-primary text-sm font-bold">query_stats</span>
                </div>
                <span className="text-xl font-bold tracking-tight text-white">NEWKOMERS</span>
              </div>
              <p className="text-(--text-muted) max-w-xs mb-8 leading-relaxed">
                Plateforme SaaS premium de pilotage financier, certifiée par les directions financières de groupes européens.
              </p>
              <p className="text-(--text-muted) text-xs flex items-center gap-2">
                <span className="material-symbols-outlined text-sm text-(--accent)">lock</span>
                Sécurisé par chiffrement AES-256
              </p>
            </div>
            <div>
              <h5 className="font-bold text-white mb-6 uppercase tracking-widest text-xs">Produit</h5>
              <ul className="space-y-4 text-sm text-(--text-muted)">
                <li><a className="hover:text-(--accent) transition-colors" href="#features">Consolidation</a></li>
                <li><a className="hover:text-(--accent) transition-colors" href="#features">Reporting Automatique</a></li>
                <li><a className="hover:text-(--accent) transition-colors" href="#features">Cash Burn Engine</a></li>
                <li><a className="hover:text-(--accent) transition-colors" href="#contact">Sécurité</a></li>
              </ul>
            </div>
            <div>
              <h5 className="font-bold text-white mb-6 uppercase tracking-widest text-xs">Légal</h5>
              <ul className="space-y-4 text-sm text-(--text-muted)">
                <li><a className="hover:text-(--accent) transition-colors" href="#">Confidentialité</a></li>
                <li><a className="hover:text-(--accent) transition-colors" href="#">Mentions Légales</a></li>
                <li><a className="hover:text-(--accent) transition-colors" href="#">CGU / CGV</a></li>
              </ul>
            </div>
            <div>
              <h5 className="font-bold text-white mb-6 uppercase tracking-widest text-xs">Support</h5>
              <ul className="space-y-4 text-sm text-(--text-muted)">
                <li><a className="hover:text-(--accent) transition-colors" href="#contact">Centre d&apos;aide</a></li>
                <li><a className="hover:text-(--accent) transition-colors" href="#">API Documentation</a></li>
                <li><a className="hover:text-(--accent) transition-colors" href="#contact">Contact</a></li>
              </ul>
            </div>
          </div>
          <div className="pt-12 border-t border-border flex flex-col md:flex-row justify-between items-center gap-8">
            <p className="text-(--text-muted) text-xs">
              © {new Date().getFullYear()} NEWKOMERS SAS. Made for high-performance finance teams.
            </p>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2 text-xs text-emerald-400">
                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></span>
                Systèmes Opérationnels
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

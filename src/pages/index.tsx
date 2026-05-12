import Head from "next/head";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { usePermissionsContext } from "@/permissions/PermissionsProvider";
import * as React from "react";

const DOCUMENTATION_URL = "https://new-komers-guide.vercel.app/";

export default function LandingPage() {
  const { user, logout } = usePermissionsContext();
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [navScrolled, setNavScrolled] = React.useState(false);
  const [contactSent, setContactSent] = React.useState(false);

  React.useEffect(() => {
    const onScroll = () => setNavScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  React.useEffect(() => {
    if (!mobileOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [mobileOpen]);

  return (
    <div className="landing force-dark min-h-screen selection:bg-(--accent)/20">
      <Head>
        <title>Newkomers — La clarté financière absolue pour les holdings &amp; groupes</title>
        <meta
          name="description"
          content="Newkomers est la plateforme financière de référence pour les holdings et groupes. Consolidation multi-filiale, projections, cash burn et bien plus."
        />
      </Head>

      <nav
        className={`fixed top-0 left-0 right-0 z-50 px-6 border-b transition-colors ${navScrolled ? "bg-black/90" : "bg-black/70"
          } backdrop-blur-xl border-white/10`}
        aria-label="Navigation"
      >
        <div className="mx-auto grid h-16 max-w-6xl grid-cols-[auto_1fr_auto] items-center gap-6">
          <a href="#hero" className="text-[15px] font-black tracking-[0.2em] text-white">
            NEWKOMERS
          </a>

          <ul className="hidden items-center justify-center gap-7 text-[13px] font-medium text-(--text-muted) md:flex">
            <li><a className="hover:text-(--accent) transition-colors" href="#hero">Accueil</a></li>
            <li><a className="hover:text-(--accent) transition-colors" href="#social-proof">Clientèle</a></li>
            <li><a className="hover:text-(--accent) transition-colors" href="#features">Solutions</a></li>
            <li><a className="hover:text-(--accent) transition-colors" href="#pricing">Tarification</a></li>
            <li><a className="hover:text-(--accent) transition-colors" href="#contact">Contact</a></li>
            {/* <li>
              <a
                className="inline-flex items-center gap-1 hover:text-(--accent) transition-colors"
                href={DOCUMENTATION_URL}
                target="_blank"
                rel="noopener noreferrer"
              >
                Documentation
                <ExternalLink className="h-3 w-3 shrink-0 opacity-70" aria-hidden />
              </a>
            </li> */}
          </ul>

          <div className="flex items-center justify-end gap-3">
            {user ? (
              <>
                <Link
                  className="hidden text-[13px] font-semibold text-(--text-muted) hover:text-white transition-colors sm:inline-flex"
                  href="/dashboard"
                >
                  Espace client
                </Link>
                <button
                  type="button"
                  onClick={() => logout()}
                  className="hidden rounded-full bg-white px-5 py-2 text-[13px] font-semibold text-black hover:bg-(--accent) transition-colors sm:inline-flex"
                >
                  Déconnexion
                </button>
                <button
                  type="button"
                  onClick={() => setMobileOpen((s) => !s)}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white md:hidden"
                  aria-label="Menu"
                  aria-expanded={mobileOpen}
                >
                  <span className="sr-only">Menu</span>
                  <div className="flex flex-col gap-1">
                    <span className="h-0.5 w-5 rounded bg-white/80" />
                    <span className="h-0.5 w-5 rounded bg-white/80" />
                    <span className="h-0.5 w-5 rounded bg-white/80" />
                  </div>
                </button>
              </>
            ) : (
              <>
                {/* <Link
                  className="hidden text-[13px] font-semibold text-(--text-muted) hover:text-white transition-colors sm:inline-flex"
                  href="/login"
                >
                  Se connecter
                </Link> */}
                <Link
                  className="hidden rounded-full border border-(--border-accent) px-5 py-2 text-[13px] font-semibold text-(--accent) hover:bg-(--accent) hover:text-black transition-colors sm:inline-flex"
                  href="/login"
                >
                  Se connecter
                </Link>
                <button
                  type="button"
                  onClick={() => setMobileOpen((s) => !s)}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white md:hidden"
                  aria-label="Menu"
                  aria-expanded={mobileOpen}
                >
                  <span className="sr-only">Menu</span>
                  <div className="flex flex-col gap-1">
                    <span className="h-0.5 w-5 rounded bg-white/80" />
                    <span className="h-0.5 w-5 rounded bg-white/80" />
                    <span className="h-0.5 w-5 rounded bg-white/80" />
                  </div>
                </button>
              </>
            )}
          </div>
        </div>

        {mobileOpen ? (
          <div className="md:hidden border-t border-white/10 py-5">
            <ul className="flex flex-col gap-4 text-sm text-(--text-muted)">
              <li><a className="hover:text-(--accent)" href="#hero" onClick={() => setMobileOpen(false)}>Accueil</a></li>
              <li><a className="hover:text-(--accent)" href="#social-proof" onClick={() => setMobileOpen(false)}>Clientèle</a></li>
              <li><a className="hover:text-(--accent)" href="#features" onClick={() => setMobileOpen(false)}>Solutions</a></li>
              <li><a className="hover:text-(--accent)" href="#pricing" onClick={() => setMobileOpen(false)}>Tarification</a></li>
              <li><a className="hover:text-(--accent)" href="#contact" onClick={() => setMobileOpen(false)}>Contact</a></li>
              <li>
                <a
                  className="inline-flex items-center gap-1.5 hover:text-(--accent)"
                  href={DOCUMENTATION_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setMobileOpen(false)}
                >
                  Documentation
                  <ExternalLink className="h-3.5 w-3.5 shrink-0 opacity-70" aria-hidden />
                </a>
              </li>
              <li className="pt-3">
                <Link
                  href={user ? "/dashboard" : "/login"}
                  className="inline-flex w-full items-center justify-center rounded-full bg-linear-to-br from-(--accent) to-[#8a6a32] px-5 py-2.5 text-[13px] font-semibold text-black"
                  onClick={() => setMobileOpen(false)}
                >
                  {user ? "Espace client" : "Se connecter"}
                </Link>
              </li>
            </ul>
          </div>
        ) : null}
      </nav>

      <main className="relative overflow-hidden">
        <section id="hero" className="relative min-h-screen px-6 pt-28 pb-20 text-center">
          <div className="pointer-events-none absolute -left-40 -top-20 h-[520px] w-[520px] rounded-full bg-[radial-gradient(circle,rgba(212,176,106,0.18)_0%,transparent_70%)] blur-[120px]" />
          <div className="pointer-events-none absolute -right-40 bottom-0 h-[460px] w-[460px] rounded-full bg-[radial-gradient(circle,rgba(34,197,94,0.08)_0%,transparent_70%)] blur-[120px]" />

          <div className="mx-auto max-w-4xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs text-(--text-muted)">
              <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.9)]" />
              Découvrez The Frontier AI
            </div>

            <h1 className="mt-7 text-balance text-[clamp(38px,6vw,68px)] font-black leading-[1.05] text-white">
              La clarté financière<br />
              <span className="bg-linear-to-r from-[#f0d060] via-(--accent) to-[#8a6a32] bg-clip-text text-transparent">
                absolue pour
              </span>
              <br />
              les holdings &amp; groupes.
            </h1>

            <p className="mx-auto mt-6 max-w-2xl text-[17px] leading-relaxed text-(--text-muted)">
              Consolidez, projetez et pilotez l&apos;ensemble de votre structure financière depuis une seule interface.
              Conçu pour les groupes qui exigent la performance.
            </p>

            <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <a
                href="#contact"
                className="inline-flex items-center justify-center rounded-full bg-linear-to-br from-(--accent) to-[#8a6a32] px-7 py-3 text-sm font-semibold text-black shadow-[0_8px_30px_rgba(212,176,106,0.25)] hover:translate-y-[-1px] transition"
              >
                Voir une démo
              </a>
              <a
                href="#contact"
                className="inline-flex items-center justify-center rounded-full border border-white/10 bg-white/0 px-7 py-3 text-sm font-semibold text-white backdrop-blur hover:border-(--border-accent) hover:text-(--accent) transition"
              >
                Parler à un expert
              </a>
            </div>

            {/* Dashboard mockup */}
            <div className="mt-14">
              <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#0e0e0e] shadow-[0_40px_80px_rgba(0,0,0,0.6)]">
                <div className="flex items-center gap-3 border-b border-white/10 bg-black/40 px-4 py-3">
                  <div className="flex gap-2">
                    <span className="h-3 w-3 rounded-full bg-[#ff5f57]" />
                    <span className="h-3 w-3 rounded-full bg-[#febc2e]" />
                    <span className="h-3 w-3 rounded-full bg-[#28c840]" />
                  </div>
                  <div className="flex-1 text-center text-[11px] text-(--text-dim)">
                    Newkomers — Tableau de bord
                  </div>
                </div>

                <div className="flex h-[220px]">
                  <div className="flex w-12 flex-col items-center gap-2 border-r border-white/10 bg-black/30 py-4">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-linear-to-br from-(--accent) to-[#8a6a32] text-[10px] font-black text-black">
                      NK
                    </div>
                    <div className="mt-1 flex flex-col gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-(--accent)/15 text-(--accent)">▣</div>
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg text-(--text-dim)">◈</div>
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg text-(--text-dim)">◎</div>
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg text-(--text-dim)">◑</div>
                    </div>
                  </div>

                  <div className="flex flex-1 flex-col gap-3 p-4 text-left">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[13px] font-semibold text-white">
                        Pilotez <span className="text-(--accent)">votre univers</span>
                      </span>
                      <span className="text-[11px] text-(--text-dim)">financier en temps réel.</span>
                      <span className="ml-auto rounded bg-(--accent) px-2 py-0.5 text-[9px] font-extrabold text-black">
                        LIVE
                      </span>
                    </div>

                    <div className="flex gap-2">
                      {[
                        { v: "13", l: "Entités" },
                        { v: "13", l: "Rapports" },
                        { v: "+8.4%", l: "Croissance", accent: true },
                        { v: "TST", l: "Groupe" },
                      ].map((k) => (
                        <div key={k.l} className="flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2">
                          <div className={`text-[16px] font-extrabold ${k.accent ? "text-emerald-400" : "text-white"}`}>{k.v}</div>
                          <div className="mt-0.5 text-[9px] uppercase tracking-wider text-(--text-dim)">{k.l}</div>
                        </div>
                      ))}
                    </div>

                    <div className="mt-1 flex flex-1 items-end gap-1.5">
                      {[40, 65, 45, 80, 70, 55, 90].map((h, idx) => (
                        <div
                          key={idx}
                          className={`w-full rounded-t ${idx === 4 ? "bg-linear-to-t from-[#8a6a32] to-(--accent)" : "bg-white/10"}`}
                          style={{ height: `${h}%` }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="social-proof" className="relative overflow-hidden py-20 text-center">
          <div className="mx-auto max-w-6xl px-6">
            <div className="inline-flex items-center rounded-full border border-(--border-accent) bg-(--accent)/10 px-4 py-1.5 text-[11px] font-semibold tracking-[0.25em] text-(--accent) uppercase">
              Ils nous font confiance
            </div>
            <h2 className="mt-6 text-balance text-[clamp(28px,4vw,42px)] font-extrabold leading-tight text-white">
              La plateforme choisie par les équipes finance<br />
              <span className="text-(--accent)">qui pilotent des groupes</span>
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-[16px] leading-relaxed text-(--text-muted)">
              Pensée pour les DAF et dirigeants qui veulent des chiffres fiables, en continu — sans friction, sans tableurs,
              sans zones grises.
            </p>

            <div className="relative mt-10 overflow-hidden">
              <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-32 bg-linear-to-r from-(--primary) to-transparent" />
              <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-32 bg-linear-to-l from-(--primary) to-transparent" />
              <div className="landing-marquee-track">
                <div className="flex items-center gap-16 px-10">
                  {["DBA", "air labs", "fintech", "Ar Pro Software", "◎ HCP", "LaCaisse", "FBD"].map((l) => (
                    <span key={`a-${l}`} className="whitespace-nowrap text-lg font-extrabold tracking-wider text-white/80 uppercase hover:text-(--accent) transition-colors">
                      {l}
                    </span>
                  ))}
                </div>
                <div className="flex items-center gap-16 px-10" aria-hidden>
                  {["DBA", "air labs", "fintech", "Ar Pro Software", "◎ HCP", "LaCaisse", "FBD"].map((l) => (
                    <span key={`b-${l}`} className="whitespace-nowrap text-lg font-extrabold tracking-wider text-white/80 uppercase hover:text-(--accent) transition-colors">
                      {l}
                    </span>
                  ))}
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

        <section id="contact" className="relative overflow-hidden py-24 px-6 text-center">
          <div className="pointer-events-none absolute left-1/2 top-0 h-[360px] w-[560px] -translate-x-1/2 rounded-full bg-[radial-gradient(ellipse,rgba(212,176,106,0.10)_0%,transparent_70%)] blur-[80px]" />
          <div className="mx-auto max-w-2xl">
            <div className="inline-flex items-center rounded-full border border-(--border-accent) bg-(--accent)/10 px-4 py-1.5 text-[11px] font-semibold tracking-[0.25em] text-(--accent) uppercase">
              Contact
            </div>
            <h2 className="mt-6 text-balance text-[clamp(28px,4vw,42px)] font-extrabold leading-tight text-white">
              Contactez nous via<br /><span className="text-(--accent)">ce formulaire</span>
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-[16px] leading-relaxed text-(--text-muted)">
              Remplissez ce formulaire et un expert Newkomers vous recontactera dans les 24 heures pour discuter de votre projet.
            </p>

            <form
              className="mt-10 text-left"
              onSubmit={(e) => {
                e.preventDefault();
                setContactSent(true);
                window.setTimeout(() => setContactSent(false), 4000);
              }}
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-2">
                  <label className="text-[13px] text-(--text-muted)" htmlFor="contact-fname">Prénom</label>
                  <input
                    id="contact-fname"
                    placeholder="Jean"
                    className="h-11 rounded-xl border border-white/10 bg-white/5 px-4 text-sm text-white placeholder:text-(--text-dim) focus:outline-none focus:ring-2 focus:ring-(--accent)/40"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-[13px] text-(--text-muted)" htmlFor="contact-lname">Nom</label>
                  <input
                    id="contact-lname"
                    placeholder="Dupont"
                    className="h-11 rounded-xl border border-white/10 bg-white/5 px-4 text-sm text-white placeholder:text-(--text-dim) focus:outline-none focus:ring-2 focus:ring-(--accent)/40"
                  />
                </div>
              </div>

              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-2">
                  <label className="text-[13px] text-(--text-muted)" htmlFor="contact-email">Email professionnel</label>
                  <input
                    id="contact-email"
                    type="email"
                    placeholder="jean@holding.fr"
                    className="h-11 rounded-xl border border-white/10 bg-white/5 px-4 text-sm text-white placeholder:text-(--text-dim) focus:outline-none focus:ring-2 focus:ring-(--accent)/40"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-[13px] text-(--text-muted)" htmlFor="contact-company">Société / Groupe</label>
                  <input
                    id="contact-company"
                    placeholder="Groupe XYZ"
                    className="h-11 rounded-xl border border-white/10 bg-white/5 px-4 text-sm text-white placeholder:text-(--text-dim) focus:outline-none focus:ring-2 focus:ring-(--accent)/40"
                  />
                </div>
              </div>

              <div className="mt-4 flex flex-col gap-2">
                <label className="text-[13px] text-(--text-muted)" htmlFor="contact-message">Votre message</label>
                <textarea
                  id="contact-message"
                  rows={4}
                  placeholder="Décrivez votre structure et vos besoins..."
                  className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-(--text-dim) focus:outline-none focus:ring-2 focus:ring-(--accent)/40"
                />
              </div>

              <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-start">
                <button
                  type="submit"
                  disabled={contactSent}
                  className={`inline-flex items-center justify-center rounded-full px-7 py-3 text-sm font-semibold transition ${contactSent
                      ? "bg-linear-to-br from-emerald-400 to-emerald-600 text-black"
                      : "bg-linear-to-br from-(--accent) to-[#8a6a32] text-black hover:translate-y-[-1px]"
                    } disabled:opacity-80`}
                >
                  {contactSent ? "✓ Demande envoyée !" : "Envoyer ma demande"}
                </button>
                <p className="text-[11px] leading-relaxed text-(--text-dim)">
                  * En soumettant ce formulaire, vous acceptez notre politique de confidentialité et notre utilisation éthique des données financières.
                </p>
              </div>
            </form>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/10 bg-black/70 px-6 py-14">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-10 md:grid-cols-[1fr_2fr]">
            <div>
              <div className="text-[15px] font-black tracking-[0.2em] text-white">NEWKOMERS</div>
              <p className="mt-4 max-w-xs text-[13px] leading-relaxed text-(--text-dim)">
                La plateforme financière de référence pour les holdings et groupes d&apos;entreprises exigeants.
              </p>
            </div>

            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <h4 className="text-xs font-bold tracking-widest text-(--text-muted) uppercase">Produit</h4>
                <ul className="mt-4 space-y-2 text-[13px] text-(--text-dim)">
                  <li><a className="hover:text-(--accent) transition-colors" href="#features">Fonctionnalités</a></li>
                  <li><a className="hover:text-(--accent) transition-colors" href="#pricing">Tarifs</a></li>
                  <li><a className="hover:text-(--accent) transition-colors" href="#hero">Roadmap</a></li>
                  <li><a className="hover:text-(--accent) transition-colors" href="#hero">Changelog</a></li>
                </ul>
              </div>
              <div>
                <h4 className="text-xs font-bold tracking-widest text-(--text-muted) uppercase">Société</h4>
                <ul className="mt-4 space-y-2 text-[13px] text-(--text-dim)">
                  <li><a className="hover:text-(--accent) transition-colors" href="#hero">À propos</a></li>
                  <li><a className="hover:text-(--accent) transition-colors" href="#hero">Blog</a></li>
                  <li><a className="hover:text-(--accent) transition-colors" href="#hero">Carrières</a></li>
                  <li><a className="hover:text-(--accent) transition-colors" href="#hero">Presse</a></li>
                </ul>
              </div>
              <div>
                <h4 className="text-xs font-bold tracking-widest text-(--text-muted) uppercase">Contact</h4>
                <ul className="mt-4 space-y-2 text-[13px] text-(--text-dim)">
                  <li><a className="hover:text-(--accent) transition-colors" href="#contact">Nous écrire</a></li>
                  <li><a className="hover:text-(--accent) transition-colors" href="#contact">Support</a></li>
                  <li><a className="hover:text-(--accent) transition-colors" href="#contact">Partenaires</a></li>
                  <li><a className="hover:text-(--accent) transition-colors" href="#contact">Démo</a></li>
                </ul>
              </div>
            </div>
          </div>

          <div className="mt-10 flex flex-col gap-4 border-t border-white/10 pt-6 text-xs text-(--text-dim) md:flex-row md:items-center md:justify-between">
            <span>© {new Date().getFullYear()} Newkomers. Tous droits réservés.</span>
            <div className="flex gap-6">
              <a className="hover:text-(--accent) transition-colors" href="#hero">Mentions légales</a>
              <a className="hover:text-(--accent) transition-colors" href="#hero">Confidentialité</a>
              <a className="hover:text-(--accent) transition-colors" href="#hero">CGU</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

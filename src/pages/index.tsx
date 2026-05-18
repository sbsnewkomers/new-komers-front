import Head from "next/head";
import Link from "next/link";
import { usePermissionsContext } from "@/permissions/PermissionsProvider";
import * as React from "react";

export default function LandingPage() {
  const { user, logout } = usePermissionsContext();
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [navScrolled, setNavScrolled] = React.useState(false);
  const [billingYearly, setBillingYearly] = React.useState(false);
  const [openFAQ, setOpenFAQ] = React.useState<number | null>(null);

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

  const faqItems = [
    {
      question: "À qui sert cette plateforme ?",
      answer:
        "Une plateforme financière qui vous aide à consolider, projeter et piloter votre structure en temps réel — que vous soyez une jeune holding en croissance, des directions financières multi-entités ou des grands groupes exigeants.",
    },
    {
      question: "Comment NEWKOMERS se connecte-t-il à nos outils comptables et ERP existants ?",
      answer:
        "NEWKOMERS s'intègre nativement avec les principaux logiciels comptables (Sage, Cegid, QuickBooks) et ERP du marché via notre API REST ou nos connecteurs natifs.",
    },
    {
      question: "Y a-t-il une limite au nombre de filiales ou de codes SIREN que l'on peut intégrer ?",
      answer:
        "Non, avec le plan Pro et Enterprise, vous pouvez intégrer un nombre illimité de filiales et de codes SIREN. Le plan Starter est limité à 5 SIRENs.",
    },
    {
      question: "Comment la plateforme gère-t-elle la sécurité et la confidentialité de nos données financières ?",
      answer:
        "Toutes les données sont chiffrées en AES-256, hébergées en France et conformes au RGPD. Nous offrons une authentification SAML/SSO pour les plans Enterprise.",
    },
    {
      question: "Est-il possible de simuler différents scénarios de trésorerie (What-If) pour le groupe ?",
      answer:
        "Oui, notre module de projection Cash Burn intègre des scénarios What-If multi-entités sur 12 mois, avec export PDF et Excel pour vos présentations.",
    },
  ];

  return (
    <div className="landing force-dark min-h-screen selection:bg-(--accent)/20">
      <Head>
        <title>NEWKOMERS — La Clarté Financière pour les Holdings &amp; Groupes</title>
        <meta
          name="description"
          content="Centralisez vos flux, automatisez vos consolidations et pilotez votre trésorerie multi-entités depuis une interface conçue pour la haute performance."
        />
      </Head>

      {/* ── Navigation ── */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 px-6 border-b transition-colors ${
          navScrolled ? "bg-black/90" : "bg-black/60"
        } backdrop-blur-xl border-white/10`}
        aria-label="Navigation"
      >
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-6">
          <a href="#hero" className="text-[15px] font-black tracking-[0.2em] text-white shrink-0">
            NEWKOMERS
          </a>

          <ul className="hidden items-center justify-center gap-8 text-[13px] font-medium text-(--text-muted) md:flex">
            <li>
              <a
                href="#hero"
                className="text-white border-b border-(--accent) pb-0.5 transition-colors"
              >
                Accueil
              </a>
            </li>
            <li>
              <a href="#features" className="hover:text-(--accent) transition-colors">
                Services
              </a>
            </li>
            <li>
              <a href="#pricing" className="hover:text-(--accent) transition-colors">
                Tarification
              </a>
            </li>
            <li>
              <a href="#about" className="hover:text-(--accent) transition-colors">
                About us
              </a>
            </li>
          </ul>

          <div className="flex items-center justify-end gap-3">
            {user ? (
              <>
                <Link
                  href="/dashboard"
                  className="hidden text-[13px] font-semibold text-(--text-muted) hover:text-white transition-colors sm:inline-flex"
                >
                  Espace client
                </Link>
                <button
                  type="button"
                  onClick={() => logout()}
                  className="hidden rounded-full bg-(--accent) px-5 py-2 text-[13px] font-semibold text-black hover:opacity-90 transition-opacity sm:inline-flex"
                >
                  Déconnexion
                </button>
              </>
            ) : (
              <Link
                href="/login"
                className="hidden rounded-full bg-(--accent) px-5 py-2 text-[13px] font-semibold text-black hover:opacity-90 transition-opacity sm:inline-flex"
              >
                Se connecter
              </Link>
            )}
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
          </div>
        </div>

        {mobileOpen ? (
          <div className="md:hidden border-t border-white/10 py-5">
            <ul className="flex flex-col gap-4 text-sm text-(--text-muted)">
              <li>
                <a href="#hero" onClick={() => setMobileOpen(false)} className="hover:text-(--accent)">
                  Accueil
                </a>
              </li>
              <li>
                <a href="#features" onClick={() => setMobileOpen(false)} className="hover:text-(--accent)">
                  Services
                </a>
              </li>
              <li>
                <a href="#pricing" onClick={() => setMobileOpen(false)} className="hover:text-(--accent)">
                  Tarification
                </a>
              </li>
              <li>
                <a href="#about" onClick={() => setMobileOpen(false)} className="hover:text-(--accent)">
                  About us
                </a>
              </li>
              <li className="pt-3">
                <Link
                  href={user ? "/dashboard" : "/login"}
                  onClick={() => setMobileOpen(false)}
                  className="inline-flex w-full items-center justify-center rounded-full bg-(--accent) px-5 py-2.5 text-[13px] font-semibold text-black"
                >
                  {user ? "Espace client" : "Se connecter"}
                </Link>
              </li>
            </ul>
          </div>
        ) : null}
      </nav>

      <main className="relative overflow-hidden">
        {/* ── Hero ── */}
        <section
          id="hero"
          className="relative flex min-h-screen flex-col items-center justify-center px-6 pt-24 pb-20 text-center"
        >
          <div className="pointer-events-none absolute -left-40 top-0 h-[600px] w-[600px] rounded-full bg-[radial-gradient(circle,rgba(212,176,106,0.18)_0%,transparent_70%)] blur-[120px]" />
          <div className="pointer-events-none absolute -right-40 bottom-0 h-[500px] w-[500px] rounded-full bg-[radial-gradient(circle,rgba(212,176,106,0.12)_0%,transparent_70%)] blur-[140px]" />

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

            <h1 className="text-balance text-[clamp(38px,5.5vw,72px)] font-black leading-[1.08] text-white">
              La Clarté <span className="text-(--accent)">Financière</span> pour
              <br />
              Les Holdings &amp; <span className="text-(--accent)">Groupes</span>&nbsp;.
            </h1>

            <p className="mx-auto mt-6 max-w-2xl text-[16px] leading-relaxed text-(--text-muted)">
              Centralisez vos flux, automatisez vos consolidations et pilotez votre trésorerie multi-entités depuis
              une interface conçue pour la haute performance.
            </p>

            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <a
                href="#pricing"
                className="inline-flex items-center justify-center rounded-full bg-(--accent) px-8 py-3.5 text-sm font-semibold text-black shadow-[0_8px_30px_rgba(212,176,106,0.3)] hover:opacity-90 transition-opacity"
              >
                Voir la démo
              </a>
              <a
                href="#features"
                className="inline-flex items-center justify-center rounded-full border border-white/20 px-8 py-3.5 text-sm font-semibold text-white hover:border-(--border-accent) hover:text-(--accent) transition-colors"
              >
                Voir les détails
              </a>
            </div>
          </div>
        </section>

        {/* ── Quick stats ── */}
        <section className="border-y border-white/5 py-16 px-6">
          <div className="mx-auto max-w-3xl">
            <div className="grid grid-cols-3 gap-8 text-center">
              {[
                { value: "100+", label: "Clients" },
                { value: "50+", label: "Projects" },
                { value: "42+", label: "5-Star Reviews" },
              ].map((s) => (
                <div key={s.label}>
                  <div className="text-[clamp(32px,4vw,52px)] font-black text-(--accent)">{s.value}</div>
                  <div className="mt-1 text-[14px] text-(--text-muted)">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Features ── */}
        <section id="features" className="py-24 px-6">
          <div className="mx-auto max-w-6xl">
            <div className="mb-12 grid lg:grid-cols-2 gap-12 items-start">
              <div>
                <h2 className="text-[clamp(30px,4vw,52px)] font-black leading-tight text-white">
                  Précision Chirurgicale
                  <br />
                  pour <span className="text-(--accent)">Votre Groupe</span>.
                </h2>
                <p className="mt-4 max-w-md text-[15px] leading-relaxed text-(--text-muted)">
                  Plus qu&apos;un simple dashboard, NEWKOMERS est le copilot de votre direction financière.
                </p>
              </div>

              {/* Geometric wireframe icon */}
              <div className="hidden lg:flex items-center justify-center">
                <svg
                  width="160"
                  height="160"
                  viewBox="0 0 160 160"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="opacity-50"
                  aria-hidden
                >
                  <circle cx="80" cy="80" r="72" stroke="rgba(212,176,106,0.35)" strokeWidth="1" />
                  <polygon
                    points="80,12 143,48 143,112 80,148 17,112 17,48"
                    stroke="rgba(212,176,106,0.45)"
                    strokeWidth="1"
                    fill="none"
                  />
                  <line x1="80" y1="12" x2="80" y2="80" stroke="rgba(212,176,106,0.25)" strokeWidth="1" />
                  <line x1="143" y1="48" x2="80" y2="80" stroke="rgba(212,176,106,0.25)" strokeWidth="1" />
                  <line x1="143" y1="112" x2="80" y2="80" stroke="rgba(212,176,106,0.25)" strokeWidth="1" />
                  <line x1="80" y1="148" x2="80" y2="80" stroke="rgba(212,176,106,0.25)" strokeWidth="1" />
                  <line x1="17" y1="112" x2="80" y2="80" stroke="rgba(212,176,106,0.25)" strokeWidth="1" />
                  <line x1="17" y1="48" x2="80" y2="80" stroke="rgba(212,176,106,0.25)" strokeWidth="1" />
                  <circle cx="80" cy="80" r="4" fill="rgba(212,176,106,0.6)" />
                </svg>
              </div>
            </div>

            {/* 2×2 feature cards */}
            <div className="grid sm:grid-cols-2 gap-4">
              {[
                {
                  title: "Projection & Cash Burn",
                  desc: "Anticipez vos besoins de financement à 12, 24 ou 36 mois. Nos modèles prédictifs intègrent vos saisonnalités et vos charges structurelles.",
                },
                {
                  title: "Consolidation de Données Multi-SIREN",
                  desc: "Gérez un nombre illimité d'entités juridiques sans effort. Notre moteur d'agrégation synchronise vos balances générales en temps réel via API.",
                },
                {
                  title: "Analyse et Métriques Extracomptables",
                  desc: "Dépassez le cadre de la comptabilité traditionnelle en enrichissant vos analyses financières avec des données opérationnelles pour une vision stratégique globale de votre groupe.",
                },
                {
                  title: "Journal d'Audit",
                  desc: "Garantissez une transparence totale et une fiabilité chirurgicale de vos chiffres grâce à notre journal d'audit immutable.",
                },
              ].map((feature) => (
                <div
                  key={feature.title}
                  className="group relative rounded-2xl border border-white/10 bg-white/[0.03] p-6 transition-colors hover:border-(--border-accent)/50"
                >
                  <div className="absolute right-5 top-5 flex h-8 w-8 items-center justify-center rounded-full border border-(--accent)/30 bg-(--accent)/10 text-[14px] text-(--accent) transition-colors group-hover:bg-(--accent)/20">
                    →
                  </div>
                  <h3 className="mb-3 pr-10 text-[15px] font-bold text-white">{feature.title}</h3>
                  <p className="text-[13px] leading-relaxed text-(--text-muted)">{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Quote ── */}
        <section id="about" className="border-y border-white/5 bg-white/[0.02] py-20 px-6">
          <div className="mx-auto max-w-4xl text-center">
            <p className="text-[clamp(15px,2vw,20px)] italic leading-relaxed text-(--text-muted)">
              &ldquo;Que vous pilotiez des holdings en pleine croissance, des directions financières multi-entités ou
              des groupes d&apos;entreprises exigeants, notre plateforme automatisée est conçue pour donner une clarté
              absolue à votre structure — de manière fiable, précise et instantanée. Et les résultats ? Les chiffres
              parlent d&apos;eux-mêmes :&rdquo;
            </p>
          </div>
        </section>

        {/* ── Company stats ── */}
        <section className="py-24 px-6">
          <div className="mx-auto max-w-6xl">
            <div className="grid grid-cols-2 gap-10 lg:grid-cols-4">
              {[
                { value: "2026", label: "Année de création", sub: "Lancé au marché en novembre" },
                { value: "42", label: "Les clients sont satisfaits", sub: "Que peu nous donnent moins" },
                { value: "50", label: "Les projets sont lancés", sub: "En cours de déploiement" },
                { value: "10", label: "Projets en cours", sub: "En développement actif" },
              ].map((stat) => (
                <div key={stat.value} className="text-center">
                  <div className="text-[clamp(36px,5vw,60px)] font-black text-white">{stat.value}</div>
                  <div className="mt-2 text-[13px] font-semibold text-white/70">{stat.label}</div>
                  <div className="mt-1 text-[11px] text-(--text-dim)">{stat.sub}</div>
                  <div className="mt-3 flex justify-center -space-x-1.5" aria-hidden>
                    {[0, 1, 2].map((i) => (
                      <div
                        key={i}
                        className="h-6 w-6 rounded-full border border-black/40"
                        style={{ background: `hsl(${35 + i * 15}, 55%, ${28 + i * 10}%)` }}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-16 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <a
                href="#pricing"
                className="inline-flex items-center gap-2 rounded-full bg-(--accent) px-8 py-3.5 text-sm font-semibold text-black hover:opacity-90 transition-opacity"
              >
                Voir la démo →
              </a>
              <a
                href="#features"
                className="text-[13px] text-(--text-muted) hover:text-(--accent) transition-colors"
              >
                Voir nos qualités →
              </a>
            </div>
          </div>
        </section>

        {/* ── Pricing ── */}
        <section id="pricing" className="py-24 px-6">
          <div className="mx-auto max-w-6xl">
            <div className="mb-14 text-center">
              <h2 className="text-[clamp(30px,4vw,52px)] font-black leading-tight text-white">
                Choisissez le Plan qui
                <br />
                Vous Convient
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-[15px] leading-relaxed text-(--text-muted)">
                Vous donnez accès aux fonctionnalités essentielles et à plus de 1000 outils créatifs. Passez du Pro
                pour débloquer des capacités d&apos;IA puissantes, la synchronisation dans le cloud et un tout
                nouveau niveau de liberté créative.
              </p>

              {/* Billing toggle */}
              <div className="mt-8 inline-flex items-center rounded-full border border-white/10 bg-white/5 p-1">
                <button
                  type="button"
                  onClick={() => setBillingYearly(false)}
                  className={`rounded-full px-5 py-2 text-[13px] font-semibold transition-colors ${
                    !billingYearly ? "bg-(--accent) text-black" : "text-(--text-muted) hover:text-white"
                  }`}
                >
                  Monthly
                </button>
                <button
                  type="button"
                  onClick={() => setBillingYearly(true)}
                  className={`rounded-full px-5 py-2 text-[13px] font-semibold transition-colors ${
                    billingYearly ? "bg-(--accent) text-black" : "text-(--text-muted) hover:text-white"
                  }`}
                >
                  Yearly
                </button>
              </div>
            </div>

            <div className="grid items-start gap-6 lg:grid-cols-3">
              {/* Starter */}
              <div className="flex flex-col rounded-2xl border border-white/10 bg-white/[0.03] p-8">
                <div className="mb-8">
                  <p className="mb-1 text-[12px] text-(--text-dim)">Pour les groupes en croissance</p>
                  <h4 className="mb-4 text-[18px] font-bold text-white">Starter</h4>
                  <div className="flex items-baseline gap-1">
                    <span className="text-[40px] font-black text-white">
                      {billingYearly ? "$4 704" : "$490"}
                    </span>
                    <span className="text-sm text-(--text-muted)">/{billingYearly ? "an" : "month"}</span>
                  </div>
                </div>
                <ul className="mb-8 flex-1 space-y-3 text-[13px]">
                  {[
                    "Jusqu'à 5 SIREN liées",
                    "Consolidation basique quotidienne",
                    "Reporting standard (P&L, Bilan)",
                    "Limited customization options",
                  ].map((f) => (
                    <li key={f} className="flex items-center gap-2.5 text-white/70">
                      <svg className="h-4 w-4 shrink-0 text-(--accent)" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/login"
                  className="block w-full rounded-xl border border-white/15 py-3 text-center text-[13px] font-semibold text-white transition-all hover:bg-white/5"
                >
                  Subscribe &rsaquo;
                </Link>
              </div>

              {/* Pro — highlighted */}
              <div className="relative flex flex-col rounded-2xl border-2 border-(--accent)/60 bg-white/[0.06] p-8 shadow-[0_0_50px_rgba(212,176,106,0.12)]">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="rounded-full bg-(--accent) px-3 py-1 text-[10px] font-black uppercase tracking-wider text-black">
                    NEW
                  </span>
                </div>
                <div className="mb-8">
                  <p className="mb-1 text-[12px] text-(--text-dim)">La puissance de la consolidation automatique.</p>
                  <h4 className="mb-4 text-[18px] font-bold text-white">Pro</h4>
                  <div className="flex items-baseline gap-2">
                    <span className="text-[40px] font-black text-white">
                      {billingYearly ? "$12 384" : "$1290"}
                    </span>
                    <span className="text-sm text-(--text-muted)">/{billingYearly ? "an" : "month"}</span>
                    <span className="rounded bg-(--accent) px-1.5 py-0.5 text-[9px] font-black text-black">NEW</span>
                  </div>
                </div>
                <ul className="mb-8 flex-1 space-y-3 text-[13px]">
                  {[
                    "SIREN illimitées",
                    "Consolidation automatique",
                    "Module de projection cash (12 mois)",
                    "Outils de l'IA",
                    "Expert-format Expert-Comptable",
                  ].map((f) => (
                    <li key={f} className="flex items-center gap-2.5 text-white/80">
                      <svg className="h-4 w-4 shrink-0 text-(--accent)" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/login"
                  className="block w-full rounded-xl bg-(--accent) py-3 text-center text-[13px] font-bold text-black transition-all hover:opacity-90"
                >
                  Subscribe &rsaquo;
                </Link>
              </div>

              {/* Enterprise */}
              <div className="flex flex-col rounded-2xl border border-white/10 bg-white/[0.03] p-8">
                <div className="mb-8">
                  <p className="mb-1 text-[12px] text-(--text-dim)">Pour les ETI et directions financières exigeantes.</p>
                  <h4 className="mb-4 text-[18px] font-bold text-white">Enterprise</h4>
                  <div className="flex items-baseline gap-1">
                    <span className="text-[36px] font-black text-white">Sur devis</span>
                  </div>
                </div>
                <ul className="mb-8 flex-1 space-y-3 text-[13px]">
                  {[
                    "Tout le plan Business",
                    "Accès API complet (REST)",
                    "Key Account Manager dédié",
                    "ISO / SAML enforcement",
                  ].map((f) => (
                    <li key={f} className="flex items-center gap-2.5 text-white/70">
                      <svg className="h-4 w-4 shrink-0 text-(--accent)" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      {f}
                    </li>
                  ))}
                </ul>
                <a
                  href="#faq"
                  className="block w-full rounded-xl border border-white/15 py-3 text-center text-[13px] font-semibold text-white transition-all hover:bg-white/5"
                >
                  Subscribe &rsaquo;
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* ── FAQ ── */}
        <section id="faq" className="py-24 px-6">
          <div className="mx-auto max-w-3xl">
            <div className="mb-14 text-center">
              <h2 className="text-[clamp(30px,4vw,52px)] font-black leading-tight text-white">
                Questions souvent
                <br />
                posées
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-[15px] leading-relaxed text-(--text-muted)">
                Une question ? Nous avons les réponses. Découvrez tout ce que vous devez savoir sur notre plateforme
                de pilotage, nos abonnements et nos fonctionnalités de consolidation financière.
              </p>
            </div>

            <div className="space-y-3">
              {faqItems.map((item, idx) => (
                <div
                  key={idx}
                  className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02]"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFAQ(openFAQ === idx ? null : idx)}
                    className="flex w-full items-center justify-between px-6 py-5 text-left text-[14px] font-semibold text-white transition-colors hover:text-(--accent)"
                    aria-expanded={openFAQ === idx}
                  >
                    <span>{item.question}</span>
                    <svg
                      className={`h-5 w-5 shrink-0 text-(--text-muted) transition-transform ${openFAQ === idx ? "rotate-180" : ""}`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                      aria-hidden
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {openFAQ === idx ? (
                    <div className="px-6 pb-5 text-[13px] leading-relaxed text-(--text-muted)">
                      {item.answer}
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA banner ── */}
        <section className="relative py-24 px-6 text-center">
          <div className="pointer-events-none absolute left-1/2 top-1/2 h-[400px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(ellipse,rgba(212,176,106,0.09)_0%,transparent_70%)] blur-[80px]" />
          <div className="relative z-10 mx-auto max-w-3xl">
            <h2 className="text-[clamp(30px,4vw,52px)] font-black leading-tight text-white">
              Prêt à piloter votre structure?
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-[15px] leading-relaxed text-(--text-muted)">
              Que vous soyez une holding en croissance, une direction financière multi-entités ou un grand groupe —
              notre cockpit s&apos;adapte à votre écosystème.
            </p>
            <div className="mt-10">
              <a
                href="#pricing"
                className="inline-flex items-center gap-2 rounded-full bg-(--accent) px-10 py-4 text-sm font-bold text-black shadow-[0_8px_40px_rgba(212,176,106,0.3)] hover:opacity-90 transition-opacity"
              >
                Voir la démo →
              </a>
            </div>
          </div>
        </section>
      </main>

      {/* ── Footer ── */}
      <footer className="border-t border-white/10 bg-black/60 px-6 py-14">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-10 md:grid-cols-[1.6fr_1fr_1fr_1fr]">
            <div>
              <div className="text-[15px] font-black tracking-[0.2em] text-white">NEWKOMERS</div>
              <p className="mt-4 max-w-xs text-[13px] leading-relaxed text-(--text-dim)">
                Une plateforme financière qui vous aide à consolider, projeter et piloter votre structure en temps
                réel — que vous soyez une jeune holding en croissance, des directions financières multi-entités ou
                des grands groupes exigeants.
              </p>
            </div>

            <div>
              <h4 className="text-xs font-bold uppercase tracking-widest text-white">Produit</h4>
              <ul className="mt-4 space-y-2.5 text-[13px] text-(--text-dim)">
                <li><a href="#features" className="hover:text-(--accent) transition-colors">Consolidation</a></li>
                <li><a href="#features" className="hover:text-(--accent) transition-colors">Reporting Automatique</a></li>
                <li><a href="#features" className="hover:text-(--accent) transition-colors">Cash-Burn Engine</a></li>
                <li><a href="#hero" className="hover:text-(--accent) transition-colors">Sécurité</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-xs font-bold uppercase tracking-widest text-white">Légal</h4>
              <ul className="mt-4 space-y-2.5 text-[13px] text-(--text-dim)">
                <li><a href="#hero" className="hover:text-(--accent) transition-colors">Confidentialité</a></li>
                <li><a href="#hero" className="hover:text-(--accent) transition-colors">Mentions Légales</a></li>
                <li><a href="#hero" className="hover:text-(--accent) transition-colors">CGU-CGV</a></li>
                <li><a href="#faq" className="hover:text-(--accent) transition-colors">Contact Us</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-xs font-bold uppercase tracking-widest text-white">Support</h4>
              <ul className="mt-4 space-y-2.5 text-[13px] text-(--text-dim)">
                <li><a href="#faq" className="hover:text-(--accent) transition-colors">Centre d&apos;aide</a></li>
                <li><a href="#hero" className="hover:text-(--accent) transition-colors">API Documentation</a></li>
                <li><a href="#faq" className="hover:text-(--accent) transition-colors">Contact</a></li>
              </ul>
            </div>
          </div>

          <div className="mt-10 flex flex-col gap-4 border-t border-white/10 pt-6 text-xs text-(--text-dim) md:flex-row md:items-center md:justify-between">
            <span>© 2026 Newkomers. Tous droits réservés.</span>
            <div className="flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 px-3 py-1 text-[10px]">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" aria-hidden />
                SÉCURITÉ PAR CHIFFREMENT AES-256
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 px-3 py-1 text-[10px]">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" aria-hidden />
                Système Opérationnel
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

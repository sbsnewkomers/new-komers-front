'use client';

import React from 'react';
import { useRouter } from 'next/router';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/patterns/PageHeader';
import { ArrowRight, FileText, BarChart3 } from 'lucide-react';

export default function DotationsPage() {
  const router = useRouter();

  const handleModeDetailed = () => {
    router.push('/dotations/assets');
  };

  const handleModeGlobal = () => {
    router.push('/dotations/global');
  };

  return (
    <AppLayout title="Gestion des Dotations">
      <div className="space-y-6">

        <PageHeader
          title="Gestion des dotations"
          subtitle="Suivez et gérez tous vos dotations et amortissements."
          icon={
            <div className="nebula-glass rounded-2xl border border-white/10 p-2.5">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="lucide lucide-dollar-sign h-5 w-5 text-(--nebula-gold-light)"
                aria-hidden="true"
              >
                <line x1="12" y1="1" x2="12" y2="23"></line>
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
              </svg>
            </div>
          }
        />

        {/* Mode Selection Cards */}
        <div className="nebula-glass rounded-3xl border border-white/10 p-6">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-(--nebula-muted)">
            § Choix de mode
          </p>
          <h3 className="mt-2 text-lg font-semibold text-white">
            Choisissez un mode de gestion
          </h3>
          <p className="mt-1 text-sm text-(--nebula-muted)">
            Sélectionnez le mode qui correspond le mieux à votre besoin pour gérer
            vos dotations et amortissements.
          </p>

          <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
            {/* Mode Détaillé */}
            <button
              type="button"
              onClick={handleModeDetailed}
              className="group flex h-full flex-col rounded-3xl border border-white/10 bg-white/5 p-5 text-left transition-all hover:border-white/20 hover:bg-white/10"
            >
              <div className="flex items-start justify-between">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/5">
                  <FileText className="h-5 w-5 text-(--nebula-gold-light)" />
                </div>
                <span className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-(--nebula-muted)">
                  Détaillé
                </span>
              </div>

              <div className="mt-4 flex-1">
                <h4 className="text-sm font-semibold text-white">Mode Détaillé</h4>
                <p className="mt-0.5 text-xs font-medium text-(--nebula-muted)">
                  Gestion individuelle des actifs
                </p>
                <p className="mt-2 text-xs leading-relaxed text-(--nebula-muted)">
                  Gérez chaque actif individuellement avec ses caractéristiques propres,
                  ses plans d&apos;amortissement et son suivi détaillé.
                </p>
              </div>

              <div className="mt-4 flex items-center gap-1.5 text-xs font-medium text-(--nebula-gold-light) transition-colors group-hover:text-[var(--foreground)]">
                Accéder au Mode Détaillé
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
              </div>
            </button>

            {/* Mode Global */}
            <button
              type="button"
              onClick={handleModeGlobal}
              className="group flex h-full flex-col rounded-3xl border border-white/10 bg-white/5 p-5 text-left transition-all hover:border-white/20 hover:bg-white/10"
            >
              <div className="flex items-start justify-between">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/5">
                  <BarChart3 className="h-5 w-5 text-(--nebula-gold-light)" />
                </div>
                <span className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-(--nebula-muted)">
                  Global
                </span>
              </div>

              <div className="mt-4 flex-1">
                <h4 className="text-sm font-semibold text-white">Mode Global</h4>
                <p className="mt-0.5 text-xs font-medium text-(--nebula-muted)">
                  Gestion simplifiée
                </p>
                <p className="mt-2 text-xs leading-relaxed text-(--nebula-muted)">
                  Saisissez directement les montants globaux des dotations par année,
                  tel qu&apos;ils apparaissent dans vos documents comptables.
                </p>
              </div>

              <div className="mt-4 flex items-center gap-1.5 text-xs font-medium text-(--nebula-gold-light) transition-colors group-hover:text-[var(--foreground)]">
                Accéder au Mode Global
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
              </div>
            </button>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

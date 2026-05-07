'use client';

import React from 'react';
import { useRouter } from 'next/router';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/Button';
import { ArrowRight, Calculator, List, TrendingUp } from 'lucide-react';

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

        {/* Header */}
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="rounded-xl bg-white/10 p-2.5">
              <Calculator className="h-5 w-5 text-(--nebula-gold-light)" aria-hidden />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Gestion des dotations</h2>
              <p className="text-sm text-(--nebula-muted)">Choisissez votre mode de gestion des amortissements</p>
            </div>
          </div>
        </div>

        {/* Mode Selection Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-6xl mx-auto">

          {/* Mode Détaillé */}
          <div className="nebula-glass rounded-3xl border border-white/10 overflow-hidden transition-colors duration-300 hover:border-white/20 group">
            <div className="p-6">
              <div className="flex items-start gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl border border-white/10 bg-white/5 flex items-center justify-center transition-transform duration-300 group-hover:scale-105">
                  <List className="h-6 w-6 text-(--nebula-gold-light)" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-white mb-1">Mode Détaillé</h3>
                  <p className="text-(--nebula-muted) text-sm font-medium">Gestion individuelle des actifs</p>
                </div>
              </div>

              <div className="mb-4">
                <p className="text-white/90 leading-relaxed text-sm mb-4">
                  Gérez chaque actif individuellement avec ses caractéristiques propres,
                  ses plans d&apos;amortissement et son suivi détaillé.
                </p>

                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <h4 className="font-semibold text-white mb-3 flex items-center gap-2 text-base">
                    <div className="w-6 h-6 rounded-lg border border-white/10 bg-white/10 flex items-center justify-center">
                      <TrendingUp className="h-3 w-3 text-(--nebula-gold-light)" />
                    </div>
                    Fonctionnalités clés
                  </h4>
                  <div className="grid gap-2">
                    {[
                      { title: 'Détail par actif', sub: 'Nom, montant, durée et caractéristiques' },
                      { title: 'Plans personnalisés', sub: 'Amortissements individuels par bien' },
                      { title: 'Méthodes flexibles', sub: 'Linéaire, dégressif et personnalisé' },
                      { title: 'Suivi précis', sub: 'Historique et état de chaque bien' },
                    ].map((item) => (
                      <div key={item.title} className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full flex-shrink-0 mt-0.5 bg-(--nebula-gold-light)" />
                        <div>
                          <div className="font-medium text-white text-sm">{item.title}</div>
                          <div className="text-xs text-(--nebula-muted)">{item.sub}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <Button
                onClick={handleModeDetailed}
                className="w-full"
                size="lg"
              >
                Accéder au Mode Détaillé
                <ArrowRight className="h-4 w-4 ml-auto group-hover:translate-x-1 transition-transform duration-300" />
              </Button>
            </div>
          </div>

          {/* Mode Global */}
          <div className="nebula-glass rounded-3xl border border-white/10 overflow-hidden transition-colors duration-300 hover:border-emerald-400/20 group">
            <div className="p-6">
              <div className="flex items-start gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl border border-emerald-400/25 bg-emerald-500/10 flex items-center justify-center transition-transform duration-300 group-hover:scale-105">
                  <Calculator className="h-6 w-6 text-emerald-200" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-white mb-1">Mode Global</h3>
                  <p className="text-(--nebula-muted) text-sm font-medium">Gestion simplifiée</p>
                </div>
              </div>

              <div className="mb-4">
                <p className="text-white/90 leading-relaxed text-sm mb-4">
                  Saisissez directement les montants globaux des dotations par année,
                  tel qu&apos;ils apparaissent dans vos documents comptables.
                </p>

                <div className="rounded-2xl border border-emerald-400/20 bg-emerald-500/5 p-4">
                  <h4 className="font-semibold text-white mb-3 flex items-center gap-2 text-base">
                    <div className="w-6 h-6 rounded-lg border border-emerald-400/30 bg-emerald-500/15 flex items-center justify-center">
                      <TrendingUp className="h-3 w-3 text-emerald-200" />
                    </div>
                    Fonctionnalités clés
                  </h4>
                  <div className="grid gap-2">
                    {[
                      { title: 'Montants globaux', sub: 'Saisie annuelle simplifiée' },
                      { title: 'Répartition automatique', sub: 'Calcul mensuel automatique' },
                      { title: 'Vue d\'ensemble', sub: 'Synthèse rapide et claire' },
                      { title: 'Reporting direct', sub: 'Export comptable immédiat' },
                    ].map((item) => (
                      <div key={item.title} className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full flex-shrink-0 mt-0.5 bg-emerald-300/80" />
                        <div>
                          <div className="font-medium text-white text-sm">{item.title}</div>
                          <div className="text-xs text-(--nebula-muted)">{item.sub}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <Button
                onClick={handleModeGlobal}
                className="w-full"
                size="lg"
              >
                Accéder au Mode Global
                <ArrowRight className="h-4 w-4 ml-auto group-hover:translate-x-1 transition-transform duration-300" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

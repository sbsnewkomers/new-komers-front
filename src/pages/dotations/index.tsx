'use client';

import React from 'react';
import { useRouter } from 'next/router';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/Button';
import { ArrowRight, Building, Calculator, List, TrendingUp } from 'lucide-react';

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
            <div className="rounded-xl bg-primary/10 p-2.5">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-calculator h-5 w-5 text-primary" aria-hidden="true">
                <rect width="18" height="12" x="3" y="8" rx="2"></rect>
                <path d="M8 8V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v4"></path>
                <path d="M12 4v.01"></path>
                <rect x="8" y="12" width="8" height="4" rx="1"></rect>
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold text-primary">Gestion des dotations</h2>
              <p className="text-sm text-slate-500">Choisissez votre mode de gestion des amortissements</p>
            </div>
          </div>
        </div>

        {/* Mode Selection Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-6xl mx-auto">

          {/* Mode Détaillé */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 hover:shadow-lg transition-all duration-300 overflow-hidden group">
            <div className="p-6">
              {/* Header Card */}
              <div className="flex items-start gap-3 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
                  <List className="h-6 w-6 text-blue-700" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-slate-900 mb-1">Mode Détaillé</h3>
                  <p className="text-slate-600 text-sm font-medium">Gestion individuelle des actifs</p>
                </div>
              </div>

              {/* Description */}
              <div className="mb-4">
                <p className="text-slate-700 leading-relaxed text-sm mb-4">
                  Gérez chaque actif individuellement avec ses caractéristiques propres,
                  ses plans d&apos;amortissement et son suivi détaillé.
                </p>

                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100">
                  <h4 className="font-semibold text-slate-900 mb-3 flex items-center gap-2 text-base">
                    <div className="w-6 h-6 bg-blue-600 rounded-lg flex items-center justify-center">
                      <TrendingUp className="h-3 w-3 text-white" />
                    </div>
                    Fonctionnalités clés
                  </h4>
                  <div className="grid gap-2">
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-blue-600 rounded-full flex-shrink-0 mt-0.5"></div>
                      <div>
                        <div className="font-medium text-slate-800 text-sm">Détail par actif</div>
                        <div className="text-xs text-slate-600">Nom, montant, durée et caractéristiques</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-blue-600 rounded-full flex-shrink-0 mt-0.5"></div>
                      <div>
                        <div className="font-medium text-slate-800 text-sm">Plans personnalisés</div>
                        <div className="text-xs text-slate-600">Amortissements individuels par bien</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-blue-600 rounded-full flex-shrink-0 mt-0.5"></div>
                      <div>
                        <div className="font-medium text-slate-800 text-sm">Méthodes flexibles</div>
                        <div className="text-xs text-slate-600">Linéaire, dégressif et personnalisé</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-blue-600 rounded-full flex-shrink-0 mt-0.5"></div>
                      <div>
                        <div className="font-medium text-slate-800 text-sm">Suivi précis</div>
                        <div className="text-xs text-slate-600">Historique et état de chaque bien</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <Button
                onClick={handleModeDetailed}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-md hover:shadow-lg transition-all duration-300 py-3 text-sm font-semibold"
                size="lg"
              >
                Accéder au Mode Détaillé
                <ArrowRight className="h-4 w-4 ml-auto group-hover:translate-x-1 transition-transform duration-300" />
              </Button>
            </div>
          </div>

          {/* Mode Global */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 hover:shadow-lg transition-all duration-300 overflow-hidden group">
            <div className="p-6">
              {/* Header Card */}
              <div className="flex items-start gap-3 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
                  <Calculator className="h-6 w-6 text-emerald-700" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-slate-900 mb-1">Mode Global</h3>
                  <p className="text-slate-600 text-sm font-medium">Gestion simplifiée</p>
                </div>
              </div>

              {/* Description */}
              <div className="mb-4">
                <p className="text-slate-700 leading-relaxed text-sm mb-4">
                  Saisissez directement les montants globaux des dotations par année,
                  tel qu&apos;ils apparaissent dans vos documents comptables.
                </p>

                <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-xl p-4 border border-emerald-100">
                  <h4 className="font-semibold text-slate-900 mb-3 flex items-center gap-2 text-base">
                    <div className="w-6 h-6 bg-emerald-600 rounded-lg flex items-center justify-center">
                      <TrendingUp className="h-3 w-3 text-white" />
                    </div>
                    Fonctionnalités clés
                  </h4>
                  <div className="grid gap-2">
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-emerald-600 rounded-full flex-shrink-0 mt-0.5"></div>
                      <div>
                        <div className="font-medium text-slate-800 text-sm">Montants globaux</div>
                        <div className="text-xs text-slate-600">Saisie annuelle simplifiée</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-emerald-600 rounded-full flex-shrink-0 mt-0.5"></div>
                      <div>
                        <div className="font-medium text-slate-800 text-sm">Répartition automatique</div>
                        <div className="text-xs text-slate-600">Calcul mensuel automatique</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-emerald-600 rounded-full flex-shrink-0 mt-0.5"></div>
                      <div>
                        <div className="font-medium text-slate-800 text-sm">Vue d&apos;ensemble</div>
                        <div className="text-xs text-slate-600">Synthèse rapide et claire</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-emerald-600 rounded-full flex-shrink-0 mt-0.5"></div>
                      <div>
                        <div className="font-medium text-slate-800 text-sm">Reporting direct</div>
                        <div className="text-xs text-slate-600">Export comptable immédiat</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <Button
                onClick={handleModeGlobal}
                className="w-full bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white shadow-md hover:shadow-lg transition-all duration-300 py-3 text-sm font-semibold"
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

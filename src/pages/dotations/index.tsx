'use client';

import React from 'react';
import { useRouter } from 'next/router';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/Button';
import { ArrowRight, Building, Calculator, List } from 'lucide-react';

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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto">

          {/* Mode Détaillé */}
          <div className="bg-white border-2 border-gray-200 rounded-xl p-6 hover:border-blue-300 hover:shadow-lg transition-all duration-300">
            <div className="space-y-4">
              {/* Icon */}
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-blue-100 p-3">
                  <List className="h-8 w-8 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Mode Détaillé</h2>
                  <p className="text-sm text-gray-600">Gestion par actif</p>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-3">
                <p className="text-gray-700">
                  Gérez chaque actif individuellement avec ses caractéristiques propres,
                  ses plans d&apos;amortissement et son suivi détaillé.
                </p>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-semibold text-blue-900 mb-2">Fonctionnalités</h3>
                  <ul className="space-y-2 text-sm text-blue-800">
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-blue-600 rounded-full"></div>
                      Détail par actif (nom, montant, durée)
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-blue-600 rounded-full"></div>
                      Plans d&apos;amortissement individuels
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-blue-600 rounded-full"></div>
                      Types d&apos;amortissement (linéaire/dégressif)
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-blue-600 rounded-full"></div>
                      Suivi précis de chaque bien
                    </li>
                  </ul>
                </div>
              </div>

              {/* Action */}
              <Button
                onClick={handleModeDetailed}
                className="w-full flex items-center justify-center gap-2 py-3"
                size="lg"
              >
                <Building className="h-5 w-5" />
                Accéder au Mode Détaillé
                <ArrowRight className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Mode Global */}
          <div className="bg-white border-2 border-gray-200 rounded-xl p-6 hover:border-green-300 hover:shadow-lg transition-all duration-300">
            <div className="space-y-4">
              {/* Icon */}
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-green-100 p-3">
                  <Calculator className="h-8 w-8 text-green-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Mode Global</h2>
                  <p className="text-sm text-gray-600">Simplifié</p>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-3">
                <p className="text-gray-700">
                  Saisissez directement les montants globaux des dotations par année,
                  tel qu&apos;ils apparaissent dans vos documents comptables.
                </p>

                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h3 className="font-semibold text-green-900 mb-2">Fonctionnalités</h3>
                  <ul className="space-y-2 text-sm text-green-800">
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-green-600 rounded-full"></div>
                      Montant global par année
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-green-600 rounded-full"></div>
                      Répartition automatique mensuelle
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-green-600 rounded-full"></div>
                      Vue d&apos;ensemble rapide
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-green-600 rounded-full"></div>
                      Reporting comptable direct
                    </li>
                  </ul>
                </div>
              </div>

              {/* Action */}
              <Button
                onClick={handleModeGlobal}
                className="w-full flex items-center justify-center gap-2 py-3 bg-green-600 hover:bg-green-700"
                size="lg"
              >
                <Calculator className="h-5 w-5" />
                Accéder au Mode Global
                <ArrowRight className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

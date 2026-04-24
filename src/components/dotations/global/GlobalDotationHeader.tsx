'use client';

import React from 'react';
import { Button } from '@/components/ui/Button';
import { ArrowLeft } from 'lucide-react';

interface GlobalDotationHeaderProps {
  onBackToAssets: () => void;
}

export function GlobalDotationHeader({ onBackToAssets }: GlobalDotationHeaderProps) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-primary/10 p-2.5">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-trending-down h-5 w-5 text-primary" aria-hidden="true">
              <polyline points="22 17 13.5 8.5 8.5 13.5 2 7"></polyline>
              <line x1="2" x2="22" y1="17" y2="17"></line>
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-bold text-primary">Mode Global - Dotations simplifiées</h2>
            <p className="text-sm text-slate-500">Gérez vos dotations par montant annuel global</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            onClick={onBackToAssets}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour
          </Button>
        </div>
      </div>
    </div>
  );
}

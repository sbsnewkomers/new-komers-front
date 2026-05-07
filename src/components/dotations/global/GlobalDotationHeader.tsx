'use client';

import React from 'react';
import { Button } from '@/components/ui/Button';
import { ArrowLeft, TrendingDown } from 'lucide-react';

interface GlobalDotationHeaderProps {
  onBackToAssets: () => void;
}

export function GlobalDotationHeader({ onBackToAssets }: GlobalDotationHeaderProps) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-white/10 p-2.5">
            <TrendingDown className="h-5 w-5 text-(--nebula-gold-light)" aria-hidden />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Mode Global - Dotations simplifiées</h2>
            <p className="text-sm text-(--nebula-muted)">Gérez vos dotations par montant annuel global</p>
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

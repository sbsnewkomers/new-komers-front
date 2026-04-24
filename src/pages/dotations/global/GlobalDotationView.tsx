'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Label } from '@/components/ui/Label';
import { Button } from '@/components/ui/Button';
import { GlobalDotation } from '@/types/asset.types';

interface GlobalDotationViewProps {
  dotation: GlobalDotation;
  entityName: string;
  onCancel: () => void;
}

export function GlobalDotationView({ dotation, entityName, onCancel }: GlobalDotationViewProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Détails de la dotation</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Année</Label>
            <p className="font-semibold">{dotation.year}</p>
          </div>
          <div>
            <Label>Montant total annuel</Label>
            <p className="font-semibold">{new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(Number(dotation.totalAmount) || 0)}</p>
          </div>
          <div>
            <Label>Montant mensuel</Label>
            <p className="font-semibold">{new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(Number(dotation.monthlyAmount) || (Number(dotation.totalAmount) || 0) / 12)}</p>
          </div>
          <div>
            <Label>Type d&apos;entité</Label>
            <p className="font-semibold">{dotation.entityType}</p>
          </div>
          <div>
            <Label>Entité</Label>
            <p className="font-semibold">{entityName || dotation.entityId}</p>
          </div>
          <div>
            <Label>Statut de validation</Label>
            <p className="font-semibold">
              {dotation.isValidated ? (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Validée
                </span>
              ) : (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                  En attente
                </span>
              )}
            </p>
          </div>
          {dotation.description && (
            <div className="col-span-2">
              <Label>Description</Label>
              <p className="font-semibold">{dotation.description}</p>
            </div>
          )}
          {dotation.dataSource && (
            <div className="col-span-2">
              <Label>Source des données</Label>
              <p className="font-semibold">{dotation.dataSource}</p>
            </div>
          )}
        </div>
        <div className="mt-6">
          <Button onClick={onCancel}>
            Retour à la liste
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

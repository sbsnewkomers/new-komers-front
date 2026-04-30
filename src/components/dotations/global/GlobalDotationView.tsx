'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Label } from '@/components/ui/Label';
import { Button } from '@/components/ui/Button';
import { GlobalDotation } from '@/types/asset.types';
import { formatCurrencyEUR } from '@/lib/format';
import { Badge } from '@/components/ui/Badge';

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
            <p className="font-semibold">{formatCurrencyEUR(Number(dotation.totalAnnualAmortization) || 0, { fallback: "0,00 €" })}</p>
          </div>
          <div>
            <Label>Montant mensuel</Label>
            <p className="font-semibold">{formatCurrencyEUR(Number(dotation.monthlyAmortization) || (Number(dotation.totalAnnualAmortization) || 0) / 12, { fallback: "0,00 €" })}</p>
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
                <Badge variant="success" size="md">Validée</Badge>
              ) : (
                <Badge variant="warning" size="md">En attente</Badge>
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

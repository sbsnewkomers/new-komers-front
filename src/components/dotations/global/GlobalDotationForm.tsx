'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Select } from '@/components/ui/Select';
import { GlobalDotation, EntityType } from '@/types/asset.types';
import { Save, X } from 'lucide-react';

// Utility functions
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR'
  }).format(amount);
};

interface GlobalDotationFormProps {
  entityType: EntityType;
  entityId: string;
  dotation?: GlobalDotation;
  onSave?: (dotation: GlobalDotation) => void;
  onCancel?: () => void;
}

export function GlobalDotationForm({
  entityType,
  entityId,
  dotation,
  onSave,
  onCancel,
}: GlobalDotationFormProps) {
  const [formData, setFormData] = useState<{
    year: number;
    totalAmount: number;
  }>(() => ({
    year: dotation?.year || new Date().getFullYear(),
    totalAmount: dotation?.totalAmount || 0,
  }));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 10 }, (_, i) => currentYear - 5 + i); // De 5 ans avant à 5 ans après


  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.year) {
      newErrors.year = 'L\'année est requise';
    }

    if (!formData.totalAmount || formData.totalAmount <= 0) {
      newErrors.totalAmount = 'Le montant doit être supérieur à 0';
    }

    if (formData.totalAmount > 999999999) {
      newErrors.totalAmount = 'Le montant est trop élevé';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      const monthlyAmount = formData.totalAmount / 12;

      let savedDotation: GlobalDotation;

      if (dotation) {
        // Mode édition
        // TODO: Remplacer par l'appel API réel
        // const updateData: UpdateGlobalDotationDto = {
        //   totalAmount: formData.totalAmount,
        // };
        // savedDotation = await globalDotationsApi.updateGlobalDotation(dotation.id, updateData);

        // Simuler la mise à jour
        savedDotation = {
          ...dotation,
          totalAmount: formData.totalAmount,
          monthlyAmount,
          updatedAt: new Date().toISOString(),
        };
      } else {
        // Mode création
        // TODO: Remplacer par l'appel API réel
        // const createData: CreateGlobalDotationDto = {
        //   year: formData.year,
        //   totalAmount: formData.totalAmount,
        //   entityType,
        //   entityId,
        // };
        // savedDotation = await globalDotationsApi.createGlobalDotation(createData);

        // Simuler la création
        savedDotation = {
          id: Date.now().toString(),
          year: formData.year,
          totalAmount: formData.totalAmount,
          monthlyAmount,
          entityType,
          entityId,
          createdById: 'current-user',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
      }

      onSave?.(savedDotation);
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      setErrors({
        submit: error instanceof Error ? error.message : 'Erreur lors de la sauvegarde',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));

    // Effacer l'erreur quand l'utilisateur modifie le champ
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: '',
      }));
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {dotation ? 'Modifier la dotation globale' : 'Nouvelle dotation globale'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Année */}
            <div className="space-y-2">
              <Label htmlFor="year">Année *</Label>
              <Select
                value={formData.year.toString()}
                onValueChange={(value) => handleInputChange('year', parseInt(value))}
                disabled={!!dotation} // Ne pas permettre de modifier l'année en mode édition
                options={years.map((year) => ({
                  value: year.toString(),
                  label: year.toString(),
                }))}
                placeholder="Sélectionner une année"
              />
              {errors.year && (
                <p className="text-sm text-red-600">{errors.year}</p>
              )}
            </div>

            {/* Montant total */}
            <div className="space-y-2">
              <Label htmlFor="totalAmount">Montant total annuel (EUR) *</Label>
              <Input
                id="totalAmount"
                type="number"
                step="0.01"
                min="0"
                max="999999999"
                placeholder="55 000"
                value={formData.totalAmount || ''}
                onChange={(e) => handleInputChange('totalAmount', parseFloat(e.target.value) || 0)}
                className="text-right"
              />
              {errors.totalAmount && (
                <p className="text-sm text-red-600">{errors.totalAmount}</p>
              )}
            </div>
          </div>

          {/* Résumé automatique */}
          {formData.totalAmount > 0 && (
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-semibold text-blue-900 mb-2">Résumé automatique</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-blue-700">Montant total annuel:</span>
                  <span className="ml-2 font-bold text-blue-900">
                    {formatCurrency(formData.totalAmount)}
                  </span>
                </div>
                <div>
                  <span className="text-blue-700">Montant mensuel (réparti):</span>
                  <span className="ml-2 font-bold text-blue-900">
                    {formatCurrency(formData.totalAmount / 12)}
                  </span>
                </div>
              </div>
              <p className="text-xs text-blue-600 mt-2">
                Le système répartira automatiquement ce montant sur 12 mois pour les calculs périodiques.
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-3 pt-4 border-t">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              {isSubmitting ? 'Sauvegarde...' : 'Sauvegarder'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isSubmitting}
              className="flex items-center gap-2"
            >
              <X className="h-4 w-4" />
              Annuler
            </Button>
          </div>

          {/* Erreur globale */}
          {errors.submit && (
            <div className="bg-red-50 p-4 rounded-lg">
              <p className="text-sm text-red-600">{errors.submit}</p>
            </div>
          )}

          {/* Instructions */}
          {!dotation && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold text-gray-700 mb-2">Mode Global Simplifié</h3>
              <p className="text-sm text-gray-600 mb-2">
                Ce mode vous permet de saisir directement le montant global des dotations pour chaque année,
                tel qu'il apparaît dans vos documents comptables.
              </p>
              <ul className="text-xs text-gray-500 space-y-1">
                <li>· Saisissez le montant total annuel des dotations</li>
                <li>· Le système le répartira automatiquement sur 12 mois</li>
                <li>· Pas besoin de gérer le détail par actif</li>
                <li>· Idéal pour une vue d&apos;ensemble rapide</li>
              </ul>
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  );
}

'use client';



import React, { useState } from 'react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';

import { Button } from '@/components/ui/Button';

import { Input } from '@/components/ui/Input';

import { Label } from '@/components/ui/Label';

import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { Checkbox } from '@/components/ui/Checkbox';
import { globalDotationsApi } from '@/lib/globalDotationsApi';
import { usePermissionsContext } from '@/permissions/PermissionsProvider';
import { entitiesApi, Group, Company, BusinessUnit } from '@/lib/entitiesApi';

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

  entityType?: EntityType;

  entityId?: string;

  dotation?: GlobalDotation;

  onSave?: (dotation: GlobalDotation) => void;

  onCancel?: () => void;

  allowEntitySelection?: boolean;

}



export function GlobalDotationForm({

  entityType,

  entityId,

  dotation,

  onSave,

  onCancel,

  allowEntitySelection = false,

}: GlobalDotationFormProps) {

  const [formData, setFormData] = useState<{

    year: number;

    totalAmount: number;

    entityType: EntityType;

    entityId: string;

    description?: string;

    dataSource?: string;

    isValidated: boolean;

  }>(() => ({

    year: dotation?.year || new Date().getFullYear(),

    totalAmount: dotation?.totalAmount || 0,

    entityType: (dotation?.entityType || entityType || EntityType.COMPANY) as EntityType,

    entityId: dotation?.entityId || entityId || '',

    description: dotation?.description || '',

    dataSource: dotation?.dataSource || '',

    isValidated: dotation?.isValidated || false,

  }));

  const [errors, setErrors] = useState<Record<string, string>>({});

  const [isSubmitting, setIsSubmitting] = useState(false);

  const [entities, setEntities] = useState<Group[] | Company[] | BusinessUnit[]>([]);

  const [isLoadingEntities, setIsLoadingEntities] = useState(false);

  const { user } = usePermissionsContext();



  const currentYear = new Date().getFullYear();

  const years = Array.from({ length: 10 }, (_, i) => currentYear - 5 + i); // De 5 ans avant à 5 ans après

  // Charger les entités selon le type sélectionné
  const loadEntities = async (entityType: EntityType) => {
    setIsLoadingEntities(true);
    try {
      switch (entityType) {
        case EntityType.GROUP:
          const groups = await entitiesApi.getGroups();
          setEntities(groups);
          break;
        case EntityType.COMPANY:
          const companies = await entitiesApi.getCompanies();
          setEntities(companies);
          break;
        case EntityType.BUSINESS_UNIT:
          const businessUnits = await entitiesApi.getBusinessUnitsForUser();
          setEntities(businessUnits);
          break;
        default:
          setEntities([]);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des entités:', error);
      setEntities([]);
    } finally {
      setIsLoadingEntities(false);
    }
  };

  // Charger les entités au changement de type et au montage
  React.useEffect(() => {
    if (allowEntitySelection && formData.entityType) {
      const timeoutId = setTimeout(() => {
        loadEntities(formData.entityType);
      }, 0);
      return () => clearTimeout(timeoutId);
    }
  }, [allowEntitySelection, formData.entityType]);





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

    // Valider l'entityId (doit être un UUID valide ou non vide)
    if (allowEntitySelection) {
      if (!formData.entityId || formData.entityId.trim() === '') {
        newErrors.entityId = 'L\'entité est requise';
      }
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

      let savedDotation: GlobalDotation;

      if (dotation) {
        // Mode édition
        const updateData = {
          totalAmount: formData.totalAmount,
          description: formData.description,
          dataSource: formData.dataSource,
          isValidated: formData.isValidated,
          validatedById: formData.isValidated && user ? user.id : undefined,
        };
        savedDotation = await globalDotationsApi.updateGlobalDotation(dotation.id, updateData);
      } else {
        // Mode création
        const createData = {
          year: formData.year,
          totalAmount: formData.totalAmount,
          entityType: formData.entityType,
          entityId: formData.entityId,
          description: formData.description,
          dataSource: formData.dataSource,
          isValidated: formData.isValidated,
          validatedById: formData.isValidated && user ? user.id : undefined,
        };
        savedDotation = await globalDotationsApi.createGlobalDotation(createData);
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



  const handleInputChange = (field: string, value: string | number | boolean) => {

    // Si on change le type d'entité, réinitialiser l'entité sélectionnée
    if (field === 'entityType') {
      setFormData(prev => ({
        ...prev,
        entityType: value as EntityType,
        entityId: '', // Réinitialiser l'entité sélectionnée
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value,
      }));
    }



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

          {/* Sélection d'entité (si autorisé) */}
          {allowEntitySelection && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Type d'entité */}
              <div className="space-y-2">
                <Label htmlFor="entityType">Type d&apos;entité *</Label>
                <Select
                  value={formData.entityType}
                  onValueChange={(value) => handleInputChange('entityType', value)}
                  options={[
                    { value: EntityType.COMPANY, label: 'Entreprise' },
                    { value: EntityType.BUSINESS_UNIT, label: 'Unité de travail' },
                    { value: EntityType.GROUP, label: 'Groupe' },
                  ]}
                  placeholder="Sélectionner un type d'entité"
                />
                {errors.entityType && (
                  <p className="text-sm text-red-600">{errors.entityType}</p>
                )}
              </div>

              {/* Sélection de l'entité */}
              <div className="space-y-2">
                <Label htmlFor="entityId">Entité *</Label>
                <Select
                  value={formData.entityId || ''}
                  onValueChange={(value) => handleInputChange('entityId', value)}
                  options={entities.map(entity => ({
                    value: entity.id,
                    label: entity.name,
                  }))}
                  placeholder={isLoadingEntities ? "Chargement..." : "Sélectionner une entité"}
                  disabled={isLoadingEntities || entities.length === 0}
                />
                {errors.entityId && (
                  <p className="text-sm text-red-600">{errors.entityId}</p>
                )}
                {entities.length === 0 && !isLoadingEntities && formData.entityType && (
                  <p className="text-xs text-gray-500">
                    Aucune entité disponible pour ce type
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Champs additionnels */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Description */}
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Description optionnelle des dotations (ex: Dotations selon liasse fiscale 2025)"
                value={formData.description || ''}
                onChange={(e) => handleInputChange('description', e.target.value)}
                rows={3}
              />
            </div>

            {/* Source des données */}
            <div className="space-y-2">
              <Label htmlFor="dataSource">Source des données</Label>
              <Input
                id="dataSource"
                type="text"
                placeholder="Liasse fiscale, Comptabilité, Expert-comptable..."
                value={formData.dataSource || ''}
                onChange={(e) => handleInputChange('dataSource', e.target.value)}
              />
            </div>

            {/* Validation */}
            <div className="space-y-2">
              <Label className="flex items-center space-x-2">
                <Checkbox
                  id="isValidated"
                  checked={formData.isValidated}
                  onCheckedChange={(checked) => handleInputChange('isValidated', checked)}
                />
                <span>Dotation validée</span>
              </Label>
              <p className="text-xs text-gray-500">
                Cochez cette case si les dotations ont été validées et sont définitives
              </p>
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

                tel qu&apos;il apparaît dans vos documents comptables.

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


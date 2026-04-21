'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { Asset, AssetStatus, AmortizationType, EntityType, CreateAssetDto } from '@/types/asset.types';
import { fetchStructureTree } from '@/lib/structureApi';

interface AssetFormProps {
  asset?: Asset;
  entityType?: EntityType;
  entityId?: string;
  onSubmit: (data: CreateAssetDto) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export function AssetForm({ asset, entityType = EntityType.COMPANY, entityId = '', onSubmit, onCancel, isLoading = false }: AssetFormProps) {
  const [formData, setFormData] = useState<CreateAssetDto>({
    name: '',
    description: '',
    acquisitionAmount: 0,
    acquisitionDate: new Date().toISOString().split('T')[0],
    amortizationDurationYears: 5,
    amortizationType: AmortizationType.LINEAR,
    status: AssetStatus.ACTIVE,
    residualValue: 0,
    commissioningDate: new Date().toISOString().split('T')[0],
    entityType,
    entityId,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [availableEntities, setAvailableEntities] = useState<any[]>([]);
  const [isLoadingEntities, setIsLoadingEntities] = useState(false);

  // Charger les entités disponibles selon le type sélectionné
  useEffect(() => {
    const loadEntities = async () => {
      setIsLoadingEntities(true);
      try {
        console.log('Chargement des entités pour:', formData.entityType);
        const tree = await fetchStructureTree();
        console.log('Structure tree reçue:', tree);

        let entities: any[] = [];

        if (formData.entityType === EntityType.COMPANY) {
          // Extraire toutes les entreprises:
          // 1. Entreprises autonomes (standaloneCompanies)
          // 2. Entreprises dans les groupes des workspaces
          // 3. Entreprises directes des workspaces (standaloneCompanies des workspaces)
          const standaloneCompanies = tree?.standaloneCompanies || [];
          const workspaceGroupCompanies = tree?.workspaces?.flatMap(w =>
            w.groups.flatMap(g => g.companies)
          ) || [];
          const workspaceDirectCompanies = tree?.workspaces?.flatMap(w =>
            w.standaloneCompanies || []
          ) || [];

          // Combiner et dédupliquer les entreprises
          const allCompanies = [...standaloneCompanies, ...workspaceGroupCompanies, ...workspaceDirectCompanies];
          const uniqueCompanies = allCompanies.filter((company, index, self) =>
            index === self.findIndex(c => c.id === company.id)
          );
          entities = uniqueCompanies;

        } else if (formData.entityType === EntityType.BUSINESS_UNIT) {
          // Extraire toutes les unités de travail de toutes les entreprises
          const standaloneCompanies = tree?.standaloneCompanies || [];
          const workspaceGroupCompanies = tree?.workspaces?.flatMap(w =>
            w.groups.flatMap(g => g.companies)
          ) || [];
          const workspaceDirectCompanies = tree?.workspaces?.flatMap(w =>
            w.standaloneCompanies || []
          ) || [];

          const allCompanies = [...standaloneCompanies, ...workspaceGroupCompanies, ...workspaceDirectCompanies];
          entities = allCompanies.flatMap(company => company.businessUnits);

        } else if (formData.entityType === EntityType.GROUP) {
          // Extraire tous les groupes des workspaces
          entities = tree?.workspaces?.flatMap(w => w.groups) || [];
        }

        console.log(`Entités chargées pour ${formData.entityType}:`, entities);
        setAvailableEntities(entities);
      } catch (error) {
        console.error('Erreur lors du chargement des entités:', error);
        setAvailableEntities([]);
      } finally {
        setIsLoadingEntities(false);
      }
    };

    if (formData.entityType) {
      loadEntities();
    }
  }, [formData.entityType]);

  useEffect(() => {
    if (asset) {
      setFormData({
        name: asset.name,
        description: asset.description || '',
        acquisitionAmount: asset.acquisitionAmount,
        acquisitionDate: new Date(asset.acquisitionDate).toISOString().split('T')[0],
        amortizationDurationYears: asset.amortizationDurationYears,
        amortizationType: asset.amortizationType,
        status: asset.status,
        residualValue: asset.residualValue,
        commissioningDate: asset.commissioningDate
          ? new Date(asset.commissioningDate).toISOString().split('T')[0]
          : new Date(asset.acquisitionDate).toISOString().split('T')[0],
        disposalDate: asset.disposalDate
          ? new Date(asset.disposalDate).toISOString().split('T')[0]
          : undefined,
        disposalAmount: asset.disposalAmount,
        entityType,
        entityId,
      });
    }
  }, [asset, entityType, entityId]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Validation du type d'entité
    if (!formData.entityType) {
      newErrors.entityType = 'Le type d\'entité est requis';
    }

    // Validation de l'entité
    if (!formData.entityId || formData.entityId.trim() === '') {
      newErrors.entityId = 'L\'entité est requise';
    }

    if (!formData.name.trim()) {
      newErrors.name = 'Le nom de l\'actif est requis';
    }

    if (formData.acquisitionAmount <= 0) {
      newErrors.acquisitionAmount = 'Le montant d\'acquisition doit être supérieur à 0';
    }

    if (!formData.acquisitionDate) {
      newErrors.acquisitionDate = 'La date d\'acquisition est requise';
    }

    if (formData.amortizationDurationYears <= 0) {
      newErrors.amortizationDurationYears = 'La durée d\'amortissement doit être supérieure à 0';
    }

    if (formData.residualValue < 0) {
      newErrors.residualValue = 'La valeur résiduelle ne peut pas être négative';
    }

    if (formData.residualValue > formData.acquisitionAmount) {
      newErrors.residualValue = 'La valeur résiduelle ne peut pas dépasser le montant d\'acquisition';
    }

    if (formData.commissioningDate && formData.acquisitionDate &&
      new Date(formData.commissioningDate) < new Date(formData.acquisitionDate)) {
      newErrors.commissioningDate = 'La date de mise en service ne peut pas être antérieure à la date d\'acquisition';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      await onSubmit(formData);
    } catch (error) {
      console.error('Error submitting form:', error);
    }
  };

  const handleInputChange = (field: keyof CreateAssetDto, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{asset ? 'Modifier l\'actif' : 'Créer un nouvel actif'}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Type d'entité */}
            <div className="space-y-2">
              <Label htmlFor="entityType">Type d'entité *</Label>
              <Select
                value={formData.entityType}
                onValueChange={(value) => handleInputChange('entityType', value as EntityType)}
                className={errors.entityType ? 'border-red-500' : ''}
              >
                <option value={EntityType.COMPANY}>Entreprise</option>
                <option value={EntityType.BUSINESS_UNIT}>Unité de travail</option>
                <option value={EntityType.GROUP}>Groupe</option>
              </Select>
              {errors.entityType && <p className="text-sm text-red-600">{errors.entityType}</p>}
            </div>

            {/* Entité spécifique */}
            <div className="space-y-2">
              <Label htmlFor="entityId">Entité *</Label>
              <Select
                value={formData.entityId}
                onValueChange={(value) => handleInputChange('entityId', value)}
                className={errors.entityId ? 'border-red-500' : ''}
                disabled={!formData.entityType || isLoadingEntities}
              >
                <option value="">
                  {isLoadingEntities ? 'Chargement...' : 'Sélectionner une entité...'}
                </option>
                {!isLoadingEntities && availableEntities.map((entity: any) => (
                  <option key={entity.id} value={entity.id}>
                    {entity.name}
                  </option>
                ))}
              </Select>
              {errors.entityId && <p className="text-sm text-red-600">{errors.entityId}</p>}
              {!formData.entityType && (
                <p className="text-sm text-gray-500">Veuillez d&apos;abord sélectionner un type d&apos;entité</p>
              )}
              {formData.entityType && !isLoadingEntities && availableEntities.length === 0 && (
                <p className="text-sm text-gray-500">Aucune entité disponible pour ce type</p>
              )}
              {formData.entityType && availableEntities.length > 0 && (
                <p className="text-sm text-gray-500">{availableEntities.length} entité(s) disponible(s)</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Nom de l'actif *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Ex: Machine de production Z-45"
                className={errors.name ? 'border-red-500' : ''}
              />
              {errors.name && <p className="text-sm text-red-600">{errors.name}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="acquisitionAmount">Montant d'acquisition (€) *</Label>
              <Input
                id="acquisitionAmount"
                type="number"
                step="0.01"
                min="0.01"
                value={formData.acquisitionAmount}
                onChange={(e) => handleInputChange('acquisitionAmount', parseFloat(e.target.value) || 0)}
                placeholder="10000"
                className={errors.acquisitionAmount ? 'border-red-500' : ''}
              />
              {errors.acquisitionAmount && <p className="text-sm text-red-600">{errors.acquisitionAmount}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="acquisitionDate">Date d'acquisition *</Label>
              <Input
                id="acquisitionDate"
                type="date"
                value={formData.acquisitionDate}
                onChange={(e) => handleInputChange('acquisitionDate', e.target.value)}
                className={errors.acquisitionDate ? 'border-red-500' : ''}
              />
              {errors.acquisitionDate && <p className="text-sm text-red-600">{errors.acquisitionDate}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="commissioningDate">Date de mise en service</Label>
              <Input
                id="commissioningDate"
                type="date"
                value={formData.commissioningDate}
                onChange={(e) => handleInputChange('commissioningDate', e.target.value)}
                className={errors.commissioningDate ? 'border-red-500' : ''}
              />
              {errors.commissioningDate && <p className="text-sm text-red-600">{errors.commissioningDate}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="amortizationDurationYears">Durée d'amortissement (années) *</Label>
              <Input
                id="amortizationDurationYears"
                type="number"
                min="1"
                max="50"
                value={formData.amortizationDurationYears}
                onChange={(e) => handleInputChange('amortizationDurationYears', parseInt(e.target.value) || 1)}
                className={errors.amortizationDurationYears ? 'border-red-500' : ''}
              />
              {errors.amortizationDurationYears && <p className="text-sm text-red-600">{errors.amortizationDurationYears}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="amortizationType">Type d'amortissement</Label>
              <Select
                value={formData.amortizationType}
                onValueChange={(value) => handleInputChange('amortizationType', value as AmortizationType)}
              >
                <option value={AmortizationType.LINEAR}>Linéaire</option>
                <option value={AmortizationType.DEGRESSIVE}>Dégressif</option>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="residualValue">Valeur résiduelle (€)</Label>
              <Input
                id="residualValue"
                type="number"
                step="0.01"
                min="0"
                value={formData.residualValue}
                onChange={(e) => handleInputChange('residualValue', parseFloat(e.target.value) || 0)}
                className={errors.residualValue ? 'border-red-500' : ''}
              />
              {errors.residualValue && <p className="text-sm text-red-600">{errors.residualValue}</p>}
            </div>

            {asset && (
              <div className="space-y-2">
                <Label htmlFor="status">Statut</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => handleInputChange('status', value as AssetStatus)}
                >
                  <option value={AssetStatus.ACTIVE}>Actif</option>
                  <option value={AssetStatus.FULLY_AMORTIZED}>Totalement amorti</option>
                  <option value={AssetStatus.DISPOSED}>Cédé</option>
                </Select>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Description détaillée de l'actif..."
              rows={3}
            />
          </div>

          {asset && formData.status === AssetStatus.DISPOSED && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="disposalDate">Date de cession</Label>
                <Input
                  id="disposalDate"
                  type="date"
                  value={formData.disposalDate || ''}
                  onChange={(e) => handleInputChange('disposalDate', e.target.value || undefined)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="disposalAmount">Montant de cession (€)</Label>
                <Input
                  id="disposalAmount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.disposalAmount || ''}
                  onChange={(e) => handleInputChange('disposalAmount', parseFloat(e.target.value) || undefined)}
                />
              </div>
            </div>
          )}

          <div className="flex justify-end space-x-4 pt-6 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isLoading}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
            >
              {isLoading ? 'Enregistrement...' : (asset ? 'Modifier' : 'Créer')}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

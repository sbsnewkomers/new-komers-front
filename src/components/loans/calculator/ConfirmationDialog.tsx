'use client';

import React from 'react';
import { Button } from '@/components/ui/Button';
import { Label } from '@/components/ui/Label';
import { Select } from '@/components/ui/Select';
import {
    AlertDialog,
    AlertDialogContent,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogDescription,
    AlertDialogFooter,
} from '@/components/ui/AlertDialog';
import { CheckCircle } from 'lucide-react';
import { EntityType, LoanCalculatorDto } from '@/types/loans';
import { Group, Company, BusinessUnit } from '@/lib/entitiesApi';

interface ConfirmationDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    formData: LoanCalculatorDto;
    entities: Group[] | Company[] | BusinessUnit[];
    selectedEntity: string;
    onEntityTypeChange: (value: EntityType) => void;
    onEntityChange: (value: string) => void;
    onConfirm: () => void;
    loadEntities: (entityType: EntityType) => void;
}

export function ConfirmationDialog({
    open,
    onOpenChange,
    formData,
    entities,
    selectedEntity,
    onEntityTypeChange,
    onEntityChange,
    onConfirm,
    loadEntities
}: ConfirmationDialogProps) {
    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center gap-2">
                        <CheckCircle className="h-5 w-5 text-blue-600" />
                        Confirmer la sauvegarde
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                        Choisissez l&apos;entité à laquelle associer cet emprunt.
                    </AlertDialogDescription>
                </AlertDialogHeader>

                <div className="grid grid-cols-1 gap-3 pt-2 sm:grid-cols-2">
                    <div>
                        <Label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                            Type d&apos;entité
                        </Label>
                        <Select
                            value={formData.entityType || EntityType.GROUP}
                            onValueChange={(v) => {
                                onEntityTypeChange(v as EntityType);
                                loadEntities(v as EntityType);
                                onEntityChange('');
                            }}
                        >
                            <option value={EntityType.GROUP}>Groupe</option>
                            <option value={EntityType.COMPANY}>Entreprise</option>
                            <option value={EntityType.BUSINESSUNIT}>
                                Unité d&apos;affaires
                            </option>
                        </Select>
                    </div>
                    <div>
                        <Label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                            Entité
                        </Label>
                        <Select
                            value={selectedEntity || ''}
                            onValueChange={onEntityChange}
                            disabled={!formData.entityType}
                        >
                            <option value="">Sélectionner…</option>
                            {entities.map((entity) => (
                                <option key={entity.id} value={entity.id}>
                                    {entity.name}
                                </option>
                            ))}
                        </Select>
                    </div>
                </div>
                <AlertDialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Annuler
                    </Button>
                    <Button
                        onClick={onConfirm}
                        className="bg-primary text-white hover:bg-slate-800"
                        disabled={!formData.entityId}
                    >
                        Confirmer
                    </Button>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}

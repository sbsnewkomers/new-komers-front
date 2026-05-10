import React from 'react';
import { Button } from '@/components/ui/Button';
import { Label } from '@/components/ui/Label';
import { Select } from '@/components/ui/Select';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { ColumnMappingDto, ImportPreviewDto } from '@/types/loans';

interface ColumnMappingStepProps {
    preview: ImportPreviewDto | null;
    columnMapping: ColumnMappingDto[];
    onColumnMapping: (sourceColumn: string, targetField: 'dueDate' | 'principalPayment' | 'interestPayment' | 'insurancePayment') => void;
    onGoToPreviousStep: () => void;
    onFinalizeMapping: () => void;
    isLoading: boolean;
}

const requiredFields = [
    'dueDate',
    'principalPayment',
    'interestPayment',
    'insurancePayment',
] as const;

const fieldLabel = (field: string) =>
    field === 'dueDate'
        ? 'Date'
        : field === 'principalPayment'
            ? 'Capital'
            : field === 'interestPayment'
                ? 'Intérêts'
                : field === 'insurancePayment'
                    ? 'Assurance'
                    : field;

export function ColumnMappingStep({
    preview,
    columnMapping,
    onColumnMapping,
    onGoToPreviousStep,
    onFinalizeMapping,
    isLoading,
}: ColumnMappingStepProps) {
    const isImportReady = () => {
        return requiredFields.every((field) =>
            columnMapping.some((mapping) => mapping.targetField === field),
        );
    };

    return (
        <div className="nebula-glass rounded-3xl border border-white/10 p-6">
            <h3 className="mb-1 text-sm font-semibold text-white">
                Mapping des colonnes
            </h3>
            <p className="mb-5 text-xs text-(--nebula-muted)">
                Associez chaque colonne de votre fichier au champ correspondant.
            </p>

            <div className="space-y-3">
                {requiredFields.map((field) => (
                    <div
                        key={field}
                        className="flex flex-col gap-2 rounded-2xl border border-white/10 bg-white/5 p-3 sm:flex-row sm:items-center"
                    >
                        <Label className="w-32 shrink-0 text-xs font-semibold uppercase tracking-[0.18em] text-(--nebula-muted)">
                            {fieldLabel(field)}{' '}
                            <span className="text-red-500">*</span>
                        </Label>
                        <div className="flex-1">
                            <Select
                                value={
                                    columnMapping.find((m) => m.targetField === field)
                                        ?.sourceColumn || ''
                                }
                                onValueChange={(value) =>
                                    onColumnMapping(
                                        value,
                                        field as
                                        | 'dueDate'
                                        | 'principalPayment'
                                        | 'interestPayment'
                                        | 'insurancePayment',
                                    )
                                }
                            >
                                <option value="">-- Sélectionner une colonne --</option>
                                {preview?.detectedColumns.map((column) => (
                                    <option key={column} value={column}>
                                        {column}
                                    </option>
                                ))}
                            </Select>
                        </div>
                    </div>
                ))}
            </div>

            <div className="mt-6 flex items-center justify-between border-t border-white/10 pt-5">
                <Button variant="outline" onClick={onGoToPreviousStep}>
                    <ArrowLeft className="h-4 w-4" />
                    Précédent
                </Button>
                <Button
                    onClick={onFinalizeMapping}
                    disabled={!isImportReady() || isLoading}
                    className="gap-2"
                >
                    Finaliser le mapping
                    <ArrowRight className="h-4 w-4" />
                </Button>
            </div>
        </div>
    );
}

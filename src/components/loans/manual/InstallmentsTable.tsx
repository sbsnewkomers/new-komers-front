'use client';

import React from 'react';
import { Button } from '@/components/ui/Button';
import { Plus, Calculator } from 'lucide-react';
import { EditableInstallment } from './utils';
import { InstallmentRow } from './InstallmentRow';

interface InstallmentsTableProps {
    installments: EditableInstallment[];
    onUpdate: (index: number, field: keyof EditableInstallment, value: string | number) => void;
    onRemove: (index: number) => void;
    onAdd: () => void;
    dateValidationErrors?: Record<number, string>;
    fieldValidationErrors?: Record<number, Record<string, string>>;
}

export function InstallmentsTable({
    installments,
    onUpdate,
    onRemove,
    onAdd,
    dateValidationErrors,
    fieldValidationErrors,
}: InstallmentsTableProps) {
    return (
        <div className="nebula-glass rounded-3xl border border-white/10 overflow-hidden">
            <div className="flex flex-col gap-3 border-b border-white/10 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                <div className="flex items-center gap-2">
                    <Calculator className="h-4 w-4 text-white/60" />
                    <h3 className="text-sm font-semibold text-white">Échéancier</h3>
                    <span className="text-xs text-white/40">
                        ({installments.length} échéance{installments.length > 1 ? 's' : ''})
                    </span>
                </div>
                <Button onClick={onAdd} variant="outline" size="sm">
                    <Plus className="h-4 w-4" />
                    Ajouter une ligne
                </Button>
            </div>
            <div className="max-h-[480px] overflow-auto">
                <div className="min-w-[980px]">
                    <div className="sticky top-0 z-10 grid grid-cols-[60px_150px_120px_120px_120px_140px_140px_1fr_80px] items-center gap-3 border-b border-white/10 bg-white/5 px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-(--nebula-muted)">
                        <div>N°</div>
                        <div>Date</div>
                        <div className="text-right">Capital</div>
                        <div className="text-right">Intérêts</div>
                        <div className="text-right">Assurance</div>
                        <div className="text-right">Total</div>
                        <div className="text-right">Restant dû</div>
                        <div>Commentaire</div>
                        <div className="text-center">Actions</div>
                    </div>

                    <div className="divide-y divide-white/10">
                        {installments.map((installment, index) => (
                            <InstallmentRow
                                key={index}
                                installment={installment}
                                index={index}
                                onUpdate={onUpdate}
                                onRemove={onRemove}
                                dateError={dateValidationErrors?.[index]}
                                fieldErrors={fieldValidationErrors?.[index]}
                            />
                        ))}

                        {installments.length === 0 && (
                            <div className="px-4 py-10 text-center">
                                <p className="text-sm text-(--nebula-muted)">
                                    Aucune échéance pour l&apos;instant.
                                </p>
                                <Button variant="outline" size="sm" className="mt-3" onClick={onAdd}>
                                    <Plus className="h-4 w-4" />
                                    Ajouter une ligne
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

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
}

export function InstallmentsTable({
    installments,
    onUpdate,
    onRemove,
    onAdd,
}: InstallmentsTableProps) {
    return (
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-col gap-3 border-b border-slate-100 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2">
                    <Calculator className="h-4 w-4 text-slate-500" />
                    <h3 className="text-sm font-semibold text-slate-900">Échéancier</h3>
                    <span className="text-xs text-slate-400">
                        ({installments.length} échéance{installments.length > 1 ? 's' : ''})
                    </span>
                </div>
                <Button onClick={onAdd} variant="outline" size="sm">
                    <Plus className="h-4 w-4" />
                    Ajouter une ligne
                </Button>
            </div>
            <div className="max-h-[480px] overflow-auto">
                <table className="min-w-full">
                    <thead>
                        <tr className="border-b border-slate-100 bg-slate-50/50">
                            <th className="sticky top-0 bg-slate-50/95 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 backdrop-blur">
                                N°
                            </th>
                            <th className="sticky top-0 bg-slate-50/95 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 backdrop-blur">
                                Date
                            </th>
                            <th className="sticky top-0 bg-slate-50/95 px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500 backdrop-blur">
                                Capital
                            </th>
                            <th className="sticky top-0 bg-slate-50/95 px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500 backdrop-blur">
                                Intérêts
                            </th>
                            <th className="sticky top-0 bg-slate-50/95 px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500 backdrop-blur">
                                Assurance
                            </th>
                            <th className="sticky top-0 bg-slate-50/95 px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500 backdrop-blur">
                                Total
                            </th>
                            <th className="sticky top-0 bg-slate-50/95 px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500 backdrop-blur">
                                Restant dû
                            </th>
                            <th className="sticky top-0 bg-slate-50/95 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 backdrop-blur">
                                Commentaire
                            </th>
                            <th className="sticky top-0 bg-slate-50/95 px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-500 backdrop-blur">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {installments.map((installment, index) => (
                            <InstallmentRow
                                key={index}
                                installment={installment}
                                index={index}
                                onUpdate={onUpdate}
                                onRemove={onRemove}
                            />
                        ))}
                        {installments.length === 0 && (
                            <tr>
                                <td colSpan={9} className="px-6 py-12 text-center">
                                    <p className="text-sm text-slate-500">
                                        Aucune échéance pour l&apos;instant.
                                    </p>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="mt-3"
                                        onClick={onAdd}
                                    >
                                        <Plus className="h-4 w-4" />
                                        Ajouter une ligne
                                    </Button>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

'use client';

import React from 'react';
import { Input } from '@/components/ui/Input';
import { Trash2 } from 'lucide-react';
import { EditableInstallment, formatCurrency } from './utils';

interface InstallmentRowProps {
    installment: EditableInstallment;
    index: number;
    onUpdate: (index: number, field: keyof EditableInstallment, value: string | number) => void;
    onRemove: (index: number) => void;
    dateError?: string;
    fieldErrors?: Record<string, string>;
}

export function InstallmentRow({
    installment,
    index,
    onUpdate,
    onRemove,
    dateError,
    fieldErrors,
}: InstallmentRowProps) {
    return (
        <tr className="transition-colors hover:bg-slate-50/50">
            <td className="px-4 py-2 text-sm font-medium text-slate-900">
                {index + 1}
            </td>
            <td className="px-2 py-2">
                <Input
                    type="date"
                    value={installment.dueDate}
                    onChange={(e) => onUpdate(index, 'dueDate', e.target.value)}
                    className={`w-36 ${dateError ? 'border-red-300 focus:border-red-500 focus:ring-red-200' : ''}`}
                    title={dateError}
                />
            </td>
            <td className="px-2 py-2">
                <Input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={installment.principalPayment}
                    onChange={(e) => onUpdate(index, 'principalPayment', e.target.value)}
                    className={`w-28 text-right ${fieldErrors?.principalPayment ? 'border-red-300 focus:border-red-500 focus:ring-red-200' : ''}`}
                    title={fieldErrors?.principalPayment}
                />
            </td>
            <td className="px-2 py-2">
                <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={installment.interestPayment}
                    onChange={(e) => onUpdate(index, 'interestPayment', e.target.value)}
                    className={`w-28 text-right ${fieldErrors?.interestPayment ? 'border-red-300 focus:border-red-500 focus:ring-red-200' : ''}`}
                    title={fieldErrors?.interestPayment}
                />
            </td>
            <td className="px-2 py-2">
                <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={installment.insurancePayment}
                    onChange={(e) => onUpdate(index, 'insurancePayment', e.target.value)}
                    className={`w-28 text-right ${fieldErrors?.insurancePayment ? 'border-red-300 focus:border-red-500 focus:ring-red-200' : ''}`}
                    title={fieldErrors?.insurancePayment}
                />
            </td>
            <td className="px-4 py-2 text-right text-sm font-semibold text-slate-900">
                {formatCurrency(installment.totalPayment)}
            </td>
            <td className="px-4 py-2 text-right text-sm text-slate-600">
                {formatCurrency(installment.remainingBalance)}
            </td>
            <td className="px-2 py-2">
                <Input
                    type="text"
                    placeholder="Commentaires…"
                    value={installment.comments || ''}
                    onChange={(e) => onUpdate(index, 'comments', e.target.value)}
                    className="w-40"
                />
            </td>
            <td className="px-4 py-2 text-center">
                <button
                    type="button"
                    onClick={() => onRemove(index)}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                    aria-label="Supprimer"
                >
                    <Trash2 className="h-4 w-4" />
                </button>
            </td>
        </tr>
    );
}

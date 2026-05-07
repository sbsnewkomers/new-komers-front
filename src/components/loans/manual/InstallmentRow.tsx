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
        <div className="grid grid-cols-[60px_150px_120px_120px_120px_140px_140px_1fr_80px] items-center gap-3 px-4 py-2 transition-colors hover:bg-white/5">
            <div className="text-sm font-medium text-white">
                {index + 1}
            </div>
            <div>
                <Input
                    type="date"
                    value={installment.dueDate}
                    onChange={(e) => onUpdate(index, 'dueDate', e.target.value)}
                    className={`h-9 w-full ${dateError ? 'border-red-300 focus:border-red-500 focus:ring-red-200' : ''}`}
                    title={dateError}
                />
            </div>
            <div>
                <Input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={installment.principalPayment}
                    onChange={(e) => onUpdate(index, 'principalPayment', e.target.value)}
                    className={`h-9 w-full text-right ${fieldErrors?.principalPayment ? 'border-red-300 focus:border-red-500 focus:ring-red-200' : ''}`}
                    title={fieldErrors?.principalPayment}
                />
            </div>
            <div>
                <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={installment.interestPayment}
                    onChange={(e) => onUpdate(index, 'interestPayment', e.target.value)}
                    className={`h-9 w-full text-right ${fieldErrors?.interestPayment ? 'border-red-300 focus:border-red-500 focus:ring-red-200' : ''}`}
                    title={fieldErrors?.interestPayment}
                />
            </div>
            <div>
                <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={installment.insurancePayment}
                    onChange={(e) => onUpdate(index, 'insurancePayment', e.target.value)}
                    className={`h-9 w-full text-right ${fieldErrors?.insurancePayment ? 'border-red-300 focus:border-red-500 focus:ring-red-200' : ''}`}
                    title={fieldErrors?.insurancePayment}
                />
            </div>
            <div className="text-right text-sm font-semibold text-white">
                {formatCurrency(installment.totalPayment)}
            </div>
            <div className="text-right text-sm text-(--nebula-muted)">
                {formatCurrency(installment.remainingBalance)}
            </div>
            <div className="min-w-0">
                <Input
                    type="text"
                    placeholder="Commentaires…"
                    value={installment.comments || ''}
                    onChange={(e) => onUpdate(index, 'comments', e.target.value)}
                    className="h-9 w-full"
                />
            </div>
            <div className="flex justify-center">
                <button
                    type="button"
                    onClick={() => onRemove(index)}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-white/50 transition-colors hover:bg-white/10 hover:text-red-200"
                    aria-label="Supprimer"
                >
                    <Trash2 className="h-4 w-4" />
                </button>
            </div>
        </div>
    );
}

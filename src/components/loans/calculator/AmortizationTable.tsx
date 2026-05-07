'use client';

import React from 'react';
import { Calculator } from 'lucide-react';
import { LoanInstallmentCalculation } from '@/types/loans';
import { formatCurrency, formatDate } from './utils';

interface AmortizationTableProps {
    amortizationTable: LoanInstallmentCalculation[];
}

export function AmortizationTable({ amortizationTable }: AmortizationTableProps) {
    return (
        <div className="nebula-glass rounded-3xl border border-white/10 overflow-hidden">
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-4 sm:px-6">
                <div className="flex items-center gap-2">
                    <Calculator className="h-4 w-4 text-white/60" />
                    <h3 className="text-sm font-semibold text-white">
                        Tableau d&apos;amortissement
                    </h3>
                    <span className="text-xs text-white/40">
                        ({amortizationTable?.length || 0} échéances)
                    </span>
                </div>
            </div>
            <div className="max-h-[480px] overflow-auto">
                <div className="min-w-[740px]">
                    <div className="sticky top-0 z-10 grid grid-cols-[60px_160px_1fr_1fr_1fr_1fr_1fr] items-center gap-3 border-b border-white/10 bg-white/5 px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-(--nebula-muted)">
                        <div>N°</div>
                        <div>Date</div>
                        <div className="text-right">Capital</div>
                        <div className="text-right">Intérêts</div>
                        <div className="text-right">Assurance</div>
                        <div className="text-right">Total</div>
                        <div className="text-right">Restant dû</div>
                    </div>

                    <div className="divide-y divide-white/10">
                        {amortizationTable?.map((inst: LoanInstallmentCalculation, index: number) => (
                            <div
                                key={inst.installmentNumber || `installment-${index}`}
                                className="grid grid-cols-[60px_160px_1fr_1fr_1fr_1fr_1fr] items-center gap-3 px-4 py-3 transition-colors hover:bg-white/5"
                            >
                                <div className="text-sm font-medium text-white">
                                    {inst.installmentNumber || ''}
                                </div>
                                <div className="text-sm text-(--nebula-muted)">
                                    {formatDate(inst.dueDate)}
                                </div>
                                <div className="text-right text-sm text-white/85">
                                    {formatCurrency(inst.principalPayment)}
                                </div>
                                <div className="text-right text-sm text-white/85">
                                    {formatCurrency(inst.interestPayment)}
                                </div>
                                <div className="text-right text-sm text-white/85">
                                    {formatCurrency(inst.insurancePayment)}
                                </div>
                                <div className="text-right text-sm font-semibold text-white">
                                    {formatCurrency(inst.totalPayment)}
                                </div>
                                <div className="text-right text-sm text-(--nebula-muted)">
                                    {formatCurrency(inst.remainingBalance)}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

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
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
                <div className="flex items-center gap-2">
                    <Calculator className="h-4 w-4 text-slate-500" />
                    <h3 className="text-sm font-semibold text-slate-900">
                        Tableau d&apos;amortissement
                    </h3>
                    <span className="text-xs text-slate-400">
                        ({amortizationTable?.length || 0} échéances)
                    </span>
                </div>
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
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {amortizationTable?.map(
                            (inst: LoanInstallmentCalculation, index: number) => (
                                <tr
                                    key={inst.installmentNumber || `installment-${index}`}
                                    className="transition-colors hover:bg-slate-50/50"
                                >
                                    <td className="px-4 py-3 text-sm font-medium text-slate-900">
                                        {inst.installmentNumber || ''}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-slate-600">
                                        {formatDate(inst.dueDate)}
                                    </td>
                                    <td className="px-4 py-3 text-right text-sm text-slate-700">
                                        {formatCurrency(inst.principalPayment)}
                                    </td>
                                    <td className="px-4 py-3 text-right text-sm text-slate-700">
                                        {formatCurrency(inst.interestPayment)}
                                    </td>
                                    <td className="px-4 py-3 text-right text-sm text-slate-700">
                                        {formatCurrency(inst.insurancePayment)}
                                    </td>
                                    <td className="px-4 py-3 text-right text-sm font-semibold text-slate-900">
                                        {formatCurrency(inst.totalPayment)}
                                    </td>
                                    <td className="px-4 py-3 text-right text-sm text-slate-600">
                                        {formatCurrency(inst.remainingBalance)}
                                    </td>
                                </tr>
                            ),
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

'use client';

import React from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { ArrowRight } from 'lucide-react';
import { LoanCalculatorDto } from '@/types/loans';

interface LoanCharacteristicsFormProps {
    formData: LoanCalculatorDto;
    onInputChange: (field: keyof LoanCalculatorDto, value: string | number) => void;
    onValidate: () => void;
    isLoading: boolean;
}

export function LoanCharacteristicsForm({
    formData,
    onInputChange,
    onValidate,
    isLoading
}: LoanCharacteristicsFormProps) {
    return (
        <div className="nebula-glass rounded-3xl border border-white/10 p-6">
            <h3 className="mb-1 text-sm font-semibold text-white">
                Caractéristiques principales
            </h3>
            <p className="mb-5 text-xs text-(--nebula-muted)">
                Renseignez les informations essentielles de votre emprunt.
            </p>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                    <Label
                        htmlFor="loanName"
                        className="mb-1 block text-xs font-semibold uppercase tracking-wider text-(--nebula-muted)"
                    >
                        Nom de l&apos;emprunt <span className="text-red-500">*</span>
                    </Label>
                    <Input
                        id="loanName"
                        placeholder="ex: Prêt BNP Agence X"
                        value={formData.name}
                        onChange={(e) => onInputChange('name', e.target.value)}
                    />
                </div>
                <div>
                    <Label
                        htmlFor="principalAmount"
                        className="mb-1 block text-xs font-semibold uppercase tracking-wider text-(--nebula-muted)"
                    >
                        Capital emprunté (EUR) <span className="text-red-500">*</span>
                    </Label>
                    <Input
                        id="principalAmount"
                        type="number"
                        step="0.01"
                        min="0.01"
                        placeholder="ex: 200000"
                        value={formData.principalAmount || ''}
                        onChange={(e) =>
                            onInputChange('principalAmount', e.target.value)
                        }
                    />
                </div>
                <div>
                    <Label
                        htmlFor="annualInterestRate"
                        className="mb-1 block text-xs font-semibold uppercase tracking-wider text-(--nebula-muted)"
                    >
                        Taux d&apos;intérêt annuel (%){' '}
                        <span className="text-red-500">*</span>
                    </Label>
                    <Input
                        id="annualInterestRate"
                        type="number"
                        step="0.01"
                        min="0"
                        max="100"
                        placeholder="ex: 2.5"
                        value={formData.annualInterestRate || ''}
                        onChange={(e) =>
                            onInputChange('annualInterestRate', e.target.value)
                        }
                    />
                </div>
                <div>
                    <Label
                        htmlFor="duration"
                        className="mb-1 block text-xs font-semibold uppercase tracking-wider text-(--nebula-muted)"
                    >
                        Durée totale (mois) <span className="text-red-500">*</span>
                    </Label>
                    <Input
                        id="duration"
                        type="number"
                        min="1"
                        max="600"
                        placeholder="ex: 24"
                        value={formData.durationMonths || ''}
                        onChange={(e) =>
                            onInputChange('durationMonths', e.target.value)
                        }
                    />
                </div>
                <div className="md:col-span-2">
                    <Label
                        htmlFor="firstInstallmentDate"
                        className="mb-1 block text-xs font-semibold uppercase tracking-wider text-(--nebula-muted)"
                    >
                        Date de la première échéance{' '}
                        <span className="text-red-500">*</span>
                    </Label>
                    <Input
                        id="firstInstallmentDate"
                        type="date"
                        value={formData.firstInstallmentDate}
                        onChange={(e) =>
                            onInputChange('firstInstallmentDate', e.target.value)
                        }
                    />
                </div>
            </div>

            <div className="mt-6 flex justify-end border-t border-white/10 pt-5">
                <Button
                    onClick={onValidate}
                    disabled={isLoading}
                >
                    {isLoading ? 'Validation…' : 'Continuer'}
                    <ArrowRight className="h-4 w-4" />
                </Button>
            </div>
        </div>
    );
}

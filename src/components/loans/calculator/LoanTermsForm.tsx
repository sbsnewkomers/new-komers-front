'use client';

import React from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { ArrowLeft, Calculator } from 'lucide-react';
import { LoanCalculatorDto } from '@/types/loans';

interface LoanTermsFormProps {
    formData: LoanCalculatorDto;
    onInputChange: (field: keyof LoanCalculatorDto, value: string | number) => void;
    onGenerateSchedule: () => void;
    onBack: () => void;
    isLoading: boolean;
}

export function LoanTermsForm({
    formData,
    onInputChange,
    onGenerateSchedule,
    onBack,
    isLoading
}: LoanTermsFormProps) {
    return (
        <div className="nebula-glass rounded-3xl border border-white/10 p-6">
            <h3 className="mb-1 text-sm font-semibold text-white">
                Modalités spécifiques
            </h3>
            <p className="mb-5 text-xs text-(--nebula-muted)">
                Paramètres optionnels pour affiner votre échéancier.
            </p>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                    <Label
                        htmlFor="monthlyInsuranceCost"
                        className="mb-1 block text-xs font-semibold uppercase tracking-wider text-(--nebula-muted)"
                    >
                        Coût de l&apos;assurance mensuelle (EUR)
                    </Label>
                    <Input
                        id="monthlyInsuranceCost"
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="ex: 50.00"
                        value={formData.monthlyInsuranceCost || ''}
                        onChange={(e) =>
                            onInputChange('monthlyInsuranceCost', e.target.value)
                        }
                    />
                </div>
                <div>
                    <Label
                        htmlFor="deferralPeriodMonths"
                        className="mb-1 block text-xs font-semibold uppercase tracking-wider text-(--nebula-muted)"
                    >
                        Période de différé (mois)
                    </Label>
                    <Input
                        id="deferralPeriodMonths"
                        type="number"
                        min="0"
                        placeholder="ex: 6"
                        value={formData.deferralPeriodMonths || ''}
                        onChange={(e) =>
                            onInputChange('deferralPeriodMonths', e.target.value)
                        }
                    />
                    <p className="mt-1 text-xs text-(--nebula-muted)">
                        Durant cette période, seuls les intérêts et l&apos;assurance sont
                        payés.
                    </p>
                </div>
            </div>

            <div className="mt-6 flex items-center justify-between border-t border-white/10 pt-5">
                <Button variant="outline" onClick={onBack}>
                    <ArrowLeft className="h-4 w-4" />
                    Précédent
                </Button>
                <Button
                    onClick={onGenerateSchedule}
                    disabled={isLoading}
                >
                    {isLoading ? 'Génération…' : "Générer l'échéancier"}
                    <Calculator className="h-4 w-4" />
                </Button>
            </div>
        </div>
    );
}

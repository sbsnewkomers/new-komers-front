'use client';

import React from 'react';
import { Button } from '@/components/ui/Button';
import { Calculator, ArrowLeft } from 'lucide-react';
import { StepIndicator } from '@/components/ui/StepIndicator';

interface CalculatorHeaderProps {
    currentStep: number;
    onBack?: () => void;
}

export function CalculatorHeader({ currentStep, onBack }: CalculatorHeaderProps) {
    const steps = [
        { n: 1, label: 'Caractéristiques' },
        { n: 2, label: 'Modalités' },
        { n: 3, label: 'Validation' },
    ];

    return (
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            {onBack && (
                <Button
                    variant="outline"
                    onClick={onBack}
                    className="flex items-center gap-2 mb-4"
                >
                    <ArrowLeft className="h-4 w-4" />
                </Button>
            )}
            <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50">
                    <Calculator className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                    <h3 className="text-base font-semibold text-slate-900">
                        Calculatrice d&apos;emprunt intégrée
                    </h3>
                    <p className="text-xs text-slate-500">
                        Générez un échéancier complet à partir des caractéristiques de votre
                        prêt.
                    </p>
                </div>
            </div>
            <div className="mt-6">
                <StepIndicator currentStep={currentStep} steps={steps} />
            </div>
        </div>
    );
}

import React from 'react';
import { Check } from 'lucide-react';

interface StepIndicatorProps {
    currentStep: number;
}

const steps = [
    { n: 1, label: 'Fichier' },
    { n: 2, label: 'Mapping' },
    { n: 3, label: 'Résultat' },
];

export function StepIndicator({ currentStep }: StepIndicatorProps) {
    return (
        <div className="flex items-center">
            {steps.map((s, i) => {
                const isActive = currentStep === s.n;
                const isDone = currentStep > s.n;
                return (
                    <React.Fragment key={s.n}>
                        <div className="flex items-center gap-2">
                            <div
                                className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold transition-colors ${isDone
                                    ? 'bg-emerald-500 text-white'
                                    : isActive
                                        ? 'bg-primary text-white'
                                        : 'bg-slate-100 text-slate-400'
                                    }`}
                            >
                                {isDone ? <Check className="h-4 w-4" /> : s.n}
                            </div>
                            <span
                                className={`hidden text-xs font-medium sm:inline ${isActive
                                    ? 'text-slate-900'
                                    : isDone
                                        ? 'text-slate-700'
                                        : 'text-slate-400'
                                    }`}
                            >
                                {s.label}
                            </span>
                        </div>
                        {i < steps.length - 1 && (
                            <div
                                className={`mx-3 h-0.5 flex-1 rounded-full transition-colors ${currentStep > s.n ? 'bg-emerald-500' : 'bg-slate-200'
                                    }`}
                            />
                        )}
                    </React.Fragment>
                );
            })}
        </div>
    );
}

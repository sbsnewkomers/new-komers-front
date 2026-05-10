import React from 'react';
import { Button } from '@/components/ui/Button';
import { LoanInputMethod } from '@/types/loans';
import {
    Calculator,
    Upload,
    Edit3,
    ArrowLeft,
} from 'lucide-react';

interface LoanEditMethodSelectorProps {
    loanName: string;
    currentMethod: LoanInputMethod;
    onBack: () => void;
    onSelectMethod: (method: LoanInputMethod) => void;
}

export function LoanEditMethodSelector({
    loanName,
    currentMethod,
    onBack,
    onSelectMethod,
}: LoanEditMethodSelectorProps) {
    const methods = [
        {
            id: LoanInputMethod.CALCULATOR,
            title: 'Modification par calculatrice',
            description: 'Recalculez l\'échéancier en modifiant les paramètres du prêt (taux, durée, etc.)',
            icon: Calculator,
            recommended: currentMethod === LoanInputMethod.CALCULATOR,
        },
        {
            id: LoanInputMethod.IMPORT,
            title: 'Modification par import',
            description: 'Importez un nouveau fichier pour remplacer l\'échéancier existant',
            icon: Upload,
            recommended: currentMethod === LoanInputMethod.IMPORT,
        },
        {
            id: LoanInputMethod.MANUAL,
            title: 'Modification manuelle',
            description: 'Modifiez chaque échéance individuellement',
            icon: Edit3,
            recommended: currentMethod === LoanInputMethod.MANUAL,
        },
    ];

    return (
        <div className="space-y-6">
            <div className="nebula-glass nebula-blob flex flex-col gap-4 rounded-3xl border border-white/10 p-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        onClick={onBack}
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white/70 transition-colors hover:bg-white/10 hover:text-white"
                        aria-label="Retour"
                    >
                        <ArrowLeft className="h-4 w-4" />
                    </button>
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5">
                            <Edit3 className="h-5 w-5 text-(--nebula-gold-light)" />
                        </div>
                        <div>
                            <h3 className="text-base font-semibold text-white">
                                Modification de l&apos;emprunt
                            </h3>
                            <p className="text-xs text-(--nebula-muted)">{loanName}</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="nebula-glass rounded-3xl border border-white/10 p-6">
                <div className="mb-6">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-(--nebula-muted)">
                        § Méthode
                    </p>
                    <h3 className="mt-2 text-lg font-semibold text-white">
                        Choisissez la méthode de modification
                    </h3>
                    <p className="mt-1 text-sm text-(--nebula-muted)">
                        Sélectionnez la manière dont vous souhaitez modifier cet emprunt.
                        Chaque méthode a ses avantages selon vos besoins.
                    </p>
                </div>

                <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-3">
                    {methods.map((method) => {
                        const Icon = method.icon;
                        return (
                            <div
                                key={method.id}
                                className={[
                                    'relative cursor-pointer rounded-3xl border p-5 transition-all',
                                    method.recommended
                                        ? 'border-white/25 bg-white/10 ring-1 ring-(--nebula-gold-light)/30 nebula-glow'
                                        : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10',
                                ].join(' ')}
                                onClick={() => onSelectMethod(method.id)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' || e.key === ' ') {
                                        e.preventDefault();
                                        onSelectMethod(method.id);
                                    }
                                }}
                                role="button"
                                tabIndex={0}
                            >
                                {method.recommended && (
                                    <div className="absolute -top-2 -right-2">
                                        <span className="inline-flex items-center rounded-full border border-white/10 bg-linear-to-r from-(--nebula-gold-light) to-(--nebula-gold) px-2 py-1 text-xs font-medium text-white">
                                            Recommandé
                                        </span>
                                    </div>
                                )}

                                <div className="mb-3 flex items-center gap-3">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-(--nebula-gold-light)">
                                        <Icon className="h-5 w-5" />
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="font-semibold text-white">{method.title}</h4>
                                    </div>
                                </div>

                                <p className="text-sm leading-relaxed text-(--nebula-muted)">
                                    {method.description}
                                </p>

                                <Button
                                    variant={method.recommended ? 'default' : 'outline'}
                                    className="mt-4 w-full"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onSelectMethod(method.id);
                                    }}
                                >
                                    {method.recommended
                                        ? 'Utiliser cette méthode recommandée'
                                        : 'Choisir cette méthode'}
                                </Button>
                            </div>
                        );
                    })}
                </div>

                <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4">
                    <div className="flex items-start gap-3">
                        <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-amber-400/30 bg-amber-500/10 text-xs font-bold nebula-warning-icon">
                            !
                        </div>
                        <div className="text-sm">
                            <p className="mb-1 font-semibold text-white">Important</p>
                            <p className="text-(--nebula-muted)">
                                Changer de méthode de modification peut affecter la structure de vos données.
                                Par exemple, passer de manuel à calculatrice recréera l&apos;échéancier automatiquement.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

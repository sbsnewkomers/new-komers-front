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
            color: 'blue',
            recommended: currentMethod === LoanInputMethod.CALCULATOR,
        },
        {
            id: LoanInputMethod.IMPORT,
            title: 'Modification par import',
            description: 'Importez un nouveau fichier pour remplacer l&apos;échéancier existant',
            icon: Upload,
            color: 'green',
            recommended: currentMethod === LoanInputMethod.IMPORT,
        },
        {
            id: LoanInputMethod.MANUAL,
            title: 'Modification manuelle',
            description: 'Modifiez chaque échéance individuellement',
            icon: Edit3,
            color: 'purple',
            recommended: currentMethod === LoanInputMethod.MANUAL,
        },
    ];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        onClick={onBack}
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-900"
                        aria-label="Retour"
                    >
                        <ArrowLeft className="h-4 w-4" />
                    </button>
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50">
                            <Edit3 className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                            <h3 className="text-base font-semibold text-slate-900">
                                Modification de l&apos;emprunt
                            </h3>
                            <p className="text-xs text-slate-500">{loanName}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Method Selection */}
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="mb-6">
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">
                        Choisissez la méthode de modification
                    </h3>
                    <p className="text-sm text-slate-500">
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
                                className={`
                                    relative rounded-lg border-2 p-5 transition-all cursor-pointer
                                    ${method.recommended
                                        ? 'border-blue-200 bg-blue-50/30'
                                        : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                                    }
                                `}
                                onClick={() => onSelectMethod(method.id)}
                            >
                                {method.recommended && (
                                    <div className="absolute -top-2 -right-2">
                                        <span className="inline-flex items-center rounded-full bg-blue-600 px-2 py-1 text-xs font-medium text-white">
                                            Recommandé
                                        </span>
                                    </div>
                                )}

                                <div className="flex items-center gap-3 mb-3">
                                    <div className={`
                                        flex h-10 w-10 items-center justify-center rounded-lg
                                        ${method.color === 'blue' ? 'bg-blue-100 text-blue-600' : ''}
                                        ${method.color === 'green' ? 'bg-green-100 text-green-600' : ''}
                                        ${method.color === 'purple' ? 'bg-purple-100 text-purple-600' : ''}
                                    `}>
                                        <Icon className="h-5 w-5" />
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="font-semibold text-slate-900">
                                            {method.title}
                                        </h4>
                                    </div>
                                </div>

                                <p className="text-sm text-slate-600 leading-relaxed">
                                    {method.description}
                                </p>

                                <Button
                                    variant={method.recommended ? "default" : "outline"}
                                    className="w-full mt-4"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onSelectMethod(method.id);
                                    }}
                                >
                                    {method.recommended ? 'Utiliser cette méthode recommandée' : 'Choisir cette méthode'}
                                </Button>
                            </div>
                        );
                    })}
                </div>

                {/* Info Box */}
                <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50/80 p-4">
                    <div className="flex items-start gap-3">
                        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-100 text-amber-600 text-xs font-bold">
                            !
                        </div>
                        <div className="text-sm">
                            <p className="font-semibold text-amber-900 mb-1">
                                Important
                            </p>
                            <p className="text-amber-800">
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

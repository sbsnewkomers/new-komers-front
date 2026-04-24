import React from 'react';
import { Calculator, FileSpreadsheet, PenTool, Info, ArrowRight } from 'lucide-react';

interface LoanCreateProps {
    onMethodSelect: (method: 'calculator' | 'import' | 'manual') => void;
}

type Method = {
    key: 'calculator' | 'import' | 'manual';
    title: string;
    subtitle: string;
    description: string;
    icon: typeof Calculator;
    badge: string;
    accent: string;
    ring: string;
    iconBg: string;
    iconColor: string;
};

const methods: Method[] = [
    {
        key: 'calculator',
        title: 'Calculatrice intégrée',
        subtitle: 'La méthode la plus rapide',
        description:
            "Génère automatiquement un échéancier à partir des caractéristiques du prêt (capital, taux, durée).",
        icon: Calculator,
        badge: 'Recommandé',
        accent: 'bg-blue-50 text-blue-700 border-blue-200',
        ring: 'hover:border-blue-300 hover:shadow-md hover:shadow-blue-100/50',
        iconBg: 'bg-blue-50',
        iconColor: 'text-blue-600',
    },
    {
        key: 'import',
        title: 'Import Excel / CSV',
        subtitle: 'Importez vos données existantes',
        description:
            'Importe un échéancier depuis un fichier Excel ou CSV déjà préparé dans votre tableur.',
        icon: FileSpreadsheet,
        badge: 'Format standard',
        accent: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        ring: 'hover:border-emerald-300 hover:shadow-md hover:shadow-emerald-100/50',
        iconBg: 'bg-emerald-50',
        iconColor: 'text-emerald-600',
    },
    {
        key: 'manual',
        title: 'Saisie manuelle',
        subtitle: 'Contrôle total',
        description:
            'Saisit manuellement chaque échéance ou ajuste un échéancier existant ligne par ligne.',
        icon: PenTool,
        badge: 'Personnalisé',
        accent: 'bg-purple-50 text-purple-700 border-purple-200',
        ring: 'hover:border-purple-300 hover:shadow-md hover:shadow-purple-100/50',
        iconBg: 'bg-purple-50',
        iconColor: 'text-purple-600',
    },
];

export function LoanCreate({ onMethodSelect }: LoanCreateProps) {
    return (
        <div className="space-y-6">
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <h3 className="text-sm font-semibold text-slate-900">
                    Choisissez une méthode de création
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                    Sélectionnez la méthode qui correspond le mieux à votre besoin pour créer
                    votre échéancier d&apos;emprunt.
                </p>

                <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
                    {methods.map((m) => {
                        const Icon = m.icon;
                        return (
                            <button
                                key={m.key}
                                type="button"
                                onClick={() => onMethodSelect(m.key)}
                                className={`group flex h-full flex-col rounded-xl border border-slate-200 bg-white p-5 text-left transition-all ${m.ring}`}
                            >
                                <div className="flex items-start justify-between">
                                    <div
                                        className={`flex h-11 w-11 items-center justify-center rounded-lg ${m.iconBg}`}
                                    >
                                        <Icon className={`h-5 w-5 ${m.iconColor}`} />
                                    </div>
                                    <span
                                        className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide ${m.accent}`}
                                    >
                                        {m.badge}
                                    </span>
                                </div>

                                <div className="mt-4 flex-1">
                                    <h4 className="text-sm font-semibold text-slate-900">
                                        {m.title}
                                    </h4>
                                    <p className="mt-0.5 text-xs font-medium text-slate-500">
                                        {m.subtitle}
                                    </p>
                                    <p className="mt-2 text-xs leading-relaxed text-slate-500">
                                        {m.description}
                                    </p>
                                </div>

                                <div className="mt-4 flex items-center gap-1.5 text-xs font-medium text-slate-700 transition-colors group-hover:text-primary">
                                    Choisir cette méthode
                                    <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Help */}
            <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-5">
                <div className="flex items-start gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white ring-1 ring-slate-200">
                        <Info className="h-4 w-4 text-slate-500" />
                    </div>
                    <div>
                        <h4 className="text-sm font-semibold text-slate-900">Conseil de choix</h4>
                        <ul className="mt-2 space-y-1 text-xs text-slate-600">
                            <li>
                                <strong className="text-slate-800">Calculatrice</strong> &middot;
                                Idéal pour les nouveaux prêts avec des paramètres standards.
                            </li>
                            <li>
                                <strong className="text-slate-800">Import</strong> &middot; Parfait
                                si vous avez déjà un échéancier dans un tableur.
                            </li>
                            <li>
                                <strong className="text-slate-800">Manuel</strong> &middot; Pour les
                                cas complexes ou des ajustements précis.
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}

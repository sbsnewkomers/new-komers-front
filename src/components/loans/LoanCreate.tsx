import React from 'react';
import { Calculator, FileSpreadsheet, PenTool, Info, ArrowRight, ArrowLeft } from 'lucide-react';

interface LoanCreateProps {
    onMethodSelect: (method: 'calculator' | 'import' | 'manual') => void;
    onBack: () => void;
}

type Method = {
    key: 'calculator' | 'import' | 'manual';
    title: string;
    subtitle: string;
    description: string;
    icon: typeof Calculator;
    badge: string;
    recommended?: boolean;
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
        recommended: true,
    },
    {
        key: 'import',
        title: 'Import Excel / CSV',
        subtitle: 'Importez vos données existantes',
        description:
            'Importe un échéancier depuis un fichier Excel ou CSV déjà préparé dans votre tableur.',
        icon: FileSpreadsheet,
        badge: 'Format standard',
    },
    {
        key: 'manual',
        title: 'Saisie manuelle',
        subtitle: 'Contrôle total',
        description:
            'Saisit manuellement chaque échéance ou ajuste un échéancier existant ligne par ligne.',
        icon: PenTool,
        badge: 'Personnalisé',
    },
];

export function LoanCreate({ onMethodSelect, onBack }: LoanCreateProps) {
    return (
        <div className="space-y-6">
            <div className="nebula-glass rounded-3xl border border-white/10 p-6">
                <div className="mb-6">
                    <button
                        type="button"
                        onClick={onBack}
                        className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white/80 transition-colors hover:bg-white/10 hover:text-white"
                    >
                        <ArrowLeft className="h-4 w-4" />
                    </button>
                </div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-(--nebula-muted)">
                    § Choix de méthode
                </p>
                <h3 className="mt-2 text-lg font-semibold text-white">
                    Choisissez une méthode de création
                </h3>
                <p className="mt-1 text-sm text-(--nebula-muted)">
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
                                className={[
                                    'group flex h-full flex-col rounded-3xl border p-5 text-left transition-all',
                                    m.recommended
                                        ? 'border-white/25 bg-white/10 ring-1 ring-(--nebula-gold-light)/30 nebula-glow'
                                        : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10',
                                ].join(' ')}
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/5">
                                        <Icon className="h-5 w-5 text-(--nebula-gold-light)" />
                                    </div>
                                    <span className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-(--nebula-muted)">
                                        {m.badge}
                                    </span>
                                </div>

                                <div className="mt-4 flex-1">
                                    <h4 className="text-sm font-semibold text-white">{m.title}</h4>
                                    <p className="mt-0.5 text-xs font-medium text-(--nebula-muted)">
                                        {m.subtitle}
                                    </p>
                                    <p className="mt-2 text-xs leading-relaxed text-(--nebula-muted)">
                                        {m.description}
                                    </p>
                                </div>

                                <div className="mt-4 flex items-center gap-1.5 text-xs font-medium text-(--nebula-gold-light) transition-colors group-hover:text-[var(--foreground)]">
                                    Choisir cette méthode
                                    <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>

            <div className="nebula-glass rounded-3xl border border-white/10 p-5">
                <div className="flex items-start gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5">
                        <Info className="h-4 w-4 text-white/60" />
                    </div>
                    <div>
                        <h4 className="text-sm font-semibold text-white">Conseil de choix</h4>
                        <ul className="mt-2 space-y-1 text-xs text-(--nebula-muted)">
                            <li>
                                <strong className="text-white/90">Calculatrice</strong> &middot;
                                Idéal pour les nouveaux prêts avec des paramètres standards.
                            </li>
                            <li>
                                <strong className="text-white/90">Import</strong> &middot; Parfait
                                si vous avez déjà un échéancier dans un tableur.
                            </li>
                            <li>
                                <strong className="text-white/90">Manuel</strong> &middot; Pour les
                                cas complexes ou des ajustements précis.
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}

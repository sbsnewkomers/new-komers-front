'use client';

import React from 'react';
import { Button } from '@/components/ui/Button';
import { Edit, ArrowLeft } from 'lucide-react';

interface ManualEntryHeaderProps {
    onBack?: () => void;
}

export function ManualEntryHeader({ onBack }: ManualEntryHeaderProps) {
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
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-50">
                    <Edit className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                    <h3 className="text-base font-semibold text-slate-900">
                        Saisie manuelle ou ajustement
                    </h3>
                    <p className="text-xs text-slate-500">
                        Pour les prêts complexes ou pour ajuster une échéance spécifique.
                    </p>
                </div>
            </div>
        </div>
    );
}

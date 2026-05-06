'use client';

import React from 'react';
import { Button } from '@/components/ui/Button';
import { Trash2, Save } from 'lucide-react';

interface ActionsPanelProps {
    isLoading: boolean;
    installmentsCount: number;
    onClear: () => void;
    onSave: () => void;
    hideClear?: boolean;
    saveButtonText?: string;
}

export function ActionsPanel({
    isLoading,
    installmentsCount,
    onClear,
    onSave,
    hideClear,
    saveButtonText,
}: ActionsPanelProps) {
    return (
        <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
            {!hideClear && (
                <Button
                    variant="outline"
                    onClick={onClear}
                    disabled={installmentsCount === 0}
                >
                    <Trash2 className="h-4 w-4" />
                    Tout effacer
                </Button>
            )}
            <Button
                onClick={onSave}
                disabled={isLoading}
                className="bg-primary text-white hover:bg-slate-800"
            >
                {isLoading ? 'Sauvegarde…' : (saveButtonText || "Sauvegarder l'emprunt")}
                <Save className="h-4 w-4" />
            </Button>
        </div>
    );
}

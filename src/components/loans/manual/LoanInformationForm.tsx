'use client';

import React from 'react';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Select } from '@/components/ui/Select';
import { EntityType } from '@/types/loans';

interface LoanInformationFormProps {
    loanName: string;
    onLoanNameChange: (value: string) => void;
    selectedEntityType: EntityType;
    onEntityTypeChange: (value: string) => void;
    selectedEntityId: string;
    onEntityIdChange: (value: string) => void;
    entities: Array<{ id: string; name: string }>;
    nameValidationError: string | null;
}

export function LoanInformationForm({
    loanName,
    onLoanNameChange,
    selectedEntityType,
    onEntityTypeChange,
    selectedEntityId,
    onEntityIdChange,
    entities,
    nameValidationError,
}: LoanInformationFormProps) {
    return (
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="mb-1 text-sm font-semibold text-slate-900">
                Informations sur l&apos;emprunt
            </h3>
            <p className="mb-5 text-xs text-slate-500">
                Renseignez les informations de base de votre emprunt.
            </p>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div>
                    <Label
                        htmlFor="loanName"
                        className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500"
                    >
                        Nom de l&apos;emprunt <span className="text-red-500">*</span>
                    </Label>
                    <Input
                        id="loanName"
                        placeholder="ex: Prêt BNP Agence X"
                        value={loanName}
                        onChange={(e) => onLoanNameChange(e.target.value)}
                        className={nameValidationError ? 'border-red-500' : ''}
                    />
                    {nameValidationError && (
                        <p className="mt-1 text-xs text-red-600">
                            {nameValidationError}
                        </p>
                    )}
                </div>
                <div>
                    <Label
                        htmlFor="entityType"
                        className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500"
                    >
                        Type d&apos;entité <span className="text-red-500">*</span>
                    </Label>
                    <Select
                        value={selectedEntityType}
                        onValueChange={onEntityTypeChange}
                    >
                        <option value={EntityType.GROUP}>Groupe</option>
                        <option value={EntityType.COMPANY}>Entreprise</option>
                        <option value={EntityType.BUSINESSUNIT}>
                            Unité d&apos;affaires
                        </option>
                    </Select>
                </div>
                <div>
                    <Label
                        htmlFor="entityId"
                        className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500"
                    >
                        Entité <span className="text-red-500">*</span>
                    </Label>
                    <Select
                        id="entityId"
                        value={selectedEntityId || ''}
                        onValueChange={onEntityIdChange}
                        disabled={!selectedEntityType}
                    >
                        <option value="">Sélectionner une entité…</option>
                        {entities.map((entity) => (
                            <option key={entity.id} value={entity.id}>
                                {entity.name}
                            </option>
                        ))}
                    </Select>
                </div>
            </div>
        </div>
    );
}

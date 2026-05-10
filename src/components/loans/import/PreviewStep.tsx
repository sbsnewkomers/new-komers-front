import React from 'react';
import { Button } from '@/components/ui/Button';
import { FileText, CheckCircle, ArrowLeft, ArrowRight } from 'lucide-react';
import { ColumnMappingDto, ImportPreviewDto, ImportErrorDto, ImportResultDto } from '@/types/loans';
import { getValidationErrors } from './ValidationUtils';
import { ErrorReport } from './ErrorReport';
import { PreviewTable } from './PreviewTable';

interface PreviewStepProps {
    loanName: string;
    selectedEntityId: string;
    entities: Array<{ id: string; name: string }>;
    selectedFile: File | null;
    columnMapping: ColumnMappingDto[];
    preview: ImportPreviewDto | null;
    importResult: ImportResultDto | null;
    isLoading: boolean;
    onModifyMapping: () => void;
    onSaveImport: () => void;
    onNewImport: () => void;
    onViewLoan: (loanId: string) => void;
    validationErrors?: ImportErrorDto[];
}

const requiredFields = [
    'dueDate',
    'principalPayment',
    'interestPayment',
    'insurancePayment',
] as const;

export function PreviewStep({
    loanName,
    selectedEntityId,
    entities,
    selectedFile,
    columnMapping,
    preview,
    importResult,
    isLoading,
    onModifyMapping,
    onSaveImport,
    onNewImport,
    onViewLoan,
    validationErrors,
}: PreviewStepProps) {
    // Calculate validation errors for preview
    const previewValidationErrors = React.useMemo(() => {
        return getValidationErrors(preview, columnMapping);
    }, [preview, columnMapping]);

    // Combine provided errors with preview validation errors
    const allErrors = React.useMemo(() => {
        const errors = [...(validationErrors || [])];
        if (!importResult) {
            errors.push(...previewValidationErrors);
        }
        return errors;
    }, [validationErrors, previewValidationErrors, importResult]);

    const hasErrors = allErrors.length > 0;

    if (!importResult) {
        // Preview before import
        return (
            <div className="nebula-glass rounded-3xl border border-white/10 p-6">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10">
                        <FileText className="h-5 w-5 text-(--nebula-gold-light)" />
                    </div>
                    <div>
                        <h3 className="text-base font-semibold text-white">
                            Prévisualisation de l&apos;import
                        </h3>
                        <p className="text-xs text-(--nebula-muted)">
                            Vérifiez les informations avant de finaliser l&apos;import.
                        </p>
                    </div>
                </div>

                <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {[
                        {
                            label: 'Emprunt',
                            value: loanName || 'Prêt importé',
                        },
                        {
                            label: 'Entité',
                            value: entities.find(e => e.id === selectedEntityId)?.name || 'Entité sélectionnée',
                        },
                        {
                            label: 'Colonnes mappées',
                            value: `${columnMapping.length} / ${requiredFields.length}`,
                        },
                        {
                            label: 'Fichier source',
                            value: selectedFile?.name || 'Fichier sélectionné',
                        },
                        {
                            label: 'Lignes détectées',
                            value: preview?.totalRows || 'N/A',
                        },
                        {
                            label: 'Statut',
                            value: hasErrors ? 'Erreurs détectées' : 'Prêt à importer',
                        },
                    ].map((stat) => (
                        <div
                            key={stat.label}
                            className="rounded-xl border border-white/10 bg-white/5 p-3"
                        >
                            <p className="text-[10px] font-semibold uppercase tracking-wider text-(--nebula-muted)">
                                {stat.label}
                            </p>
                            <p className="mt-0.5 text-sm font-medium text-white break-words">
                                {stat.value}
                            </p>
                        </div>
                    ))}
                </div>

                <ErrorReport errors={allErrors} totalRows={preview?.totalRows} />

                <PreviewTable preview={preview} columnMapping={columnMapping} errors={allErrors} />

                <div className="mt-6 flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/5 p-5 sm:flex-row sm:items-center sm:justify-between">
                    <Button variant="outline" onClick={onModifyMapping}>
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Retourner au mapping
                    </Button>
                    <Button
                        onClick={onSaveImport}
                        disabled={columnMapping.length < requiredFields.length || isLoading || hasErrors}
                    >
                        {isLoading ? 'Import…' : 'Sauvegarder l\'import'}
                        <CheckCircle className="h-4 w-4 ml-2" />
                    </Button>
                </div>
            </div>
        );
    }

    // Results after successful import
    return (
        <>
            <div className="nebula-glass rounded-3xl border border-amber-500/25 bg-amber-500/5 p-6">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/15">
                        <CheckCircle className="h-5 w-5 text-amber-300" />
                    </div>
                    <div>
                        <h3 className="text-base font-semibold text-white">
                            Import réussi
                        </h3>
                        <p className="text-xs text-amber-700">
                            L&apos;échéancier a été importé avec succès.
                        </p>
                    </div>
                </div>

                <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {[
                        {
                            label: 'Emprunt',
                            value: loanName || 'Prêt importé',
                        },
                        {
                            label: 'Total des échéances',
                            value: `${importResult?.totalRows || 0}`,
                        },
                        {
                            label: 'Taux de réussite',
                            value: `${Math.round(((importResult?.importedRows || 0) / (importResult?.totalRows || 1)) * 100)}%`,
                        },
                        {
                            label: 'Fichier source',
                            value: selectedFile?.name || 'Fichier importé',
                        },
                        {
                            label: 'Lignes importées',
                            value: `${importResult?.importedRows} / ${importResult?.totalRows}`,
                        },
                        {
                            label: 'Statut',
                            value: importResult?.status === 'COMPLETED' ? 'Terminé' : 'En cours',
                        },
                    ].map((stat) => (
                        <div
                            key={stat.label}
                            className="rounded-xl border border-white/10 bg-white/5 p-3"
                        >
                            <p className="text-[10px] font-semibold uppercase tracking-wider text-amber-700">
                                {stat.label}
                            </p>
                            <p className="mt-0.5 text-sm font-medium text-white break-words">
                                {stat.value}
                            </p>
                        </div>
                    ))}
                </div>
            </div>

            <div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/5 p-5 sm:flex-row sm:items-center sm:justify-between">
                <Button variant="outline" onClick={onNewImport}>
                    Nouvel import
                </Button>
                {importResult && importResult.loanId && (
                    <Button
                        onClick={() => onViewLoan(importResult.loanId!)}
                    >
                        Voir l&apos;emprunt
                        <ArrowRight className="h-4 w-4" />
                    </Button>
                )}
            </div>
        </>
    );
}

import React from 'react';
import { Button } from '@/components/ui/Button';
import { FileText, CheckCircle, ArrowLeft, ArrowRight } from 'lucide-react';
import { LoanImport, ColumnMappingDto, ImportPreviewDto, ImportErrorDto } from '@/types/loans';
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
    importResult: LoanImport | null;
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
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50">
                        <FileText className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                        <h3 className="text-base font-semibold text-slate-900">
                            Prévisualisation de l&apos;import
                        </h3>
                        <p className="text-xs text-slate-500">
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
                            className="rounded-lg border border-slate-100 bg-white p-3"
                        >
                            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                                {stat.label}
                            </p>
                            <p className="mt-0.5 text-sm font-medium text-slate-900 break-words">
                                {stat.value}
                            </p>
                        </div>
                    ))}
                </div>

                <ErrorReport errors={allErrors} totalRows={preview?.totalRows} />

                <PreviewTable preview={preview} columnMapping={columnMapping} errors={allErrors} />

                <div className="mt-6 flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
                    <Button variant="outline" onClick={onModifyMapping}>
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Retourner au mapping
                    </Button>
                    <Button
                        onClick={onSaveImport}
                        disabled={columnMapping.length < requiredFields.length || isLoading || hasErrors}
                        className={`${hasErrors ? 'bg-gray-400 cursor-not-allowed' : 'bg-primary text-white hover:bg-slate-800'}`}
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
            <div className="rounded-xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-white p-6 shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100">
                        <CheckCircle className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div>
                        <h3 className="text-base font-semibold text-emerald-900">
                            Import réussi
                        </h3>
                        <p className="text-xs text-emerald-700">
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
                            label: 'Capital',
                            value: 'N/A',
                        },
                        {
                            label: 'Durée',
                            value: 'N/A',
                        },
                        {
                            label: 'Fichier source',
                            value: importResult?.originalFileName || 'Fichier importé',
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
                            className="rounded-lg border border-emerald-100 bg-white p-3"
                        >
                            <p className="text-[10px] font-semibold uppercase tracking-wider text-emerald-600">
                                {stat.label}
                            </p>
                            <p className="mt-0.5 text-sm font-medium text-slate-900 break-words">
                                {stat.value}
                            </p>
                        </div>
                    ))}
                </div>
            </div>

            <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
                <Button variant="outline" onClick={onNewImport}>
                    Nouvel import
                </Button>
                {importResult && importResult.loanId && (
                    <Button
                        onClick={() => onViewLoan(importResult.loanId!)}
                        className="bg-primary text-white hover:bg-slate-800"
                    >
                        Voir l&apos;emprunt
                        <ArrowRight className="h-4 w-4" />
                    </Button>
                )}
            </div>
        </>
    );
}

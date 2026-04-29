import React from 'react';
import { Button } from '@/components/ui/Button';
import { FileText, CheckCircle, ArrowLeft, ArrowRight } from 'lucide-react';
import { LoanImport, ColumnMappingDto, ImportPreviewDto } from '@/types/loans';

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
}

const requiredFields = [
    'dueDate',
    'principalPayment',
    'interestPayment',
    'insurancePayment',
] as const;

const fieldLabel = (field: string) =>
    field === 'dueDate'
        ? 'Date'
        : field === 'principalPayment'
            ? 'Capital'
            : field === 'interestPayment'
                ? 'Intérêts'
                : field === 'insurancePayment'
                    ? 'Assurance'
                    : field;

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
}: PreviewStepProps) {
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
                            Prévisualisation de l'import
                        </h3>
                        <p className="text-xs text-slate-500">
                            Vérifiez les informations avant de finaliser l'import.
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
                            value: 'Prêt à importer',
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

                {/* Preview Table */}
                <div className="mt-6 rounded-lg border border-slate-200 bg-white p-4">
                    <h4 className="mb-3 text-sm font-semibold text-slate-900">
                        Aperçu des données (avec mapping appliqué)
                    </h4>
                    <p className="mb-4 text-xs text-slate-500">
                        Les 5 premières lignes de votre fichier avec les colonnes mappées.
                    </p>
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse border border-slate-300 text-sm">
                            <thead>
                                <tr className="bg-slate-50">
                                    <th className="border border-slate-300 p-2 text-left font-semibold text-xs">
                                        Ligne
                                    </th>
                                    {columnMapping.map((mapping) => (
                                        <th
                                            key={mapping.targetField}
                                            className="border border-slate-300 p-2 text-left font-semibold text-xs"
                                        >
                                            {fieldLabel(mapping.targetField)}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {preview?.previewRows?.slice(0, 5).map((row, index) => (
                                    <tr key={index} className="hover:bg-slate-50">
                                        <td className="border border-slate-300 p-2 text-xs font-medium">
                                            {index + 1}
                                        </td>
                                        {columnMapping.map((mapping) => (
                                            <td
                                                key={mapping.targetField}
                                                className="border border-slate-300 p-2 text-xs font-mono"
                                            >
                                                {row[mapping.sourceColumn] || '-'}
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                                {(!preview?.previewRows || preview.previewRows.length === 0) && (
                                    <tr>
                                        <td
                                            colSpan={columnMapping.length + 1}
                                            className="border border-slate-300 p-4 text-center text-xs text-slate-500"
                                        >
                                            Aucune donnée de prévisualisation disponible. 
                                            Les données seront traitées lors de l'import.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    {preview?.totalRows && preview.totalRows > 5 && (
                        <p className="mt-3 text-xs text-slate-500 text-center">
                            ... et {preview.totalRows - 5} lignes supplémentaires
                        </p>
                    )}
                </div>

                <div className="mt-6 flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
                    <Button variant="outline" onClick={onModifyMapping}>
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Modifier le mapping
                    </Button>
                    <Button
                        onClick={onSaveImport}
                        disabled={columnMapping.length < requiredFields.length || isLoading}
                        className="bg-primary text-white hover:bg-slate-800"
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

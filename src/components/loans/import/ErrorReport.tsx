import React from 'react';
import { AlertTriangle, XCircle, Download, FileText } from 'lucide-react';
import { ImportErrorDto } from '@/types/loans';

interface ErrorReportProps {
    errors: ImportErrorDto[];
    totalRows?: number;
}

const MAX_DISPLAYED_ERRORS = 2;

export function ErrorReport({ errors, totalRows }: ErrorReportProps) {
    if (errors.length === 0) return null;

    const errorRows = new Set(errors.map(error => error.rowNumber));
    const errorCount = errorRows.size;
    const hasManyErrors = errorCount > MAX_DISPLAYED_ERRORS;

    // Get rows to display (limit by number of rows, not errors)
    const rowsToDisplay = hasManyErrors
        ? Array.from(errorRows).slice(0, MAX_DISPLAYED_ERRORS)
        : Array.from(errorRows);

    // Get errors for displayed rows only
    const displayedErrors = errors.filter(error => rowsToDisplay.includes(error.rowNumber));
    const displayedErrorRows = new Set(displayedErrors.map(error => error.rowNumber));

    const downloadErrorReport = () => {
        // Create CSV content
        const csvContent = [
            'Ligne,Erreur',
            ...errors.map(error => {
                return `${error.rowNumber},"${error.errorMessage}"`;
            })
        ].join('\n');

        // Create and download file
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `rapport_erreurs_import_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-100">
                    <AlertTriangle className="h-5 w-5 text-red-600" />
                </div>
                <div>
                    <h4 className="text-base font-semibold text-red-900">
                        Rapport d&apos;erreurs
                    </h4>
                    <p className="text-xs text-red-700">
                        {errorCount} ligne(s) contenant des erreurs ont été détectées.
                    </p>
                </div>
            </div>

            {/* Error Statistics */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 mb-4">
                <div className="rounded-lg border border-red-100 bg-white p-3">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-red-600">
                        Total erreurs
                    </p>
                    <p className="mt-0.5 text-sm font-medium text-slate-900">
                        {errors.length}
                    </p>
                </div>
                <div className="rounded-lg border border-red-100 bg-white p-3">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-red-600">
                        Lignes affectées
                    </p>
                    <p className="mt-0.5 text-sm font-medium text-slate-900">
                        {errorCount}
                    </p>
                </div>
                <div className="rounded-lg border border-red-100 bg-white p-3">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-red-600">
                        Lignes valides
                    </p>
                    <p className="mt-0.5 text-sm font-medium text-slate-900">
                        {totalRows ? String(totalRows - errorCount) : 'N/A'}
                    </p>
                </div>
            </div>

            {/* Error Details */}
            <div className="rounded-lg border border-red-200 bg-white p-4">
                <div className="flex items-center justify-between mb-3">
                    <h5 className="text-sm font-semibold text-red-900">
                        {hasManyErrors
                            ? `Détail des erreurs (${MAX_DISPLAYED_ERRORS} premiers lignes)`
                            : 'Détail des erreurs'
                        }
                    </h5>
                    {hasManyErrors && (
                        <button
                            onClick={downloadErrorReport}
                            className="flex items-center gap-2 px-3 py-1 text-xs bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                        >
                            <Download className="h-3 w-3" />
                            Télécharger tout
                        </button>
                    )}
                </div>

                {hasManyErrors && (
                    <div className="mb-3 p-2 bg-amber-50 border border-amber-200 rounded-lg">
                        <p className="text-xs text-amber-800">
                            <FileText className="h-3 w-3 inline mr-1" />
                            Téléchargez le rapport complet pour voir toutes les erreurs.
                        </p>
                    </div>
                )}

                <div className="max-h-64 overflow-y-auto space-y-2">
                    {Array.from(displayedErrorRows).sort((a, b) => a - b).map(rowNumber => {
                        const rowErrors = displayedErrors.filter(error => error.rowNumber === rowNumber);
                        return (
                            <div key={rowNumber} className="rounded-lg border border-red-100 bg-red-50 p-3">
                                <div className="flex items-center gap-2 mb-2">
                                    <XCircle className="h-4 w-4 text-red-500" />
                                    <span className="text-sm font-semibold text-red-900">
                                        Ligne {rowNumber}
                                    </span>
                                </div>
                                <ul className="space-y-1">
                                    {rowErrors.map((error, index) => (
                                        <li key={index} className="text-xs text-red-700 flex items-start gap-2">
                                            <span className="text-red-400 mt-0.5">•</span>
                                            <span>{error.errorMessage}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

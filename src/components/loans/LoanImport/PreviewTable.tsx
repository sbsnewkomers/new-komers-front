import React from 'react';
import { AlertTriangle, Info } from 'lucide-react';
import { ColumnMappingDto, ImportPreviewDto, ImportErrorDto } from '@/types/loans';
import { fieldLabel } from './ValidationUtils';

interface PreviewTableProps {
    preview: ImportPreviewDto | null;
    columnMapping: ColumnMappingDto[];
    errors: ImportErrorDto[];
}

export function PreviewTable({ preview, columnMapping, errors }: PreviewTableProps) {
    const errorRows = new Set(errors.map(error => error.rowNumber));
    
    return (
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
                        {preview?.previewRows?.slice(0, 5).map((row, index) => {
                            const rowNumber = index + 1;
                            const hasRowErrors = errorRows.has(rowNumber);
                            const rowErrors = errors.filter(error => error.rowNumber === rowNumber);
                            
                            return (
                                <tr 
                                    key={index} 
                                    className={`hover:bg-slate-50 ${hasRowErrors ? 'bg-red-50 border-red-200' : ''}`}
                                >
                                    <td className={`border border-slate-300 p-2 text-xs font-medium ${hasRowErrors ? 'border-red-300 bg-red-100' : ''}`}>
                                        <div className="flex items-center gap-1">
                                            {rowNumber}
                                            {hasRowErrors && <AlertTriangle className="h-3 w-3 text-red-500" />}
                                        </div>
                                    </td>
                                    {columnMapping.map((mapping) => {
                                        const value = row[mapping.sourceColumn];
                                        const fieldErrors = rowErrors.filter(error => 
                                            error.errorMessage.includes(fieldLabel(mapping.targetField))
                                        );
                                        const hasFieldError = fieldErrors.length > 0;
                                        
                                        return (
                                            <td
                                                key={mapping.targetField}
                                                className={`border border-slate-300 p-2 text-xs font-mono ${hasFieldError ? 'border-red-300 bg-red-100 text-red-700' : ''}`}
                                            >
                                                {value !== null && value !== undefined && value !== '' ? String(value) : '-'}
                                                {hasFieldError && (
                                                    <div className="mt-1 text-xs text-red-600">
                                                        <Info className="h-3 w-3 inline mr-1" />
                                                        Erreur
                                                    </div>
                                                )}
                                            </td>
                                        );
                                    })}
                                </tr>
                            );
                        })}
                        {(!preview?.previewRows || preview.previewRows.length === 0) && (
                            <tr>
                                <td
                                    colSpan={columnMapping.length + 1}
                                    className="border border-slate-300 p-4 text-center text-xs text-slate-500"
                                >
                                    Aucune donnée de prévisualisation disponible. 
                                    Les données seront traitées lors de l&apos;import.
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
    );
}

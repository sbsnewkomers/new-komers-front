import React from 'react';
import { AlertTriangle, Info } from 'lucide-react';
import { ColumnMappingDto, ImportPreviewDto, ImportErrorDto } from '@/types/loans';
import { fieldLabel } from './ValidationUtils';
import { formatDateFR } from '@/lib/format';

// Helper function to format display values
const formatDisplayValue = (value: unknown, targetField: string): string => {
    if (value === null || value === undefined || value === '') {
        return '-';
    }

    const stringValue = String(value);

    // Format dates for display
    if (targetField === 'dueDate') {
        // Handle Excel serial dates
        if (/^\d+$/.test(stringValue)) {
            const excelSerial = parseInt(stringValue, 10);
            if (excelSerial > 0 && excelSerial < 100000) {
                try {
                    // Excel epoch starts on 1900-01-01, but Excel incorrectly treats 1900 as a leap year
                    const excelEpoch = new Date(1900, 0, 1);
                    const daysToSubtract = excelSerial > 59 ? 1 : 0;
                    const parsedDate = new Date(excelEpoch.getTime() + (excelSerial - 1 - daysToSubtract) * 24 * 60 * 60 * 1000);

                    if (!isNaN(parsedDate.getTime())) {
                        return formatDateFR(parsedDate, { fallback: stringValue });
                    }
                } catch {
                    // If conversion fails, return original value
                }
            }
        }

        // Handle other date formats - return as-is for display
        return stringValue;
    }

    // For numeric fields, format with 2 decimal places if it's a number
    if (targetField === 'principalPayment' || targetField === 'interestPayment' || targetField === 'insurancePayment') {
        const numValue = Number(value);
        if (!isNaN(numValue)) {
            return numValue.toFixed(2);
        }
    }

    return stringValue;
};

interface PreviewTableProps {
    preview: ImportPreviewDto | null;
    columnMapping: ColumnMappingDto[];
    errors: ImportErrorDto[];
}

export function PreviewTable({ preview, columnMapping, errors }: PreviewTableProps) {
    const errorRows = new Set(errors.map(error => error.rowNumber));

    return (
        <div className="nebula-glass mt-6 rounded-3xl border border-white/10 p-4">
            <h4 className="mb-1 text-sm font-semibold text-white">
                Aperçu des données (avec mapping appliqué)
            </h4>
            <p className="mb-4 text-xs text-(--nebula-muted)">
                Les 5 premières lignes de votre fichier avec les colonnes mappées.
            </p>
            <div className="overflow-x-auto">
              <div className="min-w-[760px]">
                <div
                  className="grid gap-3 border-b border-white/10 bg-white/5 px-3 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-(--nebula-muted)"
                  style={{
                    gridTemplateColumns: `90px repeat(${columnMapping.length}, minmax(140px, 1fr))`,
                  }}
                >
                  <div>Ligne</div>
                  {columnMapping.map((mapping) => (
                    <div key={mapping.targetField}>{fieldLabel(mapping.targetField)}</div>
                  ))}
                </div>

                <div className="divide-y divide-white/10">
                  {preview?.previewRows?.slice(0, 5).map((row, index) => {
                    const rowNumber = index + 1;
                    const hasRowErrors = errorRows.has(rowNumber);
                    const rowErrors = errors.filter((error) => error.rowNumber === rowNumber);

                    return (
                      <div
                        key={index}
                        className={[
                          "grid gap-3 px-3 py-2 transition-colors hover:bg-white/5",
                          hasRowErrors ? "bg-red-500/5" : "",
                        ].join(" ")}
                        style={{
                          gridTemplateColumns: `90px repeat(${columnMapping.length}, minmax(140px, 1fr))`,
                        }}
                      >
                        <div className="text-xs font-medium text-white">
                          <div className="flex items-center gap-1">
                            {rowNumber}
                            {hasRowErrors ? (
                              <AlertTriangle className="h-3 w-3 text-red-300" />
                            ) : null}
                          </div>
                        </div>

                        {columnMapping.map((mapping) => {
                          const value = row[mapping.sourceColumn];
                          const fieldErrors = rowErrors.filter((error) =>
                            error.errorMessage.includes(fieldLabel(mapping.targetField)),
                          );
                          const hasFieldError = fieldErrors.length > 0;

                          return (
                            <div
                              key={mapping.targetField}
                              className={[
                                "text-xs font-mono text-white/80",
                                hasFieldError ? "text-red-200" : "",
                              ].join(" ")}
                            >
                              {formatDisplayValue(value, mapping.targetField)}
                              {hasFieldError ? (
                                <div className="mt-1 text-xs text-red-200/90">
                                  <Info className="h-3 w-3 inline mr-1" />
                                  Erreur
                                </div>
                              ) : null}
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}

                  {(!preview?.previewRows || preview.previewRows.length === 0) && (
                    <div className="px-3 py-6 text-center text-xs text-(--nebula-muted)">
                      Aucune donnée de prévisualisation disponible. Les données seront traitées lors
                      de l&apos;import.
                    </div>
                  )}
                </div>
              </div>
            </div>
            {preview?.totalRows && preview.totalRows > 5 && (
                <p className="mt-3 text-xs text-(--nebula-muted) text-center">
                    ... et {preview.totalRows - 5} lignes supplémentaires
                </p>
            )}
        </div>
    );
}

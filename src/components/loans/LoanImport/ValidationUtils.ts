import { ImportErrorDto, ColumnMappingDto, ImportPreviewDto } from '@/types/loans';

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

export const validateRowData = (row: Record<string, unknown>, rowIndex: number, columnMapping: ColumnMappingDto[]): ImportErrorDto[] => {
    const errors: ImportErrorDto[] = [];

    // Check if row is empty
    const hasAnyData = columnMapping.some(mapping => {
        const value = row[mapping.sourceColumn];
        return value !== null && value !== undefined && value !== '';
    });

    if (!hasAnyData) {
        errors.push({
            rowNumber: rowIndex + 1,
            errorMessage: 'Ligne vide - aucune donnée détectée',
            rowData: row
        });
        return errors;
    }

    // Validate each mapped field
    columnMapping.forEach(mapping => {
        const value = row[mapping.sourceColumn];
        const fieldName = fieldLabel(mapping.targetField);

        // Check for empty required fields
        if (value === null || value === undefined || value === '') {
            errors.push({
                rowNumber: rowIndex + 1,
                errorMessage: `Champ '${fieldName}' vide ou manquant`,
                rowData: row
            });
            return;
        }

        // Field-specific validations
        if (mapping.targetField === 'dueDate') {
            const dateValue = String(value);
            const dateRegex = /^\d{4}-\d{2}-\d{2}$|^\d{2}\/\d{2}\/\d{4}$|^\d{2}-\d{2}-\d{4}$/;
            if (!dateRegex.test(dateValue)) {
                errors.push({
                    rowNumber: rowIndex + 1,
                    errorMessage: `Format de date invalide pour '${fieldName}'. Formats attendus: YYYY-MM-DD, DD/MM/YYYY ou DD-MM-YYYY`,
                    rowData: row
                });
            }
        }

        if (mapping.targetField === 'principalPayment') {
            const numValue = Number(value);
            if (isNaN(numValue) || numValue <= 0) {
                errors.push({
                    rowNumber: rowIndex + 1,
                    errorMessage: `Le champ '${fieldName}' doit être un nombre positif et non nul`,
                    rowData: row
                });
            }
        }

        if (mapping.targetField === 'interestPayment' || mapping.targetField === 'insurancePayment') {
            const numValue = Number(value);
            if (value !== null && value !== undefined && value !== '' && (isNaN(numValue) || numValue < 0)) {
                errors.push({
                    rowNumber: rowIndex + 1,
                    errorMessage: `Le champ '${fieldName}' doit être un nombre positif`,
                    rowData: row
                });
            }
        }
    });

    return errors;
};

export const getValidationErrors = (preview: ImportPreviewDto | null, columnMapping: ColumnMappingDto[]): ImportErrorDto[] => {
    if (!preview || !preview.previewRows || columnMapping.length === 0) {
        return [];
    }

    const allErrors: ImportErrorDto[] = [];

    preview.previewRows.forEach((row, index) => {
        const rowErrors = validateRowData(row, index, columnMapping);
        allErrors.push(...rowErrors);
    });

    return allErrors;
};

export { fieldLabel };

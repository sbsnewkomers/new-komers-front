import { ImportErrorDto, ColumnMappingDto, ImportPreviewDto } from '@/types/loans';

// Constants
const FIELD_LABELS = {
    dueDate: 'Date',
    principalPayment: 'Capital',
    interestPayment: 'Intérêts',
    insurancePayment: 'Assurance'
} as const;

const DATE_FORMATS = {
    ISO: /^\d{4}-\d{2}-\d{2}$/,
    EUROPEAN_SLASH: /^\d{2}\/\d{2}\/\d{4}$/,
    EUROPEAN_DASH: /^\d{2}-\d{2}-\d{4}$/,
    EXCEL_SERIAL: /^\d+$/
} as const;

const EXCEL_EPOCH = new Date(1900, 0, 1);
const EXCEL_LEAP_YEAR_BUG_THRESHOLD = 59;
const MAX_EXCEL_SERIAL_DATE = 100000;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

// Pre-compiled regex array for better performance
const DATE_REGEX_ARRAY = Object.values(DATE_FORMATS);
const NON_EXCEL_DATE_REGEX = DATE_REGEX_ARRAY.filter(regex => regex !== DATE_FORMATS.EXCEL_SERIAL);

// Types
type FieldName = keyof typeof FIELD_LABELS;
type ValidationResult = { isValid: boolean; error?: string };
type RowData = Record<string, unknown>;

// Helper functions
const isEmptyValue = (value: unknown): boolean =>
    value === null || value === undefined || value === '';

const hasValidData = (row: RowData, columnMapping: ColumnMappingDto[]): boolean =>
    columnMapping.some(mapping => !isEmptyValue(row[mapping.sourceColumn]));

const createValidationError = (rowNumber: number, message: string, rowData: RowData): ImportErrorDto => ({
    rowNumber: rowNumber + 1,
    errorMessage: message,
    rowData
});

const fieldLabel = (field: string): string => FIELD_LABELS[field as FieldName] || field;

const validateDate = (value: unknown): ValidationResult => {
    const dateValue = String(value);
    const isValidFormat = DATE_REGEX_ARRAY.some(regex => regex.test(dateValue));

    if (!isValidFormat) {
        return {
            isValid: false,
            error: "Format de date invalide. Formats attendus: YYYY-MM-DD, DD/MM/YYYY, DD-MM-YYYY ou numéro de série Excel"
        };
    }

    return { isValid: true };
};

const validatePositiveNumber = (value: unknown, allowZero: boolean = false, fieldName?: string): ValidationResult => {
    const numValue = Number(value);
    const isValid = !isNaN(numValue) && (allowZero ? numValue >= 0 : numValue > 0);

    if (!isValid) {
        const minText = allowZero ? "positif ou nul" : "positif et non nul";
        const fieldPrefix = fieldName ? `Le champ '${fieldName}' ` : "";
        return {
            isValid: false,
            error: `${fieldPrefix}doit être un nombre ${minText}`
        };
    }

    return { isValid: true };
};

const validateField = (mapping: ColumnMappingDto, value: unknown): ValidationResult => {
    if (isEmptyValue(value)) {
        return {
            isValid: false,
            error: `Champ '${fieldLabel(mapping.targetField)}' vide ou manquant`
        };
    }

    const fieldName = fieldLabel(mapping.targetField);

    switch (mapping.targetField) {
        case 'dueDate':
            return validateDate(value);
        case 'principalPayment':
            return validatePositiveNumber(value, false, fieldName);
        case 'interestPayment':
        case 'insurancePayment':
            return validatePositiveNumber(value, true, fieldName);
        default:
            return { isValid: true };
    }
};

export const validateRowData = (
    row: RowData,
    rowIndex: number,
    columnMapping: ColumnMappingDto[]
): ImportErrorDto[] => {
    // Early return for empty rows
    if (!hasValidData(row, columnMapping)) {
        return [createValidationError(rowIndex, 'Ligne vide - aucune donnée détectée', row)];
    }

    // Validate fields and collect errors
    const errors: ImportErrorDto[] = [];
    for (const mapping of columnMapping) {
        const value = row[mapping.sourceColumn];
        const result = validateField(mapping, value);

        if (!result.isValid && result.error) {
            errors.push(createValidationError(rowIndex, result.error, row));
        }
    }

    return errors;
};

const findDuplicateDates = (
    previewRows: RowData[],
    dateMapping: ColumnMappingDto
): ImportErrorDto[] => {
    const dateOccurrences = new Map<string, number[]>();
    const sourceColumn = dateMapping.sourceColumn;

    // Single pass to collect date occurrences
    previewRows.forEach((row, index) => {
        const dateValue = row[sourceColumn];

        if (!isEmptyValue(dateValue)) {
            const normalizedDate = normalizeDate(String(dateValue));

            if (normalizedDate) {
                const indices = dateOccurrences.get(normalizedDate);
                if (indices) {
                    indices.push(index);
                } else {
                    dateOccurrences.set(normalizedDate, [index]);
                }
            }
        }
    });

    // Generate errors for duplicates
    const errors: ImportErrorDto[] = [];
    for (const [date, rowIndices] of dateOccurrences) {
        if (rowIndices.length > 1) {
            const errorMsg = `Date dupliquée: '${date}'. Cette date apparaît ${rowIndices.length} fois dans le fichier.`;
            for (const rowIndex of rowIndices) {
                errors.push(createValidationError(rowIndex, errorMsg, previewRows[rowIndex]));
            }
        }
    }

    return errors;
};

export const getValidationErrors = (
    preview: ImportPreviewDto | null,
    columnMapping: ColumnMappingDto[]
): ImportErrorDto[] => {
    if (!preview?.previewRows?.length || !columnMapping.length) {
        return [];
    }

    const { previewRows } = preview;
    const allErrors: ImportErrorDto[] = [];

    // Validate individual rows
    const rowValidationErrors = previewRows.flatMap((row, index) =>
        validateRowData(row, index, columnMapping)
    );
    allErrors.push(...rowValidationErrors);

    // Check for duplicate dates
    const dateMapping = columnMapping.find(mapping => mapping.targetField === 'dueDate');
    if (dateMapping) {
        const duplicateDateErrors = findDuplicateDates(previewRows, dateMapping);
        allErrors.push(...duplicateDateErrors);
    }

    return allErrors;
};

/**
 * Normalizes a date string to ISO format (YYYY-MM-DD) for consistent comparison.
 * Handles Excel serial dates and various date formats.
 * 
 * @param dateString - The date string to normalize
 * @returns Normalized date string in ISO format or null if invalid
 */
const normalizeDate = (dateString: string): string | null => {
    // Handle Excel serial dates first
    if (DATE_FORMATS.EXCEL_SERIAL.test(dateString)) {
        return normalizeExcelSerialDate(dateString);
    }

    // Check non-Excel date formats
    const isValidDateFormat = NON_EXCEL_DATE_REGEX.some(regex => regex.test(dateString));

    return isValidDateFormat ? parseAndFormatDate(dateString) : null;
};

/**
 * Converts Excel serial date to ISO format.
 */
const normalizeExcelSerialDate = (dateString: string): string | null => {
    const excelSerial = parseInt(dateString, 10);

    if (excelSerial <= 0 || excelSerial >= MAX_EXCEL_SERIAL_DATE) {
        return null;
    }

    try {
        // Excel epoch starts on 1900-01-01, but Excel incorrectly treats 1900 as a leap year
        const daysToSubtract = excelSerial > EXCEL_LEAP_YEAR_BUG_THRESHOLD ? 1 : 0;
        const parsedDate = new Date(
            EXCEL_EPOCH.getTime() +
            (excelSerial - 1 - daysToSubtract) * MS_PER_DAY
        );

        return isNaN(parsedDate.getTime()) ? null : parsedDate.toISOString().split('T')[0];
    } catch {
        return null;
    }
};

/**
 * Parses date string in various formats and returns ISO format.
 */
const parseAndFormatDate = (dateString: string): string | null => {
    try {
        let parsedDate: Date;
        const hasSlashes = dateString.includes('/');
        const hasDashes = dateString.includes('-');

        if (hasSlashes) {
            // DD/MM/YYYY format
            const [day, month, year] = dateString.split('/');
            parsedDate = new Date(`${year}-${month}-${day}`);
        } else if (hasDashes && dateString.length === 10) {
            if (dateString.startsWith('20') || dateString.startsWith('19')) {
                // YYYY-MM-DD format
                parsedDate = new Date(dateString);
            } else {
                // DD-MM-YYYY format
                const [day, month, year] = dateString.split('-');
                parsedDate = new Date(`${year}-${month}-${day}`);
            }
        } else {
            return null;
        }

        return isNaN(parsedDate.getTime()) ? null : parsedDate.toISOString().split('T')[0];
    } catch {
        return null;
    }
};

export { fieldLabel };

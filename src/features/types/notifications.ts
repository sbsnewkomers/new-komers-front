export interface ImportMetadata {
  totalProcessed?: number;
  skippedDescendantLines?: number;
  newFiscalYearsCount?: number;
  fiscalYears?: {
    entityName: string | null;
    entityType: string;
    calendarYear: number;
    startDate: string;
    endDate: string;
    isNew: boolean;
    linesCount: number;
  }[];
  dataImports?: {
    entityName: string | null;
    entityType: string;
    linesCount: number;
  }[];
  errors?: {
    line?: number;
    column?: string;
    value?: string;
    reason?: string;
    message?: string;
  }[]; // ✅ ajout
}

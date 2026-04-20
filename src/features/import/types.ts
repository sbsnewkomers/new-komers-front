// types.ts
export interface ImportHistoryRow {
  id: string;
  file: string;
  date: string;
  status: "Terminé" | "En cours" | "Échoué" | "Annulé";
  user: string;
  details?: string;  // Ajoutez cette propriété optionnelle
  linesCount?: number;  // Optionnel: nombre de lignes importées
  errorsCount?: number;  // Optionnel: nombre d'erreurs
}

export type EntryMovementFilter = "all" | "debit" | "credit";

export interface ImportedAccountingEntry {
  id: string;
  writingDate: string;
  writingNumber: string;
  writingLib: string;
  journalCode: string;
  accountNumber: string;
  accountLib: string;
  pieceReference: string;
  debit: number;
  credit: number;
  createdAt: string;
  fiscalYearLabel?: number | null;
}

export interface ImportEntriesResponse {
  file: string;
  items: ImportedAccountingEntry[];
  context?: {
    entityId: string;
    entityType: "Group" | "Company" | "BusinessUnit";
    entityName: string | null;
    lastClosedFiscalYear: number | null;
  } | null;
  summary: {
    totalRows: number;
    totalDebit: number;
    totalCredit: number;
  };
  pagination: {
    page: number;
    pageSize: number;
    totalFilteredRows: number;
    totalPages: number;
  };
}

// types.ts
export interface ValidationError {
  line: number;
  column: string;
  value: string;
  reason: string;
  message?: string; // Pour compatibilité
}
export type ImportProgress = {
  id: string;
  name: string;
  progress: number;
};

export type ColumnDefinition = {
  name: string;
  type: string;
  required: boolean;
};
export interface SavedMapping {
  id: string;
  name: string;
  rules: Record<string, string>;
  entityId?: string;
  entityType?: 'Group' | 'Company';
  createdAt: string;
  updatedAt: string;
};
export type MappingPayload = {
  name: string;
  rules: Record<string, string>;
  entityId?: string;
  entityType?: 'Group' | 'Company';
};
// types.ts
export interface ImportHistoryRow {
  id: string;
  file: string;
  date: string;
  status: "Terminé" | "En cours" | "Échoué" | "Annulé";
  entityType: string;
  entityName: string;
  user: string;
  details?: string;  
  linesCount?: number;  
  errorsCount?: number;  
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
  workspaceId?: string | null;  
  scope?: 'LOCAL' | 'GLOBAL';  
  createdBy?: string;              
};
export type MappingPayload = {
  name: string;
  rules: Record<string, string>;
  entityId?: string;
  entityType?: 'Group' | 'Company';
};
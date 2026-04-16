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
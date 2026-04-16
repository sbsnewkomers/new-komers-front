import { ColumnDefinition } from './types';

export const Basic_COLUMNS: ColumnDefinition[] = [
  { name: 'JournalCode', type: 'string', required: true },
  { name: 'JournalLib', type: 'string', required: true },
  { name: 'EcritureNum', type: 'string', required: true },
  { name: 'EcritureDate', type: 'date', required: true },
  { name: 'CompteNum', type: 'string', required: true },
  { name: 'CompteLib', type: 'string', required: true },
  { name: 'CompteAuxNum', type: 'string', required: false },
  { name: 'CompteAuxLib', type: 'string', required: false },
  { name: 'PieceRef', type: 'string', required: false },
  { name: 'PieceDate', type: 'date', required: false },
  { name: 'EcritureLib', type: 'string', required: true },
  { name: 'Debit', type: 'number', required: true },
  { name: 'Credit', type: 'number', required: true },
  { name: 'EcritureLet', type: 'string', required: false },
  { name: 'DateLet', type: 'date', required: false },
  { name: 'ValidDate', type: 'date', required: false },
  { name: 'Montantdevise', type: 'number', required: false },
  { name: 'Idevise', type: 'string', required: false },
];
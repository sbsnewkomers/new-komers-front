import { Card, CardContent } from "@/components/ui/Card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/Table";
import { Button } from "@/components/ui/Button";
import { FileText, History, User, RotateCcw, ChevronDown, ChevronUp, Eye } from "lucide-react";
import { ImportHistoryRow } from './types';
import { StatusBadge } from './StatusBadge';

interface ImportHistoryProps {
  history: ImportHistoryRow[];
  historyOpen: boolean;
  onToggle: () => void;
  onRollback: (row: ImportHistoryRow) => void;
  onViewEntries: (row: ImportHistoryRow) => void;
}

export function ImportHistory({ history, historyOpen, onToggle, onRollback, onViewEntries }: ImportHistoryProps) {
  return (
<<<<<<< HEAD:src/pages/import/ImportHistory.tsx
    <Card className="bg-white overflow-hidden w-full">
      {/* HEADER */}
=======
    <Card className="w-full overflow-hidden bg-white shadow-sm ring-1 ring-slate-100">
>>>>>>> staging:src/features/import/ImportHistory.tsx
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full cursor-pointer items-center gap-3 border-b border-slate-100 bg-linear-to-r from-slate-50/80 to-white px-6 py-4 transition-colors hover:from-slate-50 hover:to-slate-50/30"
      >
        <div className="rounded-lg bg-slate-100 p-2 shadow-inner">
          <History className="h-4 w-4 text-slate-600" />
        </div>
        <h3 className="font-semibold text-primary">Historique des imports</h3>
        <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
          {history.length} import{history.length > 1 ? "s" : ""}
        </span>
        <span className="ml-auto">
          {historyOpen ? (
            <ChevronUp className="h-5 w-5 text-slate-400" />
          ) : (
            <ChevronDown className="h-5 w-5 text-slate-400" />
          )}
        </span>
      </button>

      {/* CONTENT */}
      {historyOpen && (
        <>
          {history.length === 0 ? (
            <CardContent className="py-16! flex flex-col items-center justify-center">
              <div className="mb-4 rounded-2xl bg-slate-50 p-4">
                <History className="h-8 w-8 text-slate-300" />
              </div>
              <p className="text-sm text-slate-500">
                Aucun import réalisé pour le moment
              </p>
            </CardContent>
          ) : (
            <div className="overflow-x-auto">
<<<<<<< HEAD:src/pages/import/ImportHistory.tsx
              <Table>
                {/* HEADER TABLE */}
=======
                <Table>
>>>>>>> staging:src/features/import/ImportHistory.tsx
                <TableHeader>
                  <TableRow className="bg-slate-50/70">
                    <TableHead className="font-semibold text-slate-600">Fichier</TableHead>
                    <TableHead className="font-semibold text-slate-600">Date</TableHead>
                    <TableHead className="font-semibold text-slate-600">Statut</TableHead>
                    <TableHead className="font-semibold text-slate-600">Entité</TableHead>
                    <TableHead className="font-semibold text-slate-600">Utilisateur</TableHead>
                  </TableRow>
                </TableHeader>

                {/* BODY */}
                <TableBody>
                  {history.map((row) => (
<<<<<<< HEAD:src/pages/import/ImportHistory.tsx
                    <TableRow
                      key={row.id}
                      className="hover:bg-slate-50/50 transition-colors"
                    >
                      {/* Fichier */}
=======
                    <TableRow key={row.id} className="transition-colors hover:bg-slate-50/60">
>>>>>>> staging:src/features/import/ImportHistory.tsx
                      <TableCell>
                        <div className="flex items-center gap-2.5">
                          <div className="rounded-lg bg-primary/5 p-1.5">
                            <FileText className="h-4 w-4 text-primary/60" />
                          </div>
                          <span className="font-medium text-slate-700">
                            {row.file}
                          </span>
                        </div>
                      </TableCell>

                      {/* Date */}
                      <TableCell className="text-slate-600">
                        {row.date}
                      </TableCell>

                      {/* Statut */}
                      <TableCell>
                        <StatusBadge status={row.status} />
                      </TableCell>

                      {/* ✅ ENTITÉ */}
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-slate-700">
                            {row.entityName || "—"}
                          </span>
                          <span className="text-xs text-slate-400">
                            {row.entityType || "—"}
                          </span>
                        </div>
                      </TableCell>

                      {/* 👤 UTILISATEUR */}
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100">
                            <User className="h-3.5 w-3.5 text-slate-500" />
                          </div>
                          <span className="text-sm text-slate-600">
                            {row.user || "Inconnu"}
                          </span>
                        </div>
                      </TableCell>
<<<<<<< HEAD:src/pages/import/ImportHistory.tsx

                      
=======
                      <TableCell className="text-right">
                        <div className="inline-flex items-center gap-1">
                          {row.status === "Terminé" && (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="gap-1.5 rounded-md border border-sky-100 bg-sky-50/60 text-sky-700 shadow-sm hover:bg-sky-100/70 hover:text-sky-800"
                                onClick={() => onViewEntries(row)}
                              >
                                <Eye className="h-3.5 w-3.5" />
                                Voir écritures
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="gap-1.5 rounded-md border border-amber-100 bg-amber-50/60 text-amber-700 shadow-sm hover:bg-amber-100/70 hover:text-amber-800"
                                onClick={() => onRollback(row)}
                              >
                                <RotateCcw className="h-3.5 w-3.5" />
                                Restaurer
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
>>>>>>> staging:src/features/import/ImportHistory.tsx
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </>
      )}
    </Card>
  );
}
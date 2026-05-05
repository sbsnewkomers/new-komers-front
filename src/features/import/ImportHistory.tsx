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
  disabled?: boolean;
  currentUserEmail?: string;     
  isManager?: boolean; 
}

export function ImportHistory({ history, historyOpen, onToggle, onRollback, onViewEntries,disabled = false ,currentUserEmail, isManager = false,   }: ImportHistoryProps) {
  return (
    <Card className="w-full overflow-hidden nebula-glass shadow-sm ring-1 ring-primary">
      <button
        type="button"
        onClick={onToggle}
        className={`flex w-full cursor-pointer flex-wrap items-center gap-3 border-b border-primary nebula-glass px-4 py-4 transition-colors hover:bg-primary/10 sm:px-6 ${historyOpen ? "rounded-bl-none! rounded-br-none!" : ""}`}
      >
        <div className="rounded-lg bg-primary/10 p-2 shadow-inner">
          <History className="h-4 w-4 text-primary" />
        </div>
        <h3 className="font-semibold text-primary">Historique des imports</h3>
        <span className="rounded-full nebula-glass border-primary text-primary px-2.5 py-0.5 text-xs font-medium">
          {history.length} import{history.length > 1 ? "s" : ""}
        </span>
        <span className="ml-auto">
          {historyOpen ? (
            <ChevronUp className="h-5 w-5 text-primary" />
          ) : (
            <ChevronDown className="h-5 w-5 text-primary" />
          )}
        </span>
      </button>

      {/* CONTENT */}
      {historyOpen && (
        <>
          {history.length === 0 ? (
            <CardContent className="py-16! flex flex-col items-center justify-center">
              <div className="mb-4 rounded-2xl nebula-glass border-primary text-primary p-4">
                <History className="h-8 w-8 text-primary" />
              </div>
              <p className="text-sm text-primary">
                Aucun import réalisé pour le moment
              </p>
            </CardContent>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-primary/10 hover:bg-primary/10">
                    <TableHead className="font-semibold text-primary">Fichier</TableHead>
                    <TableHead className="font-semibold text-primary">Date</TableHead>
                    <TableHead className="font-semibold text-primary">Statut</TableHead>
                    <TableHead className="font-semibold text-primary">Entité</TableHead>
                    <TableHead className="font-semibold text-primary">Utilisateur</TableHead>
                    <TableHead className="font-semibold text-primary">Actions</TableHead>
                  </TableRow>
                </TableHeader>

                {/* BODY */}
                <TableBody>
                  {history.map((row) => (
                    <TableRow key={row.id} className="transition-colors hover:bg-primary/5 ">
                      <TableCell>
                        <div className="flex items-start gap-2.5">
                          <div className="rounded-lg bg-primary/5 p-1.5 mt-0.5 shrink-0">
                            <FileText className="h-4 w-4 text-primary/60" />
                          </div>
                          <div className="flex flex-col">
                            <span className="font-medium">
                              {row.file}
                            </span>
                            {row.status === "failed" && row.errorMessage && (
                              <span className="mt-0.5 flex items-start gap-1 text-xs text-orange-600">
                                <span className="mt-1.5 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-orange-400" />
                                {row.errorMessage}
                              </span>
                            )}
                          </div>
                        </div>
                      </TableCell>

                      {/* Date */}
                      <TableCell className="">
                        {row.date}
                      </TableCell>

                      {/* Statut */}
                      <TableCell>
                        <StatusBadge status={row.status} />
                      </TableCell>

                      {/* ✅ ENTITÉ */}
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="text-sm font-medium">
                            {row.entityName || "—"}
                          </span>
                          <span className="text-xs">
                            {row.entityType || "—"}
                          </span>
                        </div>
                      </TableCell>

                      {/* 👤 UTILISATEUR */}
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="flex h-7 w-7 items-center justify-center rounded-full nebula-glass border-primary text-primary">
                            <User className="h-3.5 w-3.5 text-primary" />
                          </div>
                          <span className="text-sm">
                            {row.user || "Inconnu"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                      <div className="inline-flex flex-wrap items-center justify-end gap-1">
                        
                        {/* Voir écritures → uniquement si actif */}
                        {(row.status === "active") && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full gap-1.5 rounded-md border border-primary text-primary hover:border-primary! hover:bg-primary/10 sm:w-auto"
                            onClick={() => onViewEntries(row)}
                          >
                            <Eye className="h-3.5 w-3.5" />
                            Voir écritures
                          </Button>
                        )}

                        {/* Restaurer → uniquement si archivé */}
                        {row.status === "archived" && !disabled && (
                            !isManager || row.user === currentUserEmail  
                          ) &&(
                          <Button
                            variant="ghost"
                            size="sm"
                            className="w-full gap-1.5 rounded-md border border-amber-100 bg-amber-50/60 text-amber-700 shadow-sm hover:bg-amber-100/70 hover:text-amber-800 sm:w-auto"
                            onClick={() => onRollback(row)}
                          >
                            <RotateCcw className="h-3.5 w-3.5" />
                            Restaurer
                          </Button>
                        )}

                      </div>
                    </TableCell>
                            
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
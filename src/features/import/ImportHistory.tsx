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
    <Card className="w-full overflow-hidden nebula-glass border border-white/10">
      <button
        type="button"
        onClick={onToggle}
        className={`flex w-full cursor-pointer flex-wrap items-center gap-3 border-b border-white/10 px-4 py-4 transition-colors hover:bg-white/5 sm:px-6 ${historyOpen ? "rounded-bl-none! rounded-br-none!" : ""}`}
      >
        <div className="rounded-lg border border-white/10 bg-white/10 p-2">
          <History className="h-4 w-4 text-(--nebula-gold-light)" />
        </div>
        <h3 className="font-semibold text-white">Historique des imports</h3>
        <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-xs font-medium text-(--nebula-muted)">
          {history.length} import{history.length > 1 ? "s" : ""}
        </span>
        <span className="ml-auto">
          {historyOpen ? (
            <ChevronUp className="h-5 w-5 text-(--nebula-muted)" />
          ) : (
            <ChevronDown className="h-5 w-5 text-(--nebula-muted)" />
          )}
        </span>
      </button>

      {/* CONTENT */}
      {historyOpen && (
        <>
          {history.length === 0 ? (
            <CardContent className="py-16! flex flex-col items-center justify-center">
              <div className="mb-4 rounded-2xl border border-white/10 bg-white/5 p-4">
                <History className="h-8 w-8 text-(--nebula-gold-light)" />
              </div>
              <p className="text-sm text-(--nebula-muted)">
                Aucun import réalisé pour le moment
              </p>
            </CardContent>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-white/10 bg-white/5 hover:bg-white/5">
                    <TableHead className="font-semibold text-(--nebula-muted)">Fichier</TableHead>
                    <TableHead className="font-semibold text-(--nebula-muted)">Date</TableHead>
                    <TableHead className="font-semibold text-(--nebula-muted)">Statut</TableHead>
                    <TableHead className="font-semibold text-(--nebula-muted)">Entité</TableHead>
                    <TableHead className="font-semibold text-(--nebula-muted)">Utilisateur</TableHead>
                    <TableHead className="font-semibold text-(--nebula-muted)">Actions</TableHead>
                  </TableRow>
                </TableHeader>

                {/* BODY */}
                <TableBody>
                  {history.map((row) => (
                    <TableRow key={row.id} className="border-white/10 transition-colors hover:bg-white/5">
                      <TableCell>
                        <div className="flex items-start gap-2.5">
                          <div className="mt-0.5 shrink-0 rounded-lg border border-white/10 bg-white/5 p-1.5">
                            <FileText className="h-4 w-4 text-(--nebula-muted)" />
                          </div>
                          <div className="flex flex-col">
                            <span className="font-medium text-white">
                              {row.file}
                            </span>
                            {row.status === "failed" && row.errorMessage && (
                              <span className="mt-0.5 flex items-start gap-1 text-xs text-amber-200">
                                <span className="mt-1.5 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400" />
                                {row.errorMessage}
                              </span>
                            )}
                          </div>
                        </div>
                      </TableCell>

                      {/* Date */}
                      <TableCell className="text-(--nebula-muted)">
                        {row.date}
                      </TableCell>

                      {/* Statut */}
                      <TableCell>
                        <StatusBadge status={row.status} />
                      </TableCell>

                      {/* ✅ ENTITÉ */}
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-white">
                            {row.entityName || "—"}
                          </span>
                          <span className="text-xs text-(--nebula-muted)">
                            {row.entityType || "—"}
                          </span>
                        </div>
                      </TableCell>

                      {/* 👤 UTILISATEUR */}
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="flex h-7 w-7 items-center justify-center rounded-full border border-white/10 bg-white/5">
                            <User className="h-3.5 w-3.5 text-(--nebula-muted)" />
                          </div>
                          <span className="text-sm text-white">
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
                            className="w-full gap-1.5 rounded-md border-white/20 text-white hover:bg-white/10 sm:w-auto"
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
                            className="w-full gap-1.5 rounded-md border border-amber-400/30 bg-amber-500/15 text-amber-100 hover:bg-amber-500/25 sm:w-auto"
                            onClick={() => onRollback(row)}
                          >
                            <RotateCcw className="h-3.5 w-3.5" />
                            Restaurer
                          </Button>
                        )}
                        {/* Message pendant le traitement */}
                          {row.status === "processing" && (
                            <span className="text-xs text-blue-300/70 italic">
                              Traitement en cours...
                            </span>
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
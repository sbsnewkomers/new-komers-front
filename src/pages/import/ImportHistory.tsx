import { Card, CardContent } from "@/components/ui/Card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/Table";
import { Button } from "@/components/ui/Button";
import { FileText, History, User, RotateCcw, ChevronDown, ChevronUp } from "lucide-react";
import { ImportHistoryRow } from './types';
import { StatusBadge } from './StatusBadge';

interface ImportHistoryProps {
  history: ImportHistoryRow[];
  historyOpen: boolean;
  onToggle: () => void;
  onRollback: (row: ImportHistoryRow) => void;
}

export function ImportHistory({ history, historyOpen, onToggle, onRollback }: ImportHistoryProps) {
  return (
    <Card className="bg-white overflow-hidden w-full">
      <button
        type="button"
        onClick={onToggle}
        className="w-full border-b border-slate-100 px-6 py-4 flex items-center gap-3 hover:bg-slate-50/50 transition-colors cursor-pointer"
      >
        <div className="rounded-lg bg-slate-50 p-2">
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
      {historyOpen && (
        <>
          {history.length === 0 ? (
            <CardContent className="py-16! flex flex-col items-center justify-center">
              <div className="mb-4 rounded-2xl bg-slate-50 p-4">
                <History className="h-8 w-8 text-slate-300" />
              </div>
              <p className="text-sm text-slate-500">Aucun import réalisé pour le moment</p>
            </CardContent>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50/50">
                    <TableHead className="font-semibold text-slate-600">Fichier</TableHead>
                    <TableHead className="font-semibold text-slate-600">Date</TableHead>
                    <TableHead className="font-semibold text-slate-600">Statut</TableHead>
                    <TableHead className="font-semibold text-slate-600">Utilisateur</TableHead>
                    <TableHead className="font-semibold text-slate-600 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {history.map((row) => (
                    <TableRow
                      key={row.id}
                      className="hover:bg-slate-50/50 transition-colors"
                    >
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
                      <TableCell className="text-slate-600">{row.date}</TableCell>
                      <TableCell>
                        <StatusBadge status={row.status} />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100">
                            <User className="h-3.5 w-3.5 text-slate-500" />
                          </div>
                          <span className="text-sm text-slate-600">{row.user}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        {row.status === "Terminé" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="gap-1.5 text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                            onClick={() => onRollback(row)}
                          >
                            <RotateCcw className="h-3.5 w-3.5" />
                            Restaurer
                          </Button>
                        )}
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
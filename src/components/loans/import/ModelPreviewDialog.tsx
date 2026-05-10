import React from 'react';
import { Button } from '@/components/ui/Button';
import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/AlertDialog';
import { Eye, Download } from 'lucide-react';
import { ImportFileFormat } from '@/types/loans';

interface ModelPreviewDialogProps {
    showModelPreview: boolean;
    setShowModelPreview: (show: boolean) => void;
    selectedModelFormat: ImportFileFormat;
    onDownloadTemplate: (format: ImportFileFormat) => void;
}

export function ModelPreviewDialog({
    showModelPreview,
    setShowModelPreview,
    selectedModelFormat,
    onDownloadTemplate,
}: ModelPreviewDialogProps) {
    return (
        <AlertDialog open={showModelPreview} onOpenChange={setShowModelPreview}>
            <AlertDialogContent className="max-w-4xl max-h-[80vh] overflow-auto">
                <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center gap-2">
                        <Eye className="h-5 w-5" />
                        Aperçu du modèle {selectedModelFormat === ImportFileFormat.EXCEL ? 'Excel' : 'CSV'}
                    </AlertDialogTitle>
                </AlertDialogHeader>
                <AlertDialogDescription className="text-(--nebula-muted)">
                    Voici la structure attendue pour votre fichier d&apos;import.
                </AlertDialogDescription>

                <div className="mt-4 space-y-4">
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                        <h4 className="mb-3 text-sm font-semibold text-white">Colonnes requises</h4>
                        <div className="space-y-2">
                            {[
                                { field: 'dueDate', label: 'Date', example: '01/01/2024', description: 'Date de chaque mensualité' },
                                { field: 'principalPayment', label: 'Capital', example: '1500.00', description: 'Montant du capital remboursé' },
                                { field: 'interestPayment', label: 'Intérêts', example: '250.00', description: 'Montant des intérêts' },
                                { field: 'insurancePayment', label: 'Assurance', example: '50.00', description: 'Montant de l\'assurance (optionnel)' },
                            ].map((col) => (
                                <div key={col.field} className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-3">
                                    <div>
                                        <p className="text-sm font-medium text-white">{col.label}</p>
                                        <p className="text-xs text-(--nebula-muted)">{col.description}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs font-mono text-white/70">{col.example}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                        <h4 className="mb-3 text-sm font-semibold text-white">Exemple de fichier</h4>
                        <div className="overflow-x-auto">
                          <div className="min-w-[520px] rounded-xl border border-white/10 overflow-hidden">
                            <div className="grid grid-cols-4 gap-3 border-b border-white/10 bg-white/5 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-(--nebula-muted)">
                              <div>Date</div>
                              <div>Capital</div>
                              <div>Intérêts</div>
                              <div>Assurance</div>
                            </div>
                            <div className="divide-y divide-white/10 text-sm">
                              {[
                                { d: '2024-01-01', p: '1000.00', i: '50.00', a: '20.00' },
                                { d: '2024-02-01', p: '1005.00', i: '45.00', a: '20.00' },
                                { d: '2024-03-01', p: '1010.00', i: '40.00', a: '20.00' },
                              ].map((r) => (
                                <div key={r.d} className="grid grid-cols-4 gap-3 px-3 py-2">
                                  <div className="font-mono text-xs text-white/80">{r.d}</div>
                                  <div className="font-mono text-xs text-white/80">{r.p}</div>
                                  <div className="font-mono text-xs text-white/80">{r.i}</div>
                                  <div className="font-mono text-xs text-white/80">{r.a}</div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                    </div>
                </div>

                <div className="mt-6 flex justify-end gap-3">
                    <Button
                        variant="outline"
                        onClick={() => setShowModelPreview(false)}
                    >
                        Fermer
                    </Button>
                    <Button
                        onClick={() => {
                            onDownloadTemplate(selectedModelFormat);
                            setShowModelPreview(false);
                        }}
                        className="h-10 gap-2"
                    >
                        <Download className="h-4 w-4 mr-2" />
                        Télécharger le modèle
                    </Button>
                </div>
            </AlertDialogContent>
        </AlertDialog>
    );
}

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
                <AlertDialogDescription className="text-slate-600">
                    Voici la structure attendue pour votre fichier d'import.
                </AlertDialogDescription>

                <div className="mt-4 space-y-4">
                    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                        <h4 className="mb-3 text-sm font-semibold text-slate-900">Colonnes requises</h4>
                        <div className="space-y-2">
                            {[
                                { field: 'dueDate', label: 'Date d\'échéance', example: '01/01/2024', description: 'Date de chaque mensualité' },
                                { field: 'principalPayment', label: 'Capital', example: '1500.00', description: 'Montant du capital remboursé' },
                                { field: 'interestPayment', label: 'Intérêts', example: '250.00', description: 'Montant des intérêts' },
                                { field: 'insurancePayment', label: 'Assurance', example: '50.00', description: 'Montant de l\'assurance (optionnel)' },
                            ].map((col) => (
                                <div key={col.field} className="flex items-center justify-between rounded-lg border border-slate-100 bg-white p-3">
                                    <div>
                                        <p className="text-sm font-medium text-slate-900">{col.label}</p>
                                        <p className="text-xs text-slate-500">{col.description}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs font-mono text-slate-600">{col.example}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                        <h4 className="mb-3 text-sm font-semibold text-slate-900">Exemple de fichier</h4>
                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse border border-slate-300 text-sm">
                                <thead>
                                    <tr className="bg-slate-100">
                                        <th className="border border-slate-300 p-2 text-left font-semibold">Date</th>
                                        <th className="border border-slate-300 p-2 text-left font-semibold">Capital</th>
                                        <th className="border border-slate-300 p-2 text-left font-semibold">Intérêts</th>
                                        <th className="border border-slate-300 p-2 text-left font-semibold">Assurance</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td className="border border-slate-300 p-2 font-mono text-xs">2024-01-01</td>
                                        <td className="border border-slate-300 p-2 font-mono text-xs">1000.00</td>
                                        <td className="border border-slate-300 p-2 font-mono text-xs">50.00</td>
                                        <td className="border border-slate-300 p-2 font-mono text-xs">20.00</td>
                                    </tr>
                                    <tr>
                                        <td className="border border-slate-300 p-2 font-mono text-xs">2024-02-01</td>
                                        <td className="border border-slate-300 p-2 font-mono text-xs">1005.00</td>
                                        <td className="border border-slate-300 p-2 font-mono text-xs">45.00</td>
                                        <td className="border border-slate-300 p-2 font-mono text-xs">20.00</td>
                                    </tr>
                                    <tr>
                                        <td className="border border-slate-300 p-2 font-mono text-xs">2024-03-01</td>
                                        <td className="border border-slate-300 p-2 font-mono text-xs">1010.00</td>
                                        <td className="border border-slate-300 p-2 font-mono text-xs">40.00</td>
                                        <td className="border border-slate-300 p-2 font-mono text-xs">20.00</td>
                                    </tr>
                                </tbody>
                            </table>
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
                        className="bg-primary text-white hover:bg-slate-800"
                    >
                        <Download className="h-4 w-4 mr-2" />
                        Télécharger le modèle
                    </Button>
                </div>
            </AlertDialogContent>
        </AlertDialog>
    );
}

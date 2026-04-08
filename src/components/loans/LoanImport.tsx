'use client';

import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Select } from '@/components/ui/Select';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription } from '@/components/ui/AlertDialog';
import { FileSpreadsheet, Download, Upload, CheckCircle, ArrowRight } from 'lucide-react';
import { loansApi } from '@/lib/loansApi';
import {
    Loan,
    EntityType,
    ImportPreviewDto,
    ColumnMappingDto,
    UploadLoanImportDto,
    ImportFileFormat
} from '@/types/loans';

interface LoanImportProps {
    onLoanImported?: (loanId: string) => void;
    entityType?: EntityType;
    entityId?: string;
}

// Utility functions
const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: 'EUR'
    }).format(amount);
};

export function LoanImport({ onLoanImported, entityType, entityId }: LoanImportProps) {
    const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    // File upload state
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<ImportPreviewDto | null>(null);
    const [columnMapping, setColumnMapping] = useState<ColumnMappingDto[]>([]);
    const [importResult, setImportResult] = useState<Loan | null>(null);

    // Form data
    const [loanName, setLoanName] = useState('');
    const [selectedEntityType, setSelectedEntityType] = useState<EntityType>(entityType || EntityType.GROUP);
    const [selectedEntityId, setSelectedEntityId] = useState(entityId || '');

    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            setSelectedFile(file);
            setError(null);
            setSuccess(null);
        }
    };

    const uploadFile = async () => {
        if (!selectedFile || !loanName || !selectedEntityType || !selectedEntityId) {
            setError('Veuillez remplir tous les champs obligatoires');
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const uploadData: UploadLoanImportDto = {
                file: selectedFile,
                loanName,
                entityType: selectedEntityType,
                entityId: selectedEntityId,
                columnMapping: columnMapping.length > 0 ? columnMapping : undefined,
            };

            const result = await loansApi.uploadImportFile(uploadData);

            setImportResult(result);
            setSuccess('Import réussi !');
            setCurrentStep(3);
            onLoanImported?.(result.id);
        } catch (err) {
            if (err instanceof Error && err.message.includes('Mapping des colonnes requis')) {
                // Try to extract column information from error
                try {
                    const errorData = JSON.parse(err.message);
                    if (errorData.details?.detectedColumns) {
                        setPreview({
                            previewRows: [],
                            detectedColumns: errorData.details.detectedColumns,
                            totalRows: 0,
                        });
                        setCurrentStep(2);
                        return;
                    }
                } catch {
                    // Fall through to general error
                }
            }
            setError(err instanceof Error ? err.message : 'Import failed');
        } finally {
            setIsLoading(false);
        }
    };

    const downloadTemplate = async (format: ImportFileFormat) => {
        setIsLoading(true);
        try {
            const blob = await loansApi.downloadTemplate(format);
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `modele-echeancier.${format.toLowerCase()}`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
            setSuccess(`Modèle ${format} téléchargé avec succès`);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Download failed');
        } finally {
            setIsLoading(false);
        }
    };

    const handleColumnMapping = (sourceColumn: string, targetField: 'dueDate' | 'principalPayment' | 'interestPayment' | 'insurancePayment') => {
        setColumnMapping(prev => {
            const filtered = prev.filter(m => m.sourceColumn !== sourceColumn);
            if (targetField) {
                return [...filtered, { sourceColumn, targetField }];
            }
            return filtered;
        });
    };

    const resetImport = () => {
        setCurrentStep(1);
        setSelectedFile(null);
        setPreview(null);
        setColumnMapping([]);
        setImportResult(null);
        setLoanName('');
        setError(null);
        setSuccess(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const getRequiredColumns = () => ['dueDate', 'principalPayment', 'interestPayment', 'insurancePayment'];

    const isMappingComplete = () => {
        const required = getRequiredColumns();
        return required.every(field =>
            columnMapping.some(mapping => mapping.targetField === field)
        );
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <FileSpreadsheet className="h-5 w-5" />
                        Import d&rsquo;Échéancier Excel/CSV
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                        Importez un échéancier existant depuis un fichier Excel ou CSV
                    </p>
                </CardHeader>
                <CardContent>
                    {/* Progress Steps */}
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-2">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${currentStep >= 1 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                                }`}>
                                1
                            </div>
                            <span className={`text-sm font-medium ${currentStep >= 1 ? 'text-foreground' : 'text-muted-foreground'}`}>
                                Fichier
                            </span>
                        </div>
                        <div className="flex-1 h-0.5 bg-border mx-4" />
                        <div className="flex items-center gap-2">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${currentStep >= 2 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                                }`}>
                                2
                            </div>
                            <span className={`text-sm font-medium ${currentStep >= 2 ? 'text-foreground' : 'text-muted-foreground'}`}>
                                Mapping
                            </span>
                        </div>
                        <div className="flex-1 h-0.5 bg-border mx-4" />
                        <div className="flex items-center gap-2">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${currentStep >= 3 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                                }`}>
                                3
                            </div>
                            <span className={`text-sm font-medium ${currentStep >= 3 ? 'text-foreground' : 'text-muted-foreground'}`}>
                                Résultat
                            </span>
                        </div>
                    </div>

                    {error && (
                        <AlertDialog open={true}>
                            <AlertDialogContent>
                                <AlertDialogDescription className="text-red-800">
                                    {error}
                                </AlertDialogDescription>
                            </AlertDialogContent>
                        </AlertDialog>
                    )}

                    {success && (
                        <AlertDialog open={true}>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle className="flex items-center gap-2 text-green-600">
                                        <div className="rounded-lg bg-green-50 p-1.5">
                                            <CheckCircle className="h-4 w-4 text-green-600" />
                                        </div>
                                        Succès
                                    </AlertDialogTitle>
                                    <AlertDialogDescription className="text-green-800">
                                        {success}
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                            </AlertDialogContent>
                        </AlertDialog>
                    )}

                    {/* Step 1: File Upload */}
                    {currentStep === 1 && (
                        <div className="space-y-6">
                            <div>
                                <h3 className="text-lg font-semibold mb-4">Télécharger le modèle et préparer votre fichier</h3>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                    <Card className="border-dashed">
                                        <CardContent className="pt-6">
                                            <h4 className="font-medium mb-2">Modèle Excel</h4>
                                            <p className="text-sm text-muted-foreground mb-4">
                                                Format .xlsx avec colonnes pré-configurées
                                            </p>
                                            <Button
                                                variant="outline"
                                                onClick={() => downloadTemplate(ImportFileFormat.EXCEL)}
                                                disabled={isLoading}
                                                className="w-full"
                                            >
                                                <Download className="mr-2 h-4 w-4" />
                                                Télécharger .xlsx
                                            </Button>
                                        </CardContent>
                                    </Card>

                                    <Card className="border-dashed">
                                        <CardContent className="pt-6">
                                            <h4 className="font-medium mb-2">Modèle CSV</h4>
                                            <p className="text-sm text-muted-foreground mb-4">
                                                Format .csv compatible avec tous les tableurs
                                            </p>
                                            <Button
                                                variant="outline"
                                                onClick={() => downloadTemplate(ImportFileFormat.CSV)}
                                                disabled={isLoading}
                                                className="w-full"
                                            >
                                                <Download className="mr-2 h-4 w-4" />
                                                Télécharger .csv
                                            </Button>
                                        </CardContent>
                                    </Card>
                                </div>
                            </div>

                            <div>
                                <h3 className="text-lg font-semibold mb-4">Informations sur l&rsquo;emprunt</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <Label htmlFor="loanName">Nom de l&rsquo;emprunt</Label>
                                        <Input
                                            id="loanName"
                                            placeholder="ex: Prêt BNP Agence X"
                                            value={loanName}
                                            onChange={(e) => setLoanName(e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="entityType">Type d&rsquo;entité</Label>
                                        <Select
                                            value={selectedEntityType}
                                            onValueChange={(value) => setSelectedEntityType(value as EntityType)}
                                        >
                                            <option value={EntityType.GROUP}>Groupe</option>
                                            <option value={EntityType.COMPANY}>Entreprise</option>
                                            <option value={EntityType.BUSINESSUNIT}>Unité de business</option>
                                        </Select>
                                    </div>
                                    <div>
                                        <Label htmlFor="entityId">ID de l&rsquo;entité</Label>
                                        <Input
                                            id="entityId"
                                            placeholder="UUID de l'entité"
                                            value={selectedEntityId}
                                            onChange={(e) => setSelectedEntityId(e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div>
                                <h3 className="text-lg font-semibold mb-4">Télécharger votre fichier</h3>
                                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                                    <FileSpreadsheet className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                                    <p className="text-lg font-medium mb-2">
                                        {selectedFile ? selectedFile.name : 'Glissez-déposez votre fichier ici'}
                                    </p>
                                    <p className="text-sm text-muted-foreground mb-4">
                                        Formats supportés: .xlsx, .xls, .csv (max 10MB)
                                    </p>
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept=".xlsx,.xls,.csv"
                                        onChange={handleFileSelect}
                                        className="hidden"
                                    />
                                    <Button onClick={() => fileInputRef.current?.click()} variant="outline">
                                        <Upload className="mr-2 h-4 w-4" />
                                        Choisir un fichier
                                    </Button>
                                </div>
                            </div>

                            <div className="flex justify-end">
                                <Button
                                    onClick={uploadFile}
                                    disabled={isLoading || !selectedFile || !loanName || !selectedEntityType || !selectedEntityId}
                                >
                                    {isLoading ? 'Import...' : 'Importer le fichier'}
                                    <ArrowRight className="ml-2 h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Step 2: Column Mapping */}
                    {currentStep === 2 && (
                        <div className="space-y-6">
                            <div>
                                <h3 className="text-lg font-semibold mb-4">Mapping des colonnes</h3>
                                <p className="text-sm text-muted-foreground mb-6">
                                    Associez chaque colonne de votre fichier au champ correspondant dans le système
                                </p>

                                <div className="space-y-4">
                                    {getRequiredColumns().map(field => (
                                        <div key={field} className="flex items-center gap-4">
                                            <Label className="w-32 font-medium">
                                                {field === 'dueDate' ? 'Date' :
                                                    field === 'principalPayment' ? 'Capital' :
                                                        field === 'interestPayment' ? 'Intérêts' :
                                                            field === 'insurancePayment' ? 'Assurance' : field}
                                                <span className="text-red-500 ml-1">*</span>
                                            </Label>
                                            <Select
                                                value={columnMapping.find(m => m.targetField === field)?.sourceColumn || ''}
                                                onValueChange={(value) => handleColumnMapping(value, field as 'dueDate' | 'principalPayment' | 'interestPayment' | 'insurancePayment')}
                                            >
                                                <option value="">-- Sélectionner une colonne --</option>
                                                {preview?.detectedColumns.map(column => (
                                                    <option key={column} value={column}>{column}</option>
                                                ))}
                                            </Select>
                                        </div>
                                    ))}
                                </div>

                                <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                                    <p className="text-sm text-blue-800">
                                        <strong>Conseil:</strong> Utilisez des noms de colonnes standards comme &ldquo;Date&rdquo;, &ldquo;Capital&rdquo;, &ldquo;Intérêts&rdquo;, &ldquo;Assurance&rdquo;
                                        pour un mapping automatique.
                                    </p>
                                </div>
                            </div>

                            <div className="flex justify-between">
                                <Button variant="outline" onClick={() => setCurrentStep(1)}>
                                    Précédent
                                </Button>
                                <Button
                                    onClick={uploadFile}
                                    disabled={!isMappingComplete() || isLoading}
                                >
                                    {isLoading ? 'Import...' : 'Finaliser l\'import'}
                                    <CheckCircle className="ml-2 h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Step 3: Results */}
                    {currentStep === 3 && importResult && (
                        <div className="space-y-6">
                            <div>
                                <h3 className="text-lg font-semibold mb-4">Résultat de l&rsquo;import</h3>

                                {importResult && (
                                    <Card className="bg-green-50 border-green-200">
                                        <CardContent className="pt-6">
                                            <div className="flex items-center gap-2 mb-4">
                                                <div className="rounded-lg bg-green-50 p-1.5">
                                                    <CheckCircle className="h-4 w-4 text-green-600" />
                                                </div>
                                                <h4 className="font-semibold text-green-900">Import réussi</h4>
                                            </div>
                                            <div className="space-y-2">
                                                <p className="text-sm text-green-800">
                                                    <strong>Emprunt créé:</strong> {importResult.name}
                                                </p>
                                                <p className="text-sm text-green-800">
                                                    <strong>Capital:</strong> {formatCurrency(importResult.principalAmount)}
                                                </p>
                                                <p className="text-sm text-green-800">
                                                    <strong>Durée:</strong> {importResult.durationMonths} mois
                                                </p>
                                            </div>
                                        </CardContent>
                                    </Card>
                                )}
                            </div>

                            <div className="flex justify-between">
                                <Button variant="outline" onClick={resetImport}>
                                    Nouvel import
                                </Button>
                                {importResult && (
                                    <Button onClick={() => onLoanImported?.(importResult.id)}>
                                        Voir l&rsquo;emprunt
                                    </Button>
                                )}
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div >
    );
}
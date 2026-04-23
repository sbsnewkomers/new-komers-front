'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Select } from '@/components/ui/Select';
import { AlertDialog, AlertDialogContent, AlertDialogDescription } from '@/components/ui/AlertDialog';
import { FileSpreadsheet, Download, CheckCircle, ArrowRight } from 'lucide-react';
import { loansApi } from '@/lib/loansApi';
import { entitiesApi } from '@/lib/entitiesApi';
import { apiFetch } from '@/lib/apiClient';
import {
    type LoanImport,
    EntityType,
    ImportPreviewDto,
    ColumnMappingDto,
    ImportFileFormat,
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

    // File upload state
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<ImportPreviewDto | null>(null);
    const [columnMapping, setColumnMapping] = useState<ColumnMappingDto[]>([]);
    const [importResult, setImportResult] = useState<LoanImport | null>(null);
    const [importId, setImportId] = useState<string | null>(null);

    // Form data
    const [loanName, setLoanName] = useState('');
    const [selectedEntityType, setSelectedEntityType] = useState<EntityType>(entityType || EntityType.GROUP);
    const [selectedEntityId, setSelectedEntityId] = useState(entityId || '');
    const [entities, setEntities] = useState<Array<{ id: string; name: string }>>([]);

    const fileInputRef = useRef<HTMLInputElement>(null);

    // Load groups by default on component mount
    useEffect(() => {
        if (selectedEntityType === EntityType.GROUP) {
            loadEntities(EntityType.GROUP);
        }
    }, [selectedEntityType]);

    // Auto-fill mapping when preview data is available
    useEffect(() => {
        console.log('useEffect triggered with preview:', preview);
        if (preview && preview.detectedColumns && preview.detectedColumns.length > 0) {
            console.log('Detected columns:', preview.detectedColumns);
            // Create automatic mapping based on detected columns
            const autoMapping: ColumnMappingDto[] = [];
            const requiredFields = ['dueDate', 'principalPayment', 'interestPayment', 'insurancePayment'];

            requiredFields.forEach(field => {
                const matchedColumn = preview.detectedColumns.find(col =>
                    col.toLowerCase().includes(field) ||
                    (field === 'dueDate' && col.toLowerCase().includes('date')) ||
                    (field === 'principalPayment' && col.toLowerCase().includes('capital')) ||
                    (field === 'interestPayment' && col.toLowerCase().includes('intérêt')) ||
                    (field === 'insurancePayment' && col.toLowerCase().includes('assurance'))
                );

                if (matchedColumn && !autoMapping.some(m => m.targetField === field)) {
                    autoMapping.push({
                        sourceColumn: matchedColumn,
                        targetField: field as 'dueDate' | 'principalPayment' | 'interestPayment' | 'insurancePayment'
                    });
                    console.log(`Auto-mapped: ${field} -> ${matchedColumn}`);
                }
            });

            if (autoMapping.length > 0) {
                setColumnMapping(autoMapping);
            }
        }
    }, [preview]);


    const goToNextStep = async () => {
        if (!selectedFile || !loanName || !selectedEntityType || !selectedEntityId) {
            setError('Veuillez remplir tous les champs obligatoires');
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const uploadDto = {
                file: selectedFile,
                loanName,
                entityType: selectedEntityType,
                entityId: selectedEntityId,
            };

            const result = await loansApi.uploadImportFile(uploadDto);

            if (!result) {
                apiFetch('/dummy', {
                    method: 'POST',
                    snackbar: {
                        showError: true,
                        errorMessage: 'Erreur lors du téléchargement du fichier. Veuillez réessayer.'
                    }
                });
                return;
            }

            if (result.status === 'PENDING') {
                setImportId(result.id);

                try {
                    const previewData = await loansApi.getImportPreview(result.id);
                    setPreview(previewData);
                    setCurrentStep(2);
                    return;
                } catch {
                    if (selectedFile) {
                        try {
                            const text = await selectedFile.text();
                            const lines = text.split('\n').filter(line => line.trim());
                            if (lines.length > 0) {
                                const headers = lines[0].split(',').map(h => h.trim().replace(/^["']|["']$/g, '').trim());
                                setPreview({
                                    previewRows: [],
                                    detectedColumns: headers,
                                    totalRows: lines.length - 1,
                                });
                                setCurrentStep(2);
                                return;
                            }
                        } catch (parseError) {
                            console.error('Error parsing file:', parseError);
                        }
                    }

                    setPreview({
                        previewRows: [],
                        detectedColumns: ['Veuillez sélectionner un fichier valide'],
                        totalRows: 0,
                    });
                    setCurrentStep(2);
                    return;
                }
            }

            setImportResult(result);
            setCurrentStep(3);
            if (result.loanId) {
                onLoanImported?.(result.loanId);
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Import failed';
            setError(errorMessage);
            console.error('Import error:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const downloadTemplate = async (format: ImportFileFormat) => {
        setIsLoading(true);
        try {
            const blob = await loansApi.downloadTemplate(format, {
                snackbar: {
                    showSuccess: true,
                    successMessage: `Modèle ${format} téléchargé avec succès`,
                    showError: true,
                }
            });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            const fileExtension = format === ImportFileFormat.EXCEL ? 'xlsx' : 'csv';
            a.download = `modele-echeancier.${fileExtension}`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Download failed');
        } finally {
            setIsLoading(false);
        }
    };

    const loadEntities = async (entityType: EntityType) => {
        try {
            let entitiesList: Array<{ id: string; name: string }> = [];

            switch (entityType) {
                case EntityType.GROUP:
                    entitiesList = await entitiesApi.getGroups();
                    break;
                case EntityType.COMPANY:
                    entitiesList = await entitiesApi.getCompanies();
                    break;
                case EntityType.BUSINESSUNIT:
                    // Utiliser la nouvelle API directe pour les BU accessibles par l'utilisateur
                    entitiesList = await entitiesApi.getBusinessUnitsForUser();
                    break;
                default:
                    entitiesList = [];
            }

            setEntities(entitiesList);
        } catch (error) {
            console.error('Error loading entities:', error);
            setEntities([]);
        }
    };

    const handleEntityTypeChange = (value: string) => {
        const entityType = value as EntityType;
        setSelectedEntityType(entityType);
        setSelectedEntityId('');
        loadEntities(entityType);
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

    const processImport = async () => {
        if (!preview || !isImportReady()) {
            setError('Veuillez compléter le mapping des colonnes');
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            if (!importId) {
                setError('ID d\'import manquant');
                return;
            }

            const processDto = {
                importId,
                loanName,
                entityType: selectedEntityType,
                entityId: selectedEntityId,
                columnMapping,
            };

            const result = await loansApi.processImport(processDto);

            setImportResult(result as LoanImport);
            setCurrentStep(3);
            if (result.loanId) {
                onLoanImported?.(result.loanId);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Processing failed');
        } finally {
            setIsLoading(false);
        }
    };

    const resetImport = () => {
        setCurrentStep(1);
        setSelectedFile(null);
        setPreview(null);
        setColumnMapping([]);
        setImportResult(null);
        setLoanName('');
        setError(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const getRequiredColumns = () => ['dueDate', 'principalPayment', 'interestPayment', 'insurancePayment'];

    const isImportReady = () => {
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
                                        <Label htmlFor="loanName">Nom de l&rsquo;emprunt<span className="text-red-500">*</span></Label>
                                        <Input
                                            id="loanName"
                                            placeholder="ex: Prêt BNP Agence X"
                                            value={loanName}
                                            onChange={(e) => setLoanName(e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="entityType">Type d&rsquo;entité<span className="text-red-500">*</span></Label>
                                        <Select
                                            value={selectedEntityType}
                                            onValueChange={handleEntityTypeChange}
                                        >
                                            <option value={EntityType.GROUP}>Groupe</option>
                                            <option value={EntityType.COMPANY}>Entreprise</option>
                                            <option value={EntityType.BUSINESSUNIT}>Unité de business</option>
                                        </Select>
                                    </div>
                                    <div>
                                        <Label htmlFor="entityId">Entité<span className="text-red-500">*</span></Label>
                                        <Select
                                            id="entityId"
                                            value={selectedEntityId || ''}
                                            onValueChange={(value) => setSelectedEntityId(value)}
                                            disabled={!selectedEntityType}
                                        >
                                            <option value="">Sélectionner une entité...</option>
                                            {entities.map((entity) => (
                                                <option key={entity.id} value={entity.id}>
                                                    {entity.name}
                                                </option>
                                            ))}
                                        </Select>
                                    </div>
                                    <div>
                                        <Label htmlFor="fileInput">Fichier Excel/CSV<span className="text-red-500">*</span></Label>
                                        <Input
                                            id="fileInput"
                                            type="file"
                                            accept=".xlsx,.xls,.csv"
                                            onChange={(e) => {
                                                const file = e.target.files?.[0];
                                                if (file) {
                                                    setSelectedFile(file);
                                                }
                                            }}
                                            disabled={isLoading}
                                        />
                                    </div>
                                </div>
                                <div className="flex justify-end">
                                    <Button
                                        onClick={goToNextStep}
                                        disabled={isLoading || !selectedFile || !loanName || !selectedEntityType || !selectedEntityId}
                                    >
                                        {isLoading ? 'Chargement...' : 'suivant'}
                                        <ArrowRight className="ml-2 h-4 w-4" />
                                    </Button>
                                </div>
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
                                    onClick={processImport}
                                    disabled={!isImportReady() || isLoading}
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
                                                    <strong>Emprunt créé:</strong> {importResult.loan?.name || 'Prêt importé'}
                                                </p>
                                                <p className="text-sm text-green-800">
                                                    <strong>Capital:</strong> {importResult.loan ? formatCurrency(importResult.loan.principalAmount) : 'N/A'}
                                                </p>
                                                <p className="text-sm text-green-800">
                                                    <strong>Durée:</strong> {importResult.loan ? `${importResult.loan.durationMonths} mois` : 'N/A'}
                                                </p>
                                                <p className="text-sm text-green-800">
                                                    <strong>Fichier:</strong> {importResult.originalFileName}
                                                </p>
                                                <p className="text-sm text-green-800">
                                                    <strong>Lignes importées:</strong> {importResult.importedRows} / {importResult.totalRows}
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
                                {importResult && importResult.loanId && (
                                    <Button onClick={() => onLoanImported?.(importResult.loanId!)}>
                                        Voir l&rsquo;emprunt
                                    </Button>
                                )}
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
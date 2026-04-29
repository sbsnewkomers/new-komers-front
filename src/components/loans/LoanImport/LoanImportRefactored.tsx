'use client';

import React, { useState, useRef, useEffect } from 'react';
import { FileSpreadsheet } from 'lucide-react';
import { loansApi } from '@/lib/loansApi';
import { entitiesApi } from '@/lib/entitiesApi';
import {
    type LoanImport,
    EntityType,
    ImportPreviewDto,
    ColumnMappingDto,
    ImportFileFormat,
} from '@/types/loans';

import { StepIndicator } from './StepIndicator';
import { FileUploadStep } from './FileUploadStep';
import { ColumnMappingStep } from './ColumnMappingStep';
import { PreviewStep } from './PreviewStep';
import { ModelPreviewDialog } from './ModelPreviewDialog';

interface LoanImportProps {
    onLoanImported?: (loanId: string) => void;
    entityType?: EntityType;
    entityId?: string;
}

export function LoanImport({ onLoanImported, entityType, entityId }: LoanImportProps) {
    // State
    const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // File and preview state
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<ImportPreviewDto | null>(null);
    const [columnMapping, setColumnMapping] = useState<ColumnMappingDto[]>([]);
    const [importResult, setImportResult] = useState<LoanImport | null>(null);
    const [importId, setImportId] = useState<string | null>(null);

    // Form state
    const [loanName, setLoanName] = useState('');
    const [selectedEntityType, setSelectedEntityType] = useState<EntityType>(
        entityType || EntityType.GROUP,
    );
    const [selectedEntityId, setSelectedEntityId] = useState(entityId || '');
    const [entities, setEntities] = useState<Array<{ id: string; name: string }>>([]);
    const [nameValidationError, setNameValidationError] = useState<string | null>(null);
    const [showModelPreview, setShowModelPreview] = useState(false);
    const [selectedModelFormat, setSelectedModelFormat] = useState<ImportFileFormat>(ImportFileFormat.EXCEL);

    const fileInputRef = useRef<HTMLInputElement>(null);

    // Utility functions
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

    const getRequiredColumns = () => [
        'dueDate',
        'principalPayment',
        'interestPayment',
        'insurancePayment',
    ];

    // API calls
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

    const validateLoanName = async (name: string, entityType: EntityType, entityId: string) => {
        if (!name.trim() || !entityType || !entityId) {
            setNameValidationError(null);
            return;
        }

        try {
            const response = await loansApi.checkLoanNameUniqueness(name, entityType, entityId);
            if (!response.isUnique) {
                setNameValidationError(`Un prêt avec le nom "${name}" existe déjà pour cette entité`);
            } else {
                setNameValidationError(null);
            }
        } catch (error) {
            console.error('Error validating loan name:', error);
            setNameValidationError(null);
        }
    };

    // Event handlers
    const handleEntityTypeChange = (value: string) => {
        const entityType = value as EntityType;
        setSelectedEntityType(entityType);
        setSelectedEntityId('');
        loadEntities(entityType);
    };

    const handleColumnMapping = (
        sourceColumn: string,
        targetField: 'dueDate' | 'principalPayment' | 'interestPayment' | 'insurancePayment',
    ) => {
        setColumnMapping((prev) => {
            const filtered = prev.filter((m) => m.sourceColumn !== sourceColumn);
            if (targetField) {
                return [...filtered, { sourceColumn, targetField }];
            }
            return filtered;
        });
    };

    const downloadTemplate = async (format: ImportFileFormat) => {
        setIsLoading(true);
        try {
            const blob = await loansApi.downloadTemplate(format, {
                snackbar: {
                    showSuccess: true,
                    successMessage: `Modèle ${format} téléchargé avec succès`,
                    showError: true,
                },
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

    const goToNextStep = async () => {
        if (!selectedFile || !loanName || !selectedEntityType || !selectedEntityId) {
            setError('Veuillez remplir tous les champs obligatoires');
            return;
        }

        if (nameValidationError) {
            setError(nameValidationError);
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
                setError('Erreur lors du téléchargement du fichier. Veuillez réessayer.');
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
                            const lines = text.split('\n').filter((line) => line.trim());
                            if (lines.length > 0) {
                                const headers = lines[0]
                                    .split(',')
                                    .map((h) => h.trim().replace(/^["']|["']$/g, '').trim());
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

    const processImport = async () => {
        if (!preview || !isImportReady()) {
            setError('Veuillez compléter le mapping des colonnes');
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            if (!importId) {
                setError("ID d'import manquant");
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
            if (result.loanId) {
                onLoanImported?.(result.loanId);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Processing failed');
        } finally {
            setIsLoading(false);
        }
    };

    const isImportReady = () => {
        const required = getRequiredColumns();
        return required.every((field) =>
            columnMapping.some((mapping) => mapping.targetField === field),
        );
    };

    // Effects
    useEffect(() => {
        if (selectedEntityType === EntityType.GROUP) {
            loadEntities(EntityType.GROUP);
        }
    }, [selectedEntityType]);

    useEffect(() => {
        if (preview && preview.detectedColumns && preview.detectedColumns.length > 0) {
            const autoMapping: ColumnMappingDto[] = [];
            const requiredFields = [
                'dueDate',
                'principalPayment',
                'interestPayment',
                'insurancePayment',
            ];

            requiredFields.forEach((field) => {
                const matchedColumn = preview.detectedColumns.find(
                    (col) =>
                        col.toLowerCase().includes(field) ||
                        (field === 'dueDate' && col.toLowerCase().includes('date')) ||
                        (field === 'principalPayment' &&
                            col.toLowerCase().includes('capital')) ||
                        (field === 'interestPayment' &&
                            col.toLowerCase().includes('intérêt')) ||
                        (field === 'insurancePayment' &&
                            col.toLowerCase().includes('assurance')),
                );

                if (matchedColumn && !autoMapping.some((m) => m.targetField === field)) {
                    autoMapping.push({
                        sourceColumn: matchedColumn,
                        targetField: field as
                            | 'dueDate'
                            | 'principalPayment'
                            | 'interestPayment'
                            | 'insurancePayment',
                    });
                }
            });

            if (autoMapping.length > 0) {
                setColumnMapping(autoMapping);
            }
        }
    }, [preview]);

    useEffect(() => {
        if (loanName.trim() && selectedEntityType && selectedEntityId) {
            validateLoanName(loanName, selectedEntityType, selectedEntityId);
        } else {
            setNameValidationError(null);
        }
    }, [loanName, selectedEntityType, selectedEntityId]);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50">
                        <FileSpreadsheet className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div>
                        <h3 className="text-base font-semibold text-slate-900">
                            Import d&apos;échéancier Excel / CSV
                        </h3>
                        <p className="text-xs text-slate-500">
                            Importez un échéancier existant depuis un fichier Excel ou CSV.
                        </p>
                    </div>
                </div>
                <div className="mt-6">
                    <StepIndicator currentStep={currentStep} />
                </div>
            </div>

            {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                    <p className="text-sm text-red-800">{error}</p>
                </div>
            )}

            {/* Step 1: File Upload */}
            {currentStep === 1 && (
                <FileUploadStep
                    loanName={loanName}
                    setLoanName={setLoanName}
                    selectedEntityType={selectedEntityType}
                    setSelectedEntityType={handleEntityTypeChange}
                    selectedEntityId={selectedEntityId}
                    setSelectedEntityId={setSelectedEntityId}
                    entities={entities}
                    selectedFile={selectedFile}
                    setSelectedFile={setSelectedFile}
                    selectedModelFormat={selectedModelFormat}
                    setSelectedModelFormat={setSelectedModelFormat}
                    showModelPreview={showModelPreview}
                    setShowModelPreview={setShowModelPreview}
                    nameValidationError={nameValidationError}
                    isLoading={isLoading}
                    onDownloadTemplate={downloadTemplate}
                    onGoToNextStep={goToNextStep}
                    fileInputRef={fileInputRef}
                />
            )}

            {/* Step 2: Column Mapping */}
            {currentStep === 2 && (
                <ColumnMappingStep
                    preview={preview}
                    columnMapping={columnMapping}
                    onColumnMapping={handleColumnMapping}
                    onGoToPreviousStep={() => setCurrentStep(1)}
                    onFinalizeMapping={() => setCurrentStep(3)}
                    isLoading={isLoading}
                />
            )}

            {/* Step 3: Preview/Results */}
            {currentStep === 3 && (
                <PreviewStep
                    loanName={loanName}
                    selectedEntityId={selectedEntityId}
                    entities={entities}
                    selectedFile={selectedFile}
                    columnMapping={columnMapping}
                    preview={preview}
                    importResult={importResult}
                    isLoading={isLoading}
                    onModifyMapping={() => setCurrentStep(2)}
                    onSaveImport={processImport}
                    onNewImport={resetImport}
                    onViewLoan={onLoanImported || (() => {})}
                />
            )}

            {/* Model Preview Dialog */}
            <ModelPreviewDialog
                showModelPreview={showModelPreview}
                setShowModelPreview={setShowModelPreview}
                selectedModelFormat={selectedModelFormat}
                onDownloadTemplate={downloadTemplate}
            />
        </div>
    );
}

'use client';

import { useState, useEffect } from 'react';
import { loansApi } from '@/lib/loansApi';
import { entitiesApi } from '@/lib/entitiesApi';
import { Loan, EntityType, ImportPreviewDto, ColumnMappingDto, ImportFileFormat, ImportResultDto, LoanInputMethod } from '@/types/loans';

interface UseImportLoanEditProps {
    loanId: string;
}

export function useImportLoanEdit({ loanId }: UseImportLoanEditProps) {
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [loan, setLoan] = useState<Loan | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Import state
    const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<ImportPreviewDto | null>(null);
    const [columnMapping, setColumnMapping] = useState<ColumnMappingDto[]>([]);
    const [importResult, setImportResult] = useState<ImportResultDto | null>(null);
    const [importId, setImportId] = useState<string | null>(null);

    // Form state
    const [loanName, setLoanName] = useState('');
    const [selectedEntityType, setSelectedEntityType] = useState<EntityType>(EntityType.COMPANY);
    const [selectedEntityId, setSelectedEntityId] = useState('');
    const [entities, setEntities] = useState<Array<{ id: string; name: string }>>([]);
    const [nameValidationError, setNameValidationError] = useState<string | null>(null);
    const [showModelPreview, setShowModelPreview] = useState(false);
    const [selectedModelFormat, setSelectedModelFormat] = useState<ImportFileFormat>(ImportFileFormat.EXCEL);

    // Load entities based on entity type
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

    // Load loan data
    useEffect(() => {
        const loadLoan = async () => {
            try {
                setIsLoading(true);
                const loanData = await loansApi.getLoan(loanId);


                setLoan(loanData);
                setLoanName(loanData.name);
                setSelectedEntityType(loanData.entityType);
                setSelectedEntityId(loanData.entityId);

                // Load entities for the current entity type
                await loadEntities(loanData.entityType);

            } catch (err) {
                setError(err instanceof Error ? err.message : 'Erreur lors du chargement du prêt');
            } finally {
                setIsLoading(false);
            }
        };

        loadLoan();
    }, [loanId]);

    // Validate loan name uniqueness
    const validateLoanName = async (name: string): Promise<boolean> => {
        if (!name || name === loan?.name) return true;

        try {
            const result = await loansApi.checkLoanNameUniqueness(
                name,
                selectedEntityType,
                selectedEntityId,
                loanId // Exclude current loan from validation
            );
            return result.isUnique;
        } catch {
            return false;
        }
    };

    // Handle entity type change
    const handleEntityTypeChange = (value: string) => {
        const entityType = value as EntityType;
        setSelectedEntityType(entityType);
        setSelectedEntityId('');
        loadEntities(entityType);
    };

    // Handle loan name change with validation
    const handleLoanNameChange = async (name: string) => {
        setLoanName(name);

        if (name && name !== loan?.name) {
            const isUnique = await validateLoanName(name);
            setNameValidationError(isUnique ? null : 'Ce nom de prêt existe déjà pour cette entité');
        } else {
            setNameValidationError(null);
        }
    };

    // File upload for update
    const handleFileUpload = async (file: File) => {
        setSelectedFile(file);
        setIsLoading(true);
        setError(null);

        try {
            // Use the proper API method for update
            const importData = await loansApi.uploadUpdateImportFile(file, loanId);
            setImportId(importData.id);

            // Get preview data
            const previewData = await loansApi.getImportPreview(importData.id);
            setPreview(previewData);
            setColumnMapping([]); // Start with empty mapping for user to configure
            setCurrentStep(2);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erreur lors du téléchargement du fichier');
        } finally {
            setIsLoading(false);
        }
    };

    // Process column mapping - go to preview step first
    const handleColumnMappingSubmit = async (mapping: ColumnMappingDto[]) => {
        setColumnMapping(mapping);
        setCurrentStep(3);
    };

    // Save loan with updated information
    const saveLoan = async (): Promise<Loan> => {
        if (!loan) throw new Error('Prêt non chargé');

        // Validate
        if (!loanName.trim()) {
            throw new Error('Le nom du prêt est requis');
        }

        if (nameValidationError) {
            throw new Error('Veuillez corriger les erreurs de validation');
        }

        setIsSaving(true);

        try {
            // Process the import first if not already processed
            if (!importResult && importId && columnMapping.length > 0) {
                const data = await loansApi.processUpdateImport({
                    importId,
                    columnMapping: columnMapping,
                    targetLoanId: loanId,
                });
                setImportResult(data);

                if (data.status !== 'COMPLETED') {
                    throw new Error('L\'import n\'a pas été complété avec succès');
                }
            } else if (!importResult || importResult.status !== 'COMPLETED') {
                throw new Error('L\'import n\'a pas été complété avec succès');
            }

            // Use standard API for ALL loans edited via import method
            // Always set inputMethod to IMPORT when editing via import method
            const updateData: Record<string, unknown> = {
                inputMethod: LoanInputMethod.IMPORT,
            };
            if (loanName !== loan.name) updateData.name = loanName;
            if (selectedEntityType !== loan.entityType) updateData.entityType = selectedEntityType;
            if (selectedEntityId !== loan.entityId) updateData.entityId = selectedEntityId;

            const updatedLoan = await loansApi.updateLoan(loanId, updateData);

            return updatedLoan;
        } finally {
            setIsSaving(false);
        }
    };

    // Reset import process
    const resetImport = () => {
        setCurrentStep(1);
        setSelectedFile(null);
        setPreview(null);
        setColumnMapping([]);
        setImportResult(null);
        setImportId(null);
        setError(null);
    };

    // Download template
    const downloadTemplate = async (format: ImportFileFormat) => {
        try {
            await loansApi.downloadTemplate(format);
        } catch (err) {
            console.error('Error downloading template:', err);
        }
    };

    // Handle column mapping updates
    const handleColumnMappingUpdate = (sourceColumn: string, targetField: 'dueDate' | 'principalPayment' | 'interestPayment' | 'insurancePayment') => {
        const newMapping = columnMapping.filter(m => m.sourceColumn !== sourceColumn);
        newMapping.push({ sourceColumn, targetField });
        setColumnMapping(newMapping);
    };

    // Get required columns for mapping
    const getRequiredColumns = () => [
        'dueDate',
        'principalPayment',
        'interestPayment',
        'insurancePayment',
    ];

    return {
        // State
        isLoading,
        isSaving,
        loan,
        error,
        currentStep,
        selectedFile,
        preview,
        columnMapping,
        importResult,
        importId,
        loanName,
        selectedEntityType,
        selectedEntityId,
        entities,
        nameValidationError,
        showModelPreview,
        selectedModelFormat,

        // Actions
        setLoanName: handleLoanNameChange,
        setSelectedEntityType: handleEntityTypeChange,
        setSelectedEntityId,
        setNameValidationError,
        setShowModelPreview,
        setSelectedModelFormat,
        setCurrentStep,
        handleFileUpload,
        handleColumnMappingSubmit,
        handleColumnMappingUpdate,
        resetImport,
        downloadTemplate,
        saveLoan,
        getRequiredColumns,
    };
}

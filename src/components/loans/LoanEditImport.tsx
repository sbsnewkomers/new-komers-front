'use client';

import React from 'react';
import { ArrowLeft, AlertTriangle, Loader2, FileSpreadsheet } from 'lucide-react';
import { Loan } from '@/types/loans';
import { Button } from '@/components/ui/Button';
import { useImportLoanEdit } from './import/hooks/useImportLoanEdit';
import { StepIndicator } from './import/StepIndicator';
import { FileUploadStep } from './import/FileUploadStep';
import { ColumnMappingStep } from './import/ColumnMappingStep';
import { PreviewStep } from './import/PreviewStep';
import { ModelPreviewDialog } from './import/ModelPreviewDialog';

interface LoanEditImportProps {
    loanId: string;
    onBack: () => void;
    onLoanUpdated: (loan: Loan) => void;
}

export function LoanEditImport({ loanId, onBack, onLoanUpdated }: LoanEditImportProps) {
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    const {
        isLoading,
        isSaving,
        loan,
        error,
        currentStep,
        selectedFile,
        preview,
        columnMapping,
        importResult,
        loanName,
        selectedEntityType,
        selectedEntityId,
        entities,
        nameValidationError,
        showModelPreview,
        selectedModelFormat,

        setLoanName,
        setSelectedEntityType,
        setSelectedEntityId,
        setShowModelPreview,
        setSelectedModelFormat,
        setCurrentStep,
        handleFileUpload,
        handleColumnMappingSubmit,
        handleColumnMappingUpdate,
        resetImport,
        downloadTemplate,
        saveLoan,
    } = useImportLoanEdit({ loanId });

    const handleFileSelect = (file: File | null) => {
        if (file) {
            handleFileUpload(file);
        }
    };

    const handleViewLoan = () => {
        // Navigate to loan details view
        if (loan) {
            onLoanUpdated(loan);
        }
    };

    const handleSaveLoan = async () => {
        try {
            const updatedLoan = await saveLoan();
            onLoanUpdated(updatedLoan);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la sauvegarde';
            const { emitSnackbar } = await import('@/ui/snackbarBus');
            emitSnackbar({
                message: errorMessage,
                variant: 'error'
            });
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-2 text-muted-foreground">Chargement du prêt...</span>
            </div>
        );
    }

    if (error) {
        return (
            <div className="space-y-4">
                <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                    <div className="flex items-center">
                        <AlertTriangle className="h-4 w-4 text-red-600 mr-2" />
                        <p className="text-red-800">{error}</p>
                    </div>
                </div>
                <Button onClick={onBack} variant="outline">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Retour
                </Button>
            </div>
        );
    }

    if (!loan) {
        return (
            <div className="space-y-4">
                <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                    <div className="flex items-center">
                        <AlertTriangle className="h-4 w-4 text-red-600 mr-2" />
                        <p className="text-red-800">Prêt non trouvé</p>
                    </div>
                </div>
                <Button onClick={onBack} variant="outline">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Retour
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        onClick={onBack}
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-900"
                        aria-label="Retour"
                    >
                        <ArrowLeft className="h-4 w-4" />
                    </button>
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-50">
                            <FileSpreadsheet className="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                            <h3 className="text-base font-semibold text-slate-900">
                                Modification par import
                            </h3>
                            <p className="text-xs text-slate-500">{loan.name}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Step Indicator */}
            <StepIndicator currentStep={currentStep} />

            {/* Warning about import modification */}
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                <div className="flex items-start">
                    <AlertTriangle className="h-4 w-4 text-amber-600 mr-2 mt-0.5" />
                    <div>
                        <p className="text-amber-900 text-sm font-medium">
                            Attention : Modification par import
                        </p>
                        <p className="text-amber-700 text-xs mt-1">
                            Vous allez remplacer l&apos;échéancier existant par un nouvel échéancier importé depuis un fichier.
                            Cette action est irréversible.
                        </p>
                    </div>
                </div>
            </div>

            {/* Step 1: File Upload */}
            {currentStep === 1 && (
                <FileUploadStep
                    loanName={loanName}
                    setLoanName={setLoanName}
                    selectedEntityType={selectedEntityType}
                    setSelectedEntityType={setSelectedEntityType}
                    selectedEntityId={selectedEntityId}
                    setSelectedEntityId={setSelectedEntityId}
                    entities={entities}
                    selectedFile={selectedFile}
                    setSelectedFile={handleFileSelect}
                    selectedModelFormat={selectedModelFormat}
                    setSelectedModelFormat={setSelectedModelFormat}
                    showModelPreview={showModelPreview}
                    setShowModelPreview={setShowModelPreview}
                    nameValidationError={nameValidationError}
                    isLoading={isLoading}
                    onDownloadTemplate={downloadTemplate}
                    onGoToNextStep={() => { }} // Not used in update mode
                    fileInputRef={fileInputRef}
                />
            )}

            {/* Step 2: Column Mapping */}
            {currentStep === 2 && preview && (
                <ColumnMappingStep
                    preview={preview}
                    columnMapping={columnMapping}
                    onColumnMapping={handleColumnMappingUpdate}
                    onGoToPreviousStep={resetImport}
                    onFinalizeMapping={() => handleColumnMappingSubmit(columnMapping)}
                    isLoading={isLoading}
                />
            )}

            {/* Step 3: Preview and Confirmation */}
            {currentStep === 3 && (
                <PreviewStep
                    loanName={loanName}
                    selectedEntityId={selectedEntityId}
                    entities={entities}
                    selectedFile={selectedFile}
                    columnMapping={columnMapping}
                    preview={preview}
                    importResult={importResult}
                    isLoading={isSaving}
                    onModifyMapping={() => setCurrentStep(2)}
                    onSaveImport={handleSaveLoan}
                    onNewImport={resetImport}
                    onViewLoan={handleViewLoan}
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

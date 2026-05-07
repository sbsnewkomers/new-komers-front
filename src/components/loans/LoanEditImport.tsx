'use client';

import React from 'react';
import { ArrowLeft, AlertTriangle, Loader2, FileSpreadsheet } from 'lucide-react';
import { Loan } from '@/types/loans';
import { Button } from '@/components/ui/Button';
import { useImportLoanEdit } from './import/hooks/useImportLoanEdit';
import { StepIndicator } from '@/components/ui/StepIndicator';
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
    const steps = React.useMemo(
        () => [
            { n: 1, label: 'Fichier' },
            { n: 2, label: 'Mapping' },
            { n: 3, label: 'Résultat' },
        ],
        [],
    );

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
                <Loader2 className="h-8 w-8 animate-spin text-(--nebula-gold-light)" />
                <span className="ml-2 text-(--nebula-muted)">Chargement du prêt...</span>
            </div>
        );
    }

    if (error) {
        return (
            <div className="space-y-4">
                <div className="nebula-glass rounded-2xl border border-red-400/30 bg-red-500/10 p-4">
                    <div className="flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 shrink-0 text-red-300" />
                        <p className="text-sm text-red-100">{error}</p>
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
                <div className="nebula-glass rounded-2xl border border-red-400/30 bg-red-500/10 p-4">
                    <div className="flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 shrink-0 text-red-300" />
                        <p className="text-sm text-red-100">Prêt non trouvé</p>
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
            <div className="nebula-glass nebula-blob flex flex-col gap-4 rounded-3xl border border-white/10 p-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        onClick={onBack}
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white/70 transition-colors hover:bg-white/10 hover:text-white"
                        aria-label="Retour"
                    >
                        <ArrowLeft className="h-4 w-4" />
                    </button>
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5">
                            <FileSpreadsheet className="h-5 w-5 text-(--nebula-gold-light)" />
                        </div>
                        <div>
                            <h3 className="text-base font-semibold text-white">
                                Modification par import
                            </h3>
                            <p className="text-xs text-(--nebula-muted)">{loan.name}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Step Indicator */}
            <StepIndicator currentStep={currentStep} steps={steps} />

            {/* Warning about import modification */}
            <div className="rounded-2xl border border-amber-400/25 bg-amber-500/10 p-4">
                <div className="flex items-start gap-2">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-200" />
                    <div>
                        <p className="text-sm font-medium text-white">
                            Attention : Modification par import
                        </p>
                        <p className="mt-1 text-xs text-(--nebula-muted)">
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

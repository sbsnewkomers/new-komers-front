'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Select } from '@/components/ui/Select';
import {
    AlertDialog,
    AlertDialogContent,
    AlertDialogDescription,
} from '@/components/ui/AlertDialog';
import {
    FileSpreadsheet,
    Download,
    CheckCircle,
    ArrowRight,
    ArrowLeft,
    UploadCloud,
    FileText,
    Info,
    Check,
} from 'lucide-react';
import { loansApi } from '@/lib/loansApi';
import { entitiesApi } from '@/lib/entitiesApi';
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

const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: 'EUR',
    }).format(amount);

function StepIndicator({ currentStep }: { currentStep: number }) {
    const steps = [
        { n: 1, label: 'Fichier' },
        { n: 2, label: 'Mapping' },
        { n: 3, label: 'Résultat' },
    ];
    return (
        <div className="flex items-center">
            {steps.map((s, i) => {
                const isActive = currentStep === s.n;
                const isDone = currentStep > s.n;
                return (
                    <React.Fragment key={s.n}>
                        <div className="flex items-center gap-2">
                            <div
                                className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold transition-colors ${isDone
                                    ? 'bg-emerald-500 text-white'
                                    : isActive
                                        ? 'bg-primary text-white'
                                        : 'bg-slate-100 text-slate-400'
                                    }`}
                            >
                                {isDone ? <Check className="h-4 w-4" /> : s.n}
                            </div>
                            <span
                                className={`hidden text-xs font-medium sm:inline ${isActive
                                    ? 'text-slate-900'
                                    : isDone
                                        ? 'text-slate-700'
                                        : 'text-slate-400'
                                    }`}
                            >
                                {s.label}
                            </span>
                        </div>
                        {i < steps.length - 1 && (
                            <div
                                className={`mx-3 h-0.5 flex-1 rounded-full transition-colors ${currentStep > s.n ? 'bg-emerald-500' : 'bg-slate-200'
                                    }`}
                            />
                        )}
                    </React.Fragment>
                );
            })}
        </div>
    );
}

export function LoanImport({ onLoanImported, entityType, entityId }: LoanImportProps) {
    const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<ImportPreviewDto | null>(null);
    const [columnMapping, setColumnMapping] = useState<ColumnMappingDto[]>([]);
    const [importResult, setImportResult] = useState<LoanImport | null>(null);
    const [importId, setImportId] = useState<string | null>(null);

    const [loanName, setLoanName] = useState('');
    const [selectedEntityType, setSelectedEntityType] = useState<EntityType>(
        entityType || EntityType.GROUP,
    );
    const [selectedEntityId, setSelectedEntityId] = useState(entityId || '');
    const [entities, setEntities] = useState<Array<{ id: string; name: string }>>([]);
    const [nameValidationError, setNameValidationError] = useState<string | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);

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

    // Validate loan name when it changes or when entity changes
    useEffect(() => {
        if (loanName.trim() && selectedEntityType && selectedEntityId) {
            validateLoanName(loanName, selectedEntityType, selectedEntityId);
        } else {
            setNameValidationError(null);
        }
    }, [loanName, selectedEntityType, selectedEntityId]);

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

    const getRequiredColumns = () => [
        'dueDate',
        'principalPayment',
        'interestPayment',
        'insurancePayment',
    ];

    const isImportReady = () => {
        const required = getRequiredColumns();
        return required.every((field) =>
            columnMapping.some((mapping) => mapping.targetField === field),
        );
    };

    const fieldLabel = (field: string) =>
        field === 'dueDate'
            ? 'Date'
            : field === 'principalPayment'
                ? 'Capital'
                : field === 'interestPayment'
                    ? 'Intérêts'
                    : field === 'insurancePayment'
                        ? 'Assurance'
                        : field;

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
                <AlertDialog open={true} onOpenChange={() => setError(null)}>
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
                    {/* Templates */}
                    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                        <h3 className="mb-1 text-sm font-semibold text-slate-900">
                            Télécharger un modèle
                        </h3>
                        <p className="mb-5 text-xs text-slate-500">
                            Utilisez un modèle pré-configuré pour préparer votre fichier.
                        </p>

                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            {(
                                [
                                    {
                                        format: ImportFileFormat.EXCEL,
                                        label: 'Modèle Excel',
                                        ext: '.xlsx',
                                        desc: 'Format avec colonnes pré-configurées',
                                        color: 'text-emerald-600',
                                        bg: 'bg-emerald-50',
                                    },
                                    {
                                        format: ImportFileFormat.CSV,
                                        label: 'Modèle CSV',
                                        ext: '.csv',
                                        desc: 'Compatible avec tous les tableurs',
                                        color: 'text-blue-600',
                                        bg: 'bg-blue-50',
                                    },
                                ] as const
                            ).map((t) => (
                                <div
                                    key={t.format}
                                    className="rounded-xl border border-slate-200 bg-slate-50/40 p-4"
                                >
                                    <div className="mb-3 flex items-center gap-3">
                                        <div
                                            className={`flex h-10 w-10 items-center justify-center rounded-lg ${t.bg}`}
                                        >
                                            <FileText className={`h-5 w-5 ${t.color}`} />
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold text-slate-900">
                                                {t.label}
                                            </p>
                                            <p className="text-xs text-slate-500">{t.desc}</p>
                                        </div>
                                    </div>
                                    <Button
                                        variant="outline"
                                        onClick={() => downloadTemplate(t.format)}
                                        disabled={isLoading}
                                        className="w-full"
                                    >
                                        <Download className="h-4 w-4" />
                                        Télécharger {t.ext}
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Loan info + upload */}
                    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                        <h3 className="mb-1 text-sm font-semibold text-slate-900">
                            Informations sur l&apos;emprunt
                        </h3>
                        <p className="mb-5 text-xs text-slate-500">
                            Renseignez les informations de base et importez votre fichier.
                        </p>

                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <div>
                                <Label
                                    htmlFor="loanName"
                                    className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500"
                                >
                                    Nom de l&apos;emprunt <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    id="loanName"
                                    placeholder="ex: Prêt BNP Agence X"
                                    value={loanName}
                                    onChange={(e) => setLoanName(e.target.value)}
                                    className={nameValidationError ? 'border-red-500' : ''}
                                />
                                {nameValidationError && (
                                    <p className="mt-1 text-xs text-red-600">
                                        {nameValidationError}
                                    </p>
                                )}
                            </div>
                            <div>
                                <Label
                                    htmlFor="entityType"
                                    className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500"
                                >
                                    Type d&apos;entité <span className="text-red-500">*</span>
                                </Label>
                                <Select
                                    value={selectedEntityType}
                                    onValueChange={handleEntityTypeChange}
                                >
                                    <option value={EntityType.GROUP}>Groupe</option>
                                    <option value={EntityType.COMPANY}>Entreprise</option>
                                    <option value={EntityType.BUSINESSUNIT}>
                                        Unité d&apos;affaires
                                    </option>
                                </Select>
                            </div>
                            <div>
                                <Label
                                    htmlFor="entityId"
                                    className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500"
                                >
                                    Entité <span className="text-red-500">*</span>
                                </Label>
                                <Select
                                    id="entityId"
                                    value={selectedEntityId || ''}
                                    onValueChange={(value) => setSelectedEntityId(value)}
                                    disabled={!selectedEntityType}
                                >
                                    <option value="">Sélectionner une entité…</option>
                                    {entities.map((entity) => (
                                        <option key={entity.id} value={entity.id}>
                                            {entity.name}
                                        </option>
                                    ))}
                                </Select>
                            </div>
                            <div>
                                <Label
                                    htmlFor="fileInput"
                                    className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500"
                                >
                                    Fichier Excel / CSV <span className="text-red-500">*</span>
                                </Label>
                                <label
                                    htmlFor="fileInput"
                                    className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-slate-300 bg-slate-50/60 px-3 py-2 text-sm text-slate-600 transition hover:border-slate-400 hover:bg-slate-50"
                                >
                                    <UploadCloud className="h-4 w-4 text-slate-500" />
                                    <span className="truncate">
                                        {selectedFile
                                            ? selectedFile.name
                                            : 'Choisir un fichier .xlsx, .xls ou .csv'}
                                    </span>
                                    <input
                                        id="fileInput"
                                        ref={fileInputRef}
                                        type="file"
                                        accept=".xlsx,.xls,.csv"
                                        className="hidden"
                                        onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (file) {
                                                setSelectedFile(file);
                                            }
                                        }}
                                        disabled={isLoading}
                                    />
                                </label>
                            </div>
                        </div>

                        <div className="mt-6 flex justify-end border-t border-slate-100 pt-5">
                            <Button
                                onClick={goToNextStep}
                                disabled={
                                    isLoading ||
                                    !selectedFile ||
                                    !loanName ||
                                    !selectedEntityType ||
                                    !selectedEntityId
                                }
                                className="bg-primary text-white hover:bg-slate-800"
                            >
                                {isLoading ? 'Chargement…' : 'Suivant'}
                                <ArrowRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Step 2: Column Mapping */}
            {currentStep === 2 && (
                <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                    <h3 className="mb-1 text-sm font-semibold text-slate-900">
                        Mapping des colonnes
                    </h3>
                    <p className="mb-5 text-xs text-slate-500">
                        Associez chaque colonne de votre fichier au champ correspondant.
                    </p>

                    <div className="space-y-3">
                        {getRequiredColumns().map((field) => (
                            <div
                                key={field}
                                className="flex flex-col gap-2 rounded-lg border border-slate-100 bg-slate-50/40 p-3 sm:flex-row sm:items-center"
                            >
                                <Label className="w-32 shrink-0 text-xs font-semibold uppercase tracking-wider text-slate-500">
                                    {fieldLabel(field)}{' '}
                                    <span className="text-red-500">*</span>
                                </Label>
                                <div className="flex-1">
                                    <Select
                                        value={
                                            columnMapping.find((m) => m.targetField === field)
                                                ?.sourceColumn || ''
                                        }
                                        onValueChange={(value) =>
                                            handleColumnMapping(
                                                value,
                                                field as
                                                | 'dueDate'
                                                | 'principalPayment'
                                                | 'interestPayment'
                                                | 'insurancePayment',
                                            )
                                        }
                                    >
                                        <option value="">-- Sélectionner une colonne --</option>
                                        {preview?.detectedColumns.map((column) => (
                                            <option key={column} value={column}>
                                                {column}
                                            </option>
                                        ))}
                                    </Select>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="mt-5 flex items-start gap-3 rounded-lg border border-blue-100 bg-blue-50/60 p-4">
                        <Info className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
                        <p className="text-xs text-blue-800">
                            <strong>Conseil :</strong> Utilisez des noms de colonnes standards
                            comme «&nbsp;Date&nbsp;», «&nbsp;Capital&nbsp;»,
                            «&nbsp;Intérêts&nbsp;», «&nbsp;Assurance&nbsp;» pour un mapping
                            automatique.
                        </p>
                    </div>

                    <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-5">
                        <Button variant="outline" onClick={() => setCurrentStep(1)}>
                            <ArrowLeft className="h-4 w-4" />
                            Précédent
                        </Button>
                        <Button
                            onClick={processImport}
                            disabled={!isImportReady() || isLoading}
                            className="bg-primary text-white hover:bg-slate-800"
                        >
                            {isLoading ? 'Import…' : "Finaliser l'import"}
                            <CheckCircle className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            )}

            {/* Step 3: Results */}
            {currentStep === 3 && importResult && (
                <div className="space-y-6">
                    <div className="rounded-xl border border-emerald-200 bg-linear-to-br from-emerald-50 to-white p-6 shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100">
                                <CheckCircle className="h-5 w-5 text-emerald-600" />
                            </div>
                            <div>
                                <h3 className="text-base font-semibold text-emerald-900">
                                    Import réussi
                                </h3>
                                <p className="text-xs text-emerald-700">
                                    L&apos;échéancier a été importé avec succès.
                                </p>
                            </div>
                        </div>

                        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                            {(
                                [
                                    {
                                        label: 'Emprunt',
                                        value: importResult.loan?.name || 'Prêt importé',
                                    },
                                    {
                                        label: 'Capital',
                                        value: importResult.loan
                                            ? formatCurrency(importResult.loan.principalAmount)
                                            : 'N/A',
                                    },
                                    {
                                        label: 'Durée',
                                        value: importResult.loan
                                            ? `${importResult.loan.durationMonths} mois`
                                            : 'N/A',
                                    },
                                    {
                                        label: 'Fichier source',
                                        value: importResult.originalFileName,
                                    },
                                    {
                                        label: 'Lignes importées',
                                        value: `${importResult.importedRows} / ${importResult.totalRows}`,
                                    },
                                ] as const
                            ).map((stat) => (
                                <div
                                    key={stat.label}
                                    className="rounded-lg border border-emerald-100 bg-white p-3"
                                >
                                    <p className="text-[10px] font-semibold uppercase tracking-wider text-emerald-600">
                                        {stat.label}
                                    </p>
                                    <p className="mt-0.5 text-sm font-medium text-slate-900 wrap-break-word">
                                        {stat.value}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
                        <Button variant="outline" onClick={resetImport}>
                            Nouvel import
                        </Button>
                        {importResult && importResult.loanId && (
                            <Button
                                onClick={() => onLoanImported?.(importResult.loanId!)}
                                className="bg-primary text-white hover:bg-slate-800"
                            >
                                Voir l&apos;emprunt
                                <ArrowRight className="h-4 w-4" />
                            </Button>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

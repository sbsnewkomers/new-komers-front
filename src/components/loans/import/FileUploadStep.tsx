import React from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Select } from '@/components/ui/Select';
import { Download, Eye, UploadCloud, Info } from 'lucide-react';
import { EntityType, ImportFileFormat } from '@/types/loans';

interface FileUploadStepProps {
    loanName: string;
    setLoanName: (name: string) => void;
    selectedEntityType: EntityType;
    setSelectedEntityType: (type: EntityType) => void;
    selectedEntityId: string;
    setSelectedEntityId: (id: string) => void;
    entities: Array<{ id: string; name: string }>;
    selectedFile: File | null;
    setSelectedFile: (file: File | null) => void;
    selectedModelFormat: ImportFileFormat;
    setSelectedModelFormat: (format: ImportFileFormat) => void;
    showModelPreview: boolean;
    setShowModelPreview: (show: boolean) => void;
    nameValidationError: string | null;
    isLoading: boolean;
    onDownloadTemplate: (format: ImportFileFormat) => void;
    onGoToNextStep: () => void;
    fileInputRef: React.RefObject<HTMLInputElement | null>;
}

export function FileUploadStep({
    loanName,
    setLoanName,
    selectedEntityType,
    setSelectedEntityType,
    selectedEntityId,
    setSelectedEntityId,
    entities,
    selectedFile,
    setSelectedFile,
    selectedModelFormat,
    setSelectedModelFormat,
    showModelPreview,
    setShowModelPreview,
    nameValidationError,
    isLoading,
    onDownloadTemplate,
    onGoToNextStep,
    fileInputRef,
}: FileUploadStepProps) {
    return (
        <div className="space-y-6">
            {/* Templates */}
            <div className="nebula-glass rounded-3xl border border-white/10 p-6">
                <h3 className="mb-1 text-sm font-semibold text-white">
                    Télécharger un modèle
                </h3>
                <p className="mb-5 text-xs text-(--nebula-muted)">
                    Utilisez un modèle pré-configuré pour préparer votre fichier.
                </p>

                <div className="space-y-4">
                    <div className="flex items-center gap-4">
                        <Label
                            htmlFor="formatSelect"
                            className="whitespace-nowrap text-xs font-semibold uppercase tracking-[0.18em] text-(--nebula-muted)"
                        >
                            Format
                        </Label>
                        <Select
                            id="formatSelect"
                            value={selectedModelFormat}
                            onValueChange={(value) => setSelectedModelFormat(value as ImportFileFormat)}
                            className="flex-1 max-w-xs"
                        >
                            <option value={ImportFileFormat.EXCEL}>Excel (.xlsx)</option>
                            <option value={ImportFileFormat.CSV}>CSV (.csv)</option>
                        </Select>
                    </div>

                    <div className="flex gap-3">
                        <Button
                            variant="outline"
                            onClick={() => onDownloadTemplate(selectedModelFormat)}
                            disabled={isLoading}
                            className="flex-1"
                        >
                            <Download className="h-4 w-4 mr-2" />
                            Télécharger le modèle
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => setShowModelPreview(true)}
                            disabled={isLoading}
                            className="px-4"
                        >
                            <Eye className="h-4 w-4 mr-2" />
                            Aperçu
                        </Button>
                    </div>
                </div>
            </div>

            {/* Loan info + upload */}
            <div className="nebula-glass rounded-3xl border border-white/10 p-6">
                <h3 className="mb-1 text-sm font-semibold text-white">
                    Informations sur l&apos;emprunt
                </h3>
                <p className="mb-5 text-xs text-(--nebula-muted)">
                    Renseignez les informations de base et importez votre fichier.
                </p>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                        <Label
                            htmlFor="loanName"
                            className="mb-1 block text-xs font-semibold uppercase tracking-[0.18em] text-(--nebula-muted)"
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
                            className="mb-1 block text-xs font-semibold uppercase tracking-[0.18em] text-(--nebula-muted)"
                        >
                            Type d&apos;entité <span className="text-red-500">*</span>
                        </Label>
                        <Select
                            value={selectedEntityType}
                            onValueChange={(value) => setSelectedEntityType(value as EntityType)}
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
                            className="mb-1 block text-xs font-semibold uppercase tracking-[0.18em] text-(--nebula-muted)"
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
                            className="mb-1 block text-xs font-semibold uppercase tracking-[0.18em] text-(--nebula-muted)"
                        >
                            Fichier Excel / CSV <span className="text-red-500">*</span>
                        </Label>
                        <label
                            htmlFor="fileInput"
                            className="flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-white/20 bg-white/5 px-3 py-2 text-sm text-white/80 transition hover:border-white/30 hover:bg-white/10"
                        >
                            <UploadCloud className="h-4 w-4 text-white/50" />
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

                <div className="mt-6 flex justify-end border-t border-white/10 pt-5">
                    <Button
                        onClick={onGoToNextStep}
                        disabled={
                            isLoading ||
                            !selectedFile ||
                            !loanName ||
                            !selectedEntityType ||
                            !selectedEntityId
                        }
                    >
                        {isLoading ? 'Chargement…' : 'Suivant'}
                    </Button>
                </div>

                <div className="mt-5 flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 p-4">
                    <Info className="mt-0.5 h-4 w-4 shrink-0 text-(--nebula-gold-light)" />
                    <p className="text-xs text-(--nebula-muted)">
                        <strong className="text-white/90">Conseil :</strong> Utilisez des noms de colonnes standards
                        comme «&nbsp;Date&nbsp;», «&nbsp;Capital&nbsp;»,
                        «&nbsp;Intérêts&nbsp;», «&nbsp;Assurance&nbsp;» pour un mapping
                        automatique.
                    </p>
                </div>
            </div>
        </div>
    );
}

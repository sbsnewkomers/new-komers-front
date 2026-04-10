import {
    Loan,
    LoanImport,
    LoanCalculatorDto,
    CalculatorValidationResponse,
    CalculatorGenerationResponse,
    LoanListResponse,
    LoanStatistics,
    EntityLoanStatistics,
    ImportPreviewDto,
    UploadLoanImportDto,
    ProcessImportDto,
    ImportResultDto,
    EntityType
} from '../types/loans';
import { apiFetch, ApiFetchSnackbarOptions, setAccessTokenGetter } from './apiClient';

class ApiError extends Error {
    constructor(
        message: string,
        public status: number,
        public data?: unknown
    ) {
        super(message);
        this.name = 'ApiError';
    }
}

class LoansApi {
    private accessTokenGetter: (() => string | null) | null = null;

    constructor() {
        // Store the access token getter for use in downloadTemplate
        // This will be set by the app initialization
    }

    setAccessTokenGetter(getter: () => string | null) {
        this.accessTokenGetter = getter;
        setAccessTokenGetter(getter);
    }

    // Basic CRUD operations
    async createLoan(loanData: Partial<Loan>): Promise<Loan> {
        return apiFetch<Loan>('/loans', {
            method: 'POST',
            body: JSON.stringify(loanData),
        });
    }

    async getAllLoans(): Promise<LoanListResponse> {
        return apiFetch<LoanListResponse>('/loans/all');
    }

    async getLoansByEntityType(entityType: EntityType): Promise<LoanListResponse> {
        return apiFetch<LoanListResponse>(`/loans/by-entity/${entityType}`);
    }

    async getLoan(id: string): Promise<Loan> {
        return apiFetch<Loan>(`/loans/${id}`);
    }

    async updateLoan(id: string, loanData: Partial<Loan>): Promise<Loan> {
        return apiFetch<Loan>(`/loans/${id}`, {
            method: 'PATCH',
            body: JSON.stringify(loanData),
        });
    }

    async deleteLoan(id: string): Promise<void> {
        return apiFetch<void>(`/loans/${id}`, {
            method: 'DELETE',
        });
    }

    // Calculator operations
    async validateCalculatorParameters(calculatorDto: LoanCalculatorDto, options?: { snackbar?: ApiFetchSnackbarOptions }): Promise<CalculatorValidationResponse> {
        return apiFetch<CalculatorValidationResponse>('/loans/calculator/validate', {
            method: 'POST',
            body: JSON.stringify(calculatorDto),
            snackbar: options?.snackbar,
        });
    }

    async generateLoanSchedule(calculatorDto: LoanCalculatorDto): Promise<CalculatorGenerationResponse> {
        return apiFetch<CalculatorGenerationResponse>('/loans/calculator', {
            method: 'POST',
            body: JSON.stringify(calculatorDto),
        });
    }

    async createLoanFromCalculator(calculatorDto: LoanCalculatorDto, options?: { snackbar?: ApiFetchSnackbarOptions }): Promise<Loan> {
        return apiFetch<Loan>('/loans/calculator/create', {
            method: 'POST',
            body: JSON.stringify(calculatorDto),
            snackbar: options?.snackbar,
        });
    }

    // Statistics
    async getLoanStatistics(loanId: string): Promise<LoanStatistics> {
        return apiFetch<LoanStatistics>(`/loans/${loanId}/statistics`);
    }

    async getEntityStatistics(entityType: EntityType, entityId: string): Promise<EntityLoanStatistics> {
        return apiFetch<EntityLoanStatistics>(`/loans/statistics/${entityType}/${entityId}`);
    }

    // Import operations
    async uploadImportFile(uploadData: UploadLoanImportDto, options?: { snackbar?: ApiFetchSnackbarOptions }): Promise<LoanImport> {
        const formData = new FormData();
        formData.append('file', uploadData.file);
        formData.append('loanName', uploadData.loanName);
        formData.append('entityType', uploadData.entityType);
        formData.append('entityId', uploadData.entityId);

        if (uploadData.columnMapping) {
            formData.append('columnMapping', JSON.stringify(uploadData.columnMapping));
        }

        return apiFetch<LoanImport>('/loans/import/upload', {
            method: 'POST',
            body: formData,
            snackbar: options?.snackbar,
        });
    }

    async getImportPreview(importId: string): Promise<ImportPreviewDto> {
        return apiFetch<ImportPreviewDto>(`/loans/import/preview/${importId}`);
    }

    async processImport(processDto: ProcessImportDto): Promise<ImportResultDto> {
        return apiFetch<ImportResultDto>('/loans/import/process', {
            method: 'POST',
            body: JSON.stringify(processDto),
        });
    }

    // Installment payment operations
    async markInstallmentAsPaid(loanId: string, installmentId: string, paymentDate?: string): Promise<void> {
        return apiFetch<void>(`/loans/${loanId}/installments/${installmentId}/pay`, {
            method: 'POST',
            body: JSON.stringify({ paymentDate }),
        });
    }

    async unmarkInstallmentAsPaid(loanId: string, installmentId: string): Promise<void> {
        return apiFetch<void>(`/loans/${loanId}/installments/${installmentId}/unpay`, {
            method: 'POST',
        });
    }

    async downloadTemplate(format: 'EXCEL' | 'CSV', options?: { snackbar?: ApiFetchSnackbarOptions }): Promise<Blob> {
        const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || '';
        const url = `${baseUrl}/loans/import/template?format=${format}`;

        const token = this.accessTokenGetter ? this.accessTokenGetter() : null;

        const response = await fetch(url, {
            credentials: "same-origin",
            headers: {
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
        });

        if (!response.ok) {
            const text = await response.text().catch(() => "");
            let errorMessage = `Failed to download template: ${response.status} ${response.statusText}`;

            try {
                const errorData = JSON.parse(text);
                if (errorData && typeof errorData === 'object' && 'message' in errorData) {
                    errorMessage = typeof errorData.message === 'string' ? errorData.message : errorMessage;
                }
            } catch {
                // Keep default error message
            }

            // Show error snackbar if enabled
            if (options?.snackbar?.showError !== false) {
                const { emitSnackbar } = await import('@/ui/snackbarBus');
                emitSnackbar({
                    message: options?.snackbar?.errorMessage || errorMessage || "Une erreur est survenue",
                    variant: "error"
                });
            }

            throw new Error(errorMessage);
        }

        // Show success snackbar if enabled
        if (options?.snackbar?.showSuccess) {
            const { emitSnackbar } = await import('@/ui/snackbarBus');
            emitSnackbar({
                message: options?.snackbar?.successMessage || `Modèle ${format} téléchargé avec succès`,
                variant: "success"
            });
        }

        return response.blob();
    }
}

export const loansApi = new LoansApi();
export default loansApi;
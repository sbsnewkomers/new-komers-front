import {
    Loan,
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
import { apiFetch } from './apiClient';

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
    async validateCalculatorParameters(calculatorDto: LoanCalculatorDto): Promise<CalculatorValidationResponse> {
        return apiFetch<CalculatorValidationResponse>('/loans/calculator/validate', {
            method: 'POST',
            body: JSON.stringify(calculatorDto),
        });
    }

    async generateLoanSchedule(calculatorDto: LoanCalculatorDto): Promise<CalculatorGenerationResponse> {
        return apiFetch<CalculatorGenerationResponse>('/loans/calculator', {
            method: 'POST',
            body: JSON.stringify(calculatorDto),
        });
    }

    async createLoanFromCalculator(calculatorDto: LoanCalculatorDto): Promise<Loan> {
        return apiFetch<Loan>('/loans/calculator/create', {
            method: 'POST',
            body: JSON.stringify(calculatorDto),
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
    async uploadImportFile(uploadData: UploadLoanImportDto): Promise<Loan> {
        const formData = new FormData();
        formData.append('file', uploadData.file);
        formData.append('loanName', uploadData.loanName);
        formData.append('entityType', uploadData.entityType);
        formData.append('entityId', uploadData.entityId);

        if (uploadData.columnMapping) {
            formData.append('columnMapping', JSON.stringify(uploadData.columnMapping));
        }

        return apiFetch<Loan>('/loans/import/upload', {
            method: 'POST',
            body: formData,
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

    async downloadTemplate(format: 'EXCEL' | 'CSV'): Promise<Blob> {
        const response = await apiFetch<Response>(`/loans/import/template?format=${format}`, {
            authRedirect: false,
        });

        // Convert response to blob
        const blob = await response.blob();
        return blob;
    }
}

export const loansApi = new LoansApi();
export default loansApi;
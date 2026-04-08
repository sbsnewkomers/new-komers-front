export enum EntityType {
    GROUP = 'group',
    COMPANY = 'company',
    BUSINESSUNIT = 'business unit',
}

export enum LoanInputMethod {
    CALCULATOR = 'CALCULATOR',
    IMPORT = 'IMPORT',
    MANUAL = 'MANUAL',
}

export enum LoanStatus {
    ACTIVE = 'ACTIVE',
    COMPLETED = 'COMPLETED',
    SUSPENDED = 'SUSPENDED',
}

export enum ImportFileFormat {
    EXCEL = 'EXCEL',
    CSV = 'CSV',
}

export enum ImportStatus {
    PENDING = 'PENDING',
    PROCESSING = 'PROCESSING',
    COMPLETED = 'COMPLETED',
    FAILED = 'FAILED',
}

export interface Loan {
    id: string;
    name: string;
    principalAmount: number;
    annualInterestRate: number;
    durationMonths: number;
    firstInstallmentDate: string;
    monthlyInsuranceCost: number;
    deferralPeriodMonths: number;
    inputMethod: LoanInputMethod;
    status: LoanStatus;
    entityType: EntityType;
    entityId: string;
    createdById: string;
    createdAt: string;
    updatedAt: string;
    installments?: LoanInstallment[];
    imports?: LoanImport[];
}

export interface LoanInstallment {
    id: string;
    loanId: string;
    installmentNumber: number;
    dueDate: string;
    principalPayment: number;
    interestPayment: number;
    insurancePayment: number;
    totalPayment: number;
    remainingBalance: number;
    isPaid: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface LoanImport {
    id: string;
    originalFileName: string;
    serverFilePath: string;
    fileFormat: ImportFileFormat;
    fileSize: number;
    mimeType: string;
    userId: string;
    status: ImportStatus;
    totalRows: number;
    importedRows: number;
    errorRows: number;
    detailedErrors?: Record<number, string>;
    columnMapping?: Record<string, string>;
    loanId?: string;
    processingStartedAt?: string;
    processingCompletedAt?: string;
    createdAt: string;
    updatedAt: string;
    loan?: Loan;
}

export interface LoanCalculatorDto {
    name?: string;
    principalAmount: number;
    annualInterestRate: number;
    durationMonths?: number;
    durationYears?: number;
    firstInstallmentDate: string;
    monthlyInsuranceCost?: number;
    deferralPeriodMonths?: number;
    inputMethod?: LoanInputMethod;
}

export interface LoanCalculatorResult {
    monthlyPayment: number;
    totalInterest: number;
    totalInsurance: number;
    totalPayment: number;
    installments: LoanInstallmentCalculation[];
}

export interface LoanInstallmentCalculation {
    installmentNumber: number;
    dueDate: string;
    principalPayment: number;
    interestPayment: number;
    insurancePayment: number;
    totalPayment: number;
    remainingBalance: number;
    isPaid: boolean;
}

export interface ColumnMappingDto {
    sourceColumn: string;
    targetField: 'dueDate' | 'principalPayment' | 'interestPayment' | 'insurancePayment';
}

export interface ImportPreviewDto {
    previewRows: Record<string, unknown>[];
    detectedColumns: string[];
    totalRows: number;
}

export interface UploadLoanImportDto {
    file: File;
    columnMapping?: ColumnMappingDto[];
    loanName: string;
    entityType: string;
    entityId: string;
}

export interface ProcessImportDto {
    importId: string;
    columnMapping: ColumnMappingDto[];
    loanName: string;
    entityType: string;
    entityId: string;
}

export interface ImportErrorDto {
    rowNumber: number;
    errorMessage: string;
    rowData: Record<string, unknown>;
}

export interface ImportResultDto {
    status: ImportStatus;
    totalRows: number;
    importedRows: number;
    errorRows: number;
    errors?: ImportErrorDto[];
    loanId?: string;
}

export interface TemplateRequestDto {
    format: ImportFileFormat;
}

export interface LoanStatistics {
    totalInterestPaid: number;
    totalInsurancePaid: number;
    totalPrincipalPaid: number;
    currentRemainingBalance: number;
    remainingInstallments: number;
    projectedEndDate: string;
}

export interface EntityLoanStatistics {
    totalLoans: number;
    totalPrincipal: number;
    totalRemainingBalance: number;
    monthlyPayments: number;
    averageInterestRate: number;
}

export interface LoanListResponse {
    loans: Loan[];
    total: number;
    totalPages?: number;
}

export interface CalculatorValidationResponse {
    step: 'validation';
    valid: boolean;
    error?: string;
    parameters: {
        loanName: string;
        principalAmount: number;
        annualInterestRate: number;
        durationInMonths: number;
        firstInstallmentDate: string;
        monthlyInsuranceCost: number;
        deferralPeriodMonths: number;
    };
    message: string;
}

export interface CalculatorGenerationResponse {
    step: 'generation';
    summary: {
        loanName: string;
        principalAmount: number;
        annualInterestRate: number;
        durationInMonths: number;
        monthlyPayment: number;
        totalInterest: number;
        totalInsurance: number;
        totalPayment: number;
    };
    amortizationTable: LoanInstallmentCalculation[];
    message: string;
}
export const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: 'EUR',
        maximumFractionDigits: 0,
    }).format(amount);

export interface EditableInstallment {
    id?: string;
    installmentNumber: number;
    dueDate: string;
    principalPayment: number;
    interestPayment: number;
    insurancePayment: number;
    totalPayment: number;
    remainingBalance: number;
    comments?: string;
    isNew?: boolean;
}

export interface LoanTotals {
    totalPrincipal: number;
    totalInterest: number;
    totalInsurance: number;
    totalPayment: number;
    averageMonthlyPayment: number;
}

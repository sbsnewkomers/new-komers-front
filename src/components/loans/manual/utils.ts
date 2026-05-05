export const formatCurrency = (amount: number) => {
    if (isNaN(amount) || !isFinite(amount)) {
        return '0,00 €';
    }
    return new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: 'EUR',
        maximumFractionDigits: 0,
    }).format(amount);
};

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

export const validateDateSequence = (installments: EditableInstallment[], index: number, newDate: string): boolean => {
    if (index > 0) {
        const previousDate = new Date(installments[index - 1].dueDate);
        const currentDate = new Date(newDate);
        if (currentDate <= previousDate) {
            return false;
        }
    }
    if (index < installments.length - 1) {
        const nextDate = new Date(installments[index + 1].dueDate);
        const currentDate = new Date(newDate);
        if (currentDate >= nextDate) {
            return false;
        }
    }
    return true;
};

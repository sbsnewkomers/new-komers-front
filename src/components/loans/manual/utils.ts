import { formatCurrencyEUR } from "@/lib/format";

export const formatCurrency = (amount: number) =>
  formatCurrencyEUR(amount, { maximumFractionDigits: 0, fallback: "0 €" });

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

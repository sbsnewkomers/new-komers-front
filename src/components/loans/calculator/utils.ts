import { formatCurrencyEUR, formatDateFR } from "@/lib/format";

export const formatCurrency = (amount: number | null | undefined) =>
  formatCurrencyEUR(amount, { minimumFractionDigits: 2, maximumFractionDigits: 2, fallback: "0,00 €" });

export const formatDate = (dateString: string | null | undefined) =>
  formatDateFR(dateString, { fallback: "" });

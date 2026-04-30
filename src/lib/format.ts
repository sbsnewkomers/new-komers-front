export type CurrencyFormatOptions = {
  locale?: string;
  currency?: string;
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
  fallback?: string;
};

export function formatCurrencyEUR(
  amount: number | string | null | undefined,
  opts: CurrencyFormatOptions = {},
): string {
  const {
    locale = "fr-FR",
    currency = "EUR",
    minimumFractionDigits,
    maximumFractionDigits,
    fallback = "0,00 €",
  } = opts;

  if (amount === null || amount === undefined) return fallback;
  const numericAmount = typeof amount === "string" ? Number(amount) : amount;
  if (!Number.isFinite(numericAmount)) return fallback;

  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits,
    maximumFractionDigits,
  }).format(numericAmount);
}

export type DateFormatOptions = {
  locale?: string;
  fallback?: string;
};

export function formatDateFR(value?: string | Date | null, opts: DateFormatOptions = {}): string {
  const { locale = "fr-FR", fallback = "-" } = opts;
  if (!value) return fallback;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? fallback : new Intl.DateTimeFormat(locale).format(date);
}

export type PercentFormatOptions = {
  decimals?: number;
  fallback?: string;
};

export function formatPercent(value: number | null | undefined, opts: PercentFormatOptions = {}): string {
  const { decimals = 0, fallback = "0%" } = opts;
  if (value === null || value === undefined) return fallback;
  if (!Number.isFinite(value)) return fallback;
  return `${value.toFixed(decimals)}%`;
}


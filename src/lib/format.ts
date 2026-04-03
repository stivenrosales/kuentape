const currencyFormatter = new Intl.NumberFormat("es-PE", {
  style: "currency",
  currency: "PEN",
  minimumFractionDigits: 2,
});

export function formatCurrency(centavos: number): string {
  return currencyFormatter.format(centavos / 100);
}

export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("es-PE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "America/Lima",
  });
}

export function formatRUC(ruc: string): string {
  return ruc.replace(/(\d{2})(\d{8})(\d{1})/, "$1-$2-$3");
}

export function formatPercent(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

/**
 * Returns the previous month as "YYYY-MM".
 * If today is April 2026, returns "2026-03".
 */
export function getPeriodoAnterior(): string {
  const now = new Date();
  const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  return `${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, "0")}`;
}

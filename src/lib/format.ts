const currencyFormatter = new Intl.NumberFormat("es-PE", {
  style: "currency",
  currency: "PEN",
  minimumFractionDigits: 2,
});

export function formatCurrency(centavos: number): string {
  return currencyFormatter.format(centavos / 100);
}

/** Formato corto para ejes de gráficos: S/1.5K, S/18K, S/1.2M */
export function formatCurrencyShort(centavos: number): string {
  const value = centavos / 100;
  if (value >= 1_000_000) return `S/${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `S/${(value / 1_000).toFixed(value >= 10_000 ? 0 : 1)}K`;
  return `S/${value.toFixed(0)}`;
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

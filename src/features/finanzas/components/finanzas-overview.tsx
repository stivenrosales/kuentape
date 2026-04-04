"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowUpIcon,
  ArrowDownIcon,
  TrendingUpIcon,
  TrendingDownIcon,
  AlertCircleIcon,
  PlusIcon,
  BarChart2Icon,
  ListIcon,
  WalletIcon,
  CalendarIcon,
  CoinsIcon,
  DownloadIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { ChartCard } from "@/components/chart-card";
import { LineChart } from "@/components/charts/line-chart";
import { IncomeExpenseChart } from "@/components/charts/income-expense-chart";
import { formatCurrency, formatCurrencyShort } from "@/lib/format";
import { cn } from "@/lib/utils";
import { FinanzaTableSimple } from "./finanza-table-simple";
import { FinanzaForm } from "./finanza-form";
import { FinanzaPdfDialog } from "./finanza-pdf-dialog";
import { CajaChicaClient } from "@/features/caja-chica/components/caja-chica-client";
import type { FinanzaRow } from "./finanza-table";

/* ------------------------------------------------------------------ */
/* Tipos                                                                */
/* ------------------------------------------------------------------ */

interface KPIs {
  totalIngresos: number;
  totalEgresos: number;
  utilidad: number;
  deudaTotal: number;
  cobradoHoy: number;
}

interface CobradoPorCuenta {
  id: string;
  nombre: string;
  banco: string;
  tipo: string;
  montoCobrado: number;
}

interface CuentaBancaria {
  id: string;
  nombre: string;
  banco: string;
}

interface ServicioConDeuda {
  id: string;
  montoRestante: number;
  persona: { razonSocial: string };
  tipoServicio: { nombre: string };
}

type FinanzasMensualesRow = Record<string, unknown> & {
  mes: string;
  ingreso: number;
  egreso: number;
  utilidad: number;
};

interface IngresosPorTipoServicio {
  data: Record<string, unknown>[];
  tipos: string[];
}

interface VentasPorContador {
  labels: string[];
  rows: (Record<string, string | number> & { contador: string; total: number })[];
}

interface VentasPorServicio {
  labels: string[];
  rows: (Record<string, string | number> & { tipoServicio: string; total: number })[];
}

interface MontoPorCobrarPorContador {
  nombre: string;
  monto: number;
}

interface EgresosPorCategoria {
  name: string;
  value: number;
}

export interface FinanzasOverviewProps {
  kpis: KPIs;
  cobradoPorCuenta: CobradoPorCuenta[];
  ultimasTransacciones: FinanzaRow[];
  /* análisis — opcionales, solo se usan en tab=analisis */
  finanzasMensuales?: FinanzasMensualesRow[];
  ingresosPorTipoServicio?: IngresosPorTipoServicio;
  ventasPorContador?: VentasPorContador;
  ventasPorServicio?: VentasPorServicio;
  montoPorCobrarPorContador?: MontoPorCobrarPorContador[];
  egresosPorCategoria?: EgresosPorCategoria[];
  /* transacciones completas — solo en tab=transacciones */
  todasTransacciones?: FinanzaRow[];
  cuentas: CuentaBancaria[];
  servicios: ServicioConDeuda[];
  canEdit: boolean;
  anio: number;
  mes: number;
  tab: "transacciones" | "cobranzas" | "caja-chica" | "analisis";
  /* Caja chica */
  cajaChicaSaldo?: number;
  cajaChicaBalanceDiario?: { dia: string; saldo: number }[];
  cajaChicaMovimientos?: Record<string, unknown>[];
  /* Cobranzas */
  cobranzasData?: {
    contadorId: string;
    contador: string;
    honorarios: number;
    cobrado: number;
    deuda: number;
    rezago: number;
    porcentaje: number;
  }[];
}

/* ------------------------------------------------------------------ */
/* Constantes                                                           */
/* ------------------------------------------------------------------ */

const MESES = [
  "Ene", "Feb", "Mar", "Abr", "May", "Jun",
  "Jul", "Ago", "Set", "Oct", "Nov", "Dic",
];

const MESES_FULL = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

/* ------------------------------------------------------------------ */
/* Sub-componentes                                                      */
/* ------------------------------------------------------------------ */

function KPIBar({
  kpis,
  mes,
}: {
  kpis: KPIs;
  mes: number;
}) {
  const mesLabel = MESES_FULL[mes - 1];

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {/* Ingresos */}
      <div className="rounded-lg border border-border bg-card px-4 py-3 shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Ingresos {mesLabel}</span>
          <TrendingUpIcon className="h-3 w-3 text-muted-foreground/50" />
        </div>
        <p className="mt-0.5 font-mono text-lg font-bold text-emerald-600 dark:text-emerald-400">
          {formatCurrency(kpis.totalIngresos)}
        </p>
      </div>

      {/* Egresos */}
      <div className="rounded-lg border border-border bg-card px-4 py-3 shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Egresos {mesLabel}</span>
          <TrendingDownIcon className="h-3 w-3 text-muted-foreground/50" />
        </div>
        <p className="mt-0.5 font-mono text-lg font-bold text-destructive">
          {formatCurrency(kpis.totalEgresos)}
        </p>
      </div>

      {/* Utilidad */}
      <div className="rounded-lg border border-border bg-card px-4 py-3 shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Utilidad {mesLabel}</span>
          <BarChart2Icon className="h-3 w-3 text-muted-foreground/50" />
        </div>
        <p
          className={cn(
            "mt-0.5 font-mono text-lg font-bold",
            kpis.utilidad >= 0
              ? "text-emerald-600 dark:text-emerald-400"
              : "text-destructive"
          )}
        >
          {formatCurrency(kpis.utilidad)}
        </p>
      </div>

      {/* Deuda */}
      <div className="rounded-lg border border-border bg-card px-4 py-3 shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Deuda total</span>
          <AlertCircleIcon className="h-3 w-3 text-muted-foreground/50" />
        </div>
        <p className="mt-0.5 font-mono text-lg font-bold text-destructive">
          {formatCurrency(kpis.deudaTotal)}
        </p>
      </div>
    </div>
  );
}

function CobradoHoy({ cuentas }: { cuentas: CobradoPorCuenta[] }) {
  const total = cuentas.reduce((acc, c) => acc + c.montoCobrado, 0);

  return (
    <div className="rounded-lg border border-border bg-card shadow-sm">
      <div className="border-b border-border px-4 py-2.5">
        <h3 className="text-sm font-semibold">Cobrado hoy</h3>
      </div>
      <div className="divide-y divide-border/50">
        {cuentas.map((c) => (
          <div key={c.id} className="flex items-center justify-between px-4 py-1.5">
            <span className="text-xs text-muted-foreground truncate max-w-[140px]">
              {c.nombre}
            </span>
            <span
              className={cn(
                "font-mono text-xs font-medium tabular-nums",
                c.montoCobrado > 0
                  ? "text-emerald-700 dark:text-emerald-400"
                  : "text-muted-foreground"
              )}
            >
              {formatCurrency(c.montoCobrado)}
            </span>
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between border-t border-border px-4 py-2">
        <span className="text-xs font-semibold">Total</span>
        <span
          className={cn(
            "font-mono text-sm font-bold tabular-nums",
            total > 0 ? "text-emerald-700 dark:text-emerald-400" : "text-muted-foreground"
          )}
        >
          {formatCurrency(total)}
        </span>
      </div>
    </div>
  );
}

function UltimasTransacciones({ transacciones }: { transacciones: FinanzaRow[] }) {
  return (
    <div className="rounded-lg border border-border bg-card shadow-sm">
      <div className="border-b border-border px-4 py-2.5">
        <h3 className="text-sm font-semibold">Últimas transacciones</h3>
      </div>
      <div className="divide-y divide-border/50">
        {transacciones.length === 0 && (
          <p className="px-4 py-6 text-center text-xs text-muted-foreground">
            Sin transacciones recientes
          </p>
        )}
        {transacciones.map((t) => (
          <div key={t.id} className="flex items-center gap-3 px-4 py-2">
            {/* Icono tipo */}
            <span
              className={cn(
                "flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold",
                t.tipo === "INGRESO"
                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400"
                  : "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400"
              )}
            >
              {t.tipo === "INGRESO" ? (
                <ArrowUpIcon className="h-2.5 w-2.5" />
              ) : (
                <ArrowDownIcon className="h-2.5 w-2.5" />
              )}
            </span>

            {/* Concepto + empresa */}
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-medium leading-tight">
                {t.concepto}
              </p>
              {t.servicio && (
                <p className="truncate text-[11px] text-muted-foreground leading-tight">
                  {t.servicio.persona.razonSocial}
                </p>
              )}
            </div>

            {/* Cuenta */}
            <span className="shrink-0 rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
              {t.cuenta.banco.length > 6 ? t.cuenta.banco.slice(0, 6) : t.cuenta.banco}
            </span>

            {/* Monto + fecha */}
            <div className="shrink-0 text-right">
              <p
                className={cn(
                  "font-mono text-xs font-semibold tabular-nums",
                  t.tipo === "INGRESO"
                    ? "text-emerald-700 dark:text-emerald-400"
                    : "text-red-700 dark:text-red-400"
                )}
              >
                {t.tipo === "EGRESO" ? "-" : ""}
                {formatCurrency(t.monto)}
              </p>
              <p className="text-[10px] text-muted-foreground">
                {new Date(t.fecha).toLocaleDateString("es-PE", {
                  day: "2-digit",
                  month: "2-digit",
                })}
              </p>
            </div>
          </div>
        ))}
      </div>
      <div className="border-t border-border px-4 py-2">
        <Link
          href="/finanzas?tab=transacciones"
          className="text-xs text-primary hover:underline"
        >
          Ver todas →
        </Link>
      </div>
    </div>
  );
}

function PeriodSelector({ tab, anio, mes }: { tab: string; anio: number; mes: number }) {
  const router = useRouter();
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: currentYear - 2023 }, (_, i) => currentYear - i);

  function navigate(newAnio: number, newMes: number) {
    router.push(`/finanzas?tab=${tab}&anio=${newAnio}&mes=${newMes}`);
  }

  return (
    <div className="flex items-center gap-1.5 rounded-lg border border-border bg-card h-8 px-2.5 shadow-sm">
      <CalendarIcon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
      <Select value={String(mes)} onValueChange={(v) => v && navigate(anio, Number(v))}>
        <SelectTrigger
          size="sm"
          className="border-0 bg-transparent shadow-none px-1 py-0 h-auto text-xs font-medium gap-1 min-w-0"
        >
          {MESES[mes - 1]}
        </SelectTrigger>
        <SelectContent>
          {MESES.map((m, i) => (
            <SelectItem key={i} value={String(i + 1)}>{m}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select value={String(anio)} onValueChange={(v) => v && navigate(Number(v), mes)}>
        <SelectTrigger
          size="sm"
          className="border-0 bg-transparent shadow-none px-1 py-0 h-auto text-xs font-medium gap-1 min-w-0"
        >
          {anio}
        </SelectTrigger>
        <SelectContent>
          {years.map((y) => (
            <SelectItem key={y} value={String(y)}>{y}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function TabNav({ tab, anio, mes, onPdfClick }: { tab: string; anio: number; mes: number; onPdfClick?: () => void }) {
  const baseParams = `anio=${anio}&mes=${mes}`;

  const tabs = [
    { key: "transacciones", label: "Transacciones", icon: ListIcon },
    { key: "cobranzas", label: "Cobranzas", icon: CoinsIcon },
    { key: "caja-chica", label: "Caja chica", icon: WalletIcon },
    { key: "analisis", label: "Análisis", icon: TrendingUpIcon },
  ] as const;

  return (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <div className="flex items-center gap-1 rounded-lg border border-border bg-muted/40 p-1">
        {tabs.map(({ key, label, icon: Icon }) => (
          <Link
            key={key}
            href={`/finanzas?tab=${key}&${baseParams}`}
            className={cn(
              "flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors whitespace-nowrap",
              tab === key
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Icon className="h-3 w-3" />
            {label}
          </Link>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <PeriodSelector tab={tab} anio={anio} mes={mes} />
        {onPdfClick && (
          <Button variant="outline" size="sm" onClick={onPdfClick} className="bg-card">
            <DownloadIcon className="mr-1.5 size-3.5" />
            PDF
          </Button>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Ranking compacto con barras CSS                                      */
/* ------------------------------------------------------------------ */

/* ------------------------------------------------------------------ */
/* Cobranzas Tab                                                        */
/* ------------------------------------------------------------------ */

type CobranzaSortKey = "contador" | "honorarios" | "cobrado" | "deuda" | "rezago" | "porcentaje";

function CobranzasTab({
  data,
  mes,
  anio,
}: {
  data: NonNullable<FinanzasOverviewProps["cobranzasData"]>;
  mes: number;
  anio: number;
}) {
  const [sortKey, setSortKey] = React.useState<CobranzaSortKey>("porcentaje");
  const [sortDir, setSortDir] = React.useState<"asc" | "desc">("desc");

  function handleSort(key: CobranzaSortKey) {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("desc"); }
  }

  const sorted = React.useMemo(() => {
    return [...data].sort((a, b) => {
      const av = a[sortKey] as number | string;
      const bv = b[sortKey] as number | string;
      const cmp = typeof av === "string" ? (av as string).localeCompare(bv as string) : (av as number) - (bv as number);
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [data, sortKey, sortDir]);

  const totals = React.useMemo(() => ({
    honorarios: data.reduce((s, r) => s + r.honorarios, 0),
    cobrado: data.reduce((s, r) => s + r.cobrado, 0),
    deuda: data.reduce((s, r) => s + r.deuda, 0),
    rezago: data.reduce((s, r) => s + r.rezago, 0),
  }), [data]);
  const totalPct = totals.honorarios > 0 ? Math.round((totals.cobrado / totals.honorarios) * 100) : 0;

  function SortHeader({ label, colKey, align = "right" }: { label: string; colKey: CobranzaSortKey; align?: "left" | "right" }) {
    const active = sortKey === colKey;
    return (
      <th
        className={cn(
          "px-3 py-2.5 text-[10px] uppercase tracking-wider font-medium cursor-pointer select-none transition-colors hover:text-foreground",
          align === "right" ? "text-right" : "text-left",
          active ? "text-foreground" : "text-muted-foreground"
        )}
        onClick={() => handleSort(colKey)}
      >
        <span className="inline-flex items-center gap-1">
          {label}
          {active ? (
            sortDir === "asc" ? <ArrowUpIcon className="h-3 w-3" /> : <ArrowDownIcon className="h-3 w-3" />
          ) : (
            <span className="h-3 w-3 opacity-30">↕</span>
          )}
        </span>
      </th>
    );
  }

  return (
    <div className="space-y-3">
      <h2 className="text-sm font-semibold text-foreground">
        Rendimiento de cobro — {MESES[mes - 1]} {anio}
      </h2>

      {data.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">Sin datos de cobranza este mes.</p>
      ) : (
        <div className="rounded-lg border border-border bg-card shadow-sm overflow-hidden">
          <table className="w-full text-sm border-collapse" style={{ tableLayout: "fixed" }}>
            <colgroup><col style={{ width: "17%" }} /><col style={{ width: "14%" }} /><col style={{ width: "14%" }} /><col style={{ width: "14%" }} /><col style={{ width: "14%" }} /><col style={{ width: "27%" }} /></colgroup>
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <SortHeader label="Contador" colKey="contador" align="left" />
                <SortHeader label="Honorarios" colKey="honorarios" />
                <SortHeader label="Cobrado" colKey="cobrado" />
                <SortHeader label="Pendiente" colKey="deuda" />
                <SortHeader label="Rezago total" colKey="rezago" />
                <SortHeader label="Avance" colKey="porcentaje" align="left" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {sorted.map((row, i) => (
                <tr key={row.contadorId} className={cn(i % 2 === 0 ? "bg-muted/10" : "bg-background")}>
                  <td className="px-3 py-2.5 text-xs font-medium">{row.contador}</td>
                  <td className="px-3 py-2.5 text-right font-mono text-xs tabular-nums">{formatCurrency(row.honorarios)}</td>
                  <td className="px-3 py-2.5 text-right font-mono text-xs tabular-nums font-semibold text-emerald-700 dark:text-emerald-400">{formatCurrency(row.cobrado)}</td>
                  <td className="px-3 py-2.5 text-right font-mono text-xs tabular-nums text-destructive">{formatCurrency(row.deuda)}</td>
                  <td className="px-3 py-2.5 text-right font-mono text-xs tabular-nums">
                    {row.rezago > 0 ? (
                      <span className="text-destructive/70">{formatCurrency(row.rezago)}</span>
                    ) : (
                      <span className="text-muted-foreground/40">—</span>
                    )}
                  </td>
                  <td className="px-3 py-2.5 pl-4">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-3 bg-muted/40 rounded-full overflow-hidden">
                        <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${Math.min(row.porcentaje, 100)}%` }} />
                      </div>
                      <span className="text-xs font-bold tabular-nums w-10 text-right text-primary">{row.porcentaje}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-border bg-muted/40">
                <td className="px-3 py-2.5 text-xs font-bold">Total</td>
                <td className="px-3 py-2.5 text-right font-mono text-xs font-bold tabular-nums">{formatCurrency(totals.honorarios)}</td>
                <td className="px-3 py-2.5 text-right font-mono text-xs font-bold tabular-nums text-emerald-700 dark:text-emerald-400">{formatCurrency(totals.cobrado)}</td>
                <td className="px-3 py-2.5 text-right font-mono text-xs font-bold tabular-nums text-destructive">{formatCurrency(totals.deuda)}</td>
                <td className="px-3 py-2.5 text-right font-mono text-xs font-bold tabular-nums text-destructive/70">{formatCurrency(totals.rezago)}</td>
                <td className="px-3 py-2.5 pl-4">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-3 bg-muted/40 rounded-full overflow-hidden">
                      <div className="h-full rounded-full bg-primary" style={{ width: `${totalPct}%` }} />
                    </div>
                    <span className="text-xs font-bold tabular-nums w-10 text-right text-primary">{totalPct}%</span>
                  </div>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Ranking compacto con barras CSS                                      */
/* ------------------------------------------------------------------ */

function InlineRanking({
  data,
  formatValue,
  color = "var(--chart-1)",
}: {
  data: { label: string; value: number }[];
  formatValue?: (v: number) => string;
  color?: string;
}) {
  const sorted = [...data].sort((a, b) => b.value - a.value);
  const max = sorted[0]?.value ?? 1;

  if (sorted.length === 0) {
    return <p className="py-4 text-center text-xs text-muted-foreground">Sin deudas pendientes</p>;
  }

  return (
    <div className="space-y-1.5">
      {sorted.map((item) => {
        const pct = Math.round((item.value / max) * 100);
        return (
          <div key={item.label} className="flex items-center gap-2 text-xs">
            <span className="w-16 shrink-0 truncate text-muted-foreground text-right" title={item.label}>{item.label}</span>
            <div className="flex-1 h-4 bg-muted/30 rounded-sm overflow-hidden relative">
              <div
                className="h-full rounded-sm transition-all"
                style={{ width: `${pct}%`, backgroundColor: color, opacity: 0.7 }}
              />
            </div>
            <span className="w-20 shrink-0 font-mono text-[11px] tabular-nums text-foreground text-right">
              {formatValue ? formatValue(item.value) : item.value}
            </span>
          </div>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Sección Análisis                                                     */
/* ------------------------------------------------------------------ */

function PivotTable({
  title,
  rowLabel,
  rows,
  rowKey,
  monthLabels,
}: {
  title: string;
  rowLabel: string;
  rows: Record<string, string | number>[];
  rowKey: string;
  monthLabels: string[];
}) {
  if (rows.length === 0) return null;
  const cols = monthLabels;

  // Ordenar por total descendente
  const sorted = [...rows].sort((a, b) => (b.total as number) - (a.total as number));

  // Máximo valor individual (para barras relativas)
  let maxCell = 0;
  for (const row of sorted) {
    for (const m of cols) {
      const v = row[m] as number;
      if (v && v > maxCell) maxCell = v;
    }
  }

  // Totales por mes
  const monthTotals: Record<string, number> = {};
  let grandTotal = 0;
  for (const m of cols) {
    const sum = sorted.reduce((acc, row) => acc + ((row[m] as number) || 0), 0);
    monthTotals[m] = sum;
    grandTotal += sum;
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-border bg-card shadow-sm min-w-0">
      <div className="border-b border-border px-3 py-2">
        <h3 className="text-xs font-semibold">{title}</h3>
      </div>
      <table className="w-full text-[11px]">
        <thead>
          <tr className="border-b border-border/60 bg-muted/30">
            <th className="py-1.5 pl-3 pr-2 text-left font-medium text-muted-foreground whitespace-nowrap">{rowLabel}</th>
            {cols.map((m) => (
              <th key={m} className="px-1 py-1.5 text-right font-medium text-muted-foreground whitespace-nowrap">{m}</th>
            ))}
            <th className="py-1.5 pl-2 pr-3 text-right font-semibold text-foreground">Total</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/30">
          {sorted.map((row) => {
            const total = row.total as number;
            const barWidth = grandTotal > 0 ? Math.round((total / grandTotal) * 100) : 0;
            return (
              <tr key={row[rowKey] as string} className="hover:bg-muted/20">
                <td className="py-1.5 pl-3 pr-2 font-medium text-foreground whitespace-nowrap truncate max-w-[140px]" title={row[rowKey] as string}>{row[rowKey]}</td>
                {cols.map((m) => {
                  const v = row[m] as number;
                  const pct = v && maxCell > 0 ? (v / maxCell) : 0;
                  return (
                    <td key={m} className="px-1 py-1.5 text-right font-mono tabular-nums relative">
                      {v ? (
                        <>
                          <div
                            className="absolute inset-y-0.5 right-0 rounded-sm bg-primary/10"
                            style={{ width: `${Math.round(pct * 100)}%` }}
                          />
                          <span className="relative text-foreground">{formatCurrency(v)}</span>
                        </>
                      ) : (
                        <span className="text-muted-foreground/40">—</span>
                      )}
                    </td>
                  );
                })}
                <td className="py-1.5 pl-2 pr-3 text-right relative">
                  <div
                    className="absolute inset-y-0.5 right-0 rounded-sm bg-primary/15"
                    style={{ width: `${barWidth}%` }}
                  />
                  <span className="relative font-mono font-bold text-foreground tabular-nums">
                    {formatCurrency(total)}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
        {/* Fila de totales */}
        <tfoot>
          <tr className="border-t-2 border-border bg-muted/40">
            <td className="py-2 pl-3 pr-2 font-bold text-foreground text-xs">Total</td>
            {cols.map((m) => (
              <td key={m} className="px-1 py-2 text-right font-mono font-bold tabular-nums text-foreground">
                {monthTotals[m] ? formatCurrency(monthTotals[m]) : "—"}
              </td>
            ))}
            <td className="py-2 pl-2 pr-3 text-right font-mono font-bold tabular-nums text-primary text-xs">
              {formatCurrency(grandTotal)}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

function SeccionAnalisis({
  finanzasMensuales,
  ingresosPorTipoServicio,
  ventasPorContador,
  ventasPorServicio,
  montoPorCobrarPorContador,
  egresosPorCategoria,
  anio,
  mes,
}: {
  finanzasMensuales: FinanzasMensualesRow[];
  ingresosPorTipoServicio: IngresosPorTipoServicio;
  ventasPorContador: VentasPorContador;
  ventasPorServicio: VentasPorServicio;
  montoPorCobrarPorContador: MontoPorCobrarPorContador[];
  egresosPorCategoria: EgresosPorCategoria[];
  anio: number;
  mes: number;
}) {
  const mesLabel = MESES[mes - 1];
  const currentMonthLabel = `${mesLabel} ${String(anio).slice(2)}`;

  return (
    <div className="space-y-3 min-w-0">
      {/* Fila 1 — Tendencias: flujo financiero + ingresos por servicio */}
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <div className="min-w-0">
          <ChartCard
            title="Flujo financiero"
            description="Últimos 12 meses — Barras: ingreso vs egreso — Línea: utilidad"
          >
            <IncomeExpenseChart
              data={finanzasMensuales}
              xKey="mes"
              formatValue={formatCurrencyShort}
              height={220}
            />
          </ChartCard>
        </div>
        <div className="min-w-0">
          <ChartCard
            title="Tendencia por tipo de servicio"
            description="¿Qué servicios crecen o caen? — Últimos 12 meses"
          >
            <LineChart
              data={ingresosPorTipoServicio.data}
              xKey="mes"
              lines={ingresosPorTipoServicio.tipos.map((t) => ({ key: t, label: t }))}
              formatValue={formatCurrencyShort}
              height={220}
            />
          </ChartCard>
        </div>
      </div>

      {/* Fila 2 — Rankings: ¿de dónde viene la plata? ¿en qué se gasta? ¿quién debe? */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3 items-stretch">
        <div className="min-w-0 flex">
          <ChartCard className="flex-1" title={`Ingresos ${mesLabel}`} description="Ranking por tipo de servicio">
            <InlineRanking
              data={ingresosPorTipoServicio.tipos.map((tipo) => {
                const row = ingresosPorTipoServicio.data.find((d) => d.mes === currentMonthLabel);
                return { label: tipo, value: (row?.[tipo] as number) ?? 0 };
              }).filter((d) => d.value > 0)}
              formatValue={formatCurrency}
              color="#10b981"
            />
          </ChartCard>
        </div>
        <div className="min-w-0 flex">
          <ChartCard className="flex-1" title={`Egresos ${mesLabel}`} description="Ranking por categoría">
            <InlineRanking
              data={egresosPorCategoria.filter((d) => d.value > 0).map((d) => ({ label: d.name, value: d.value }))}
              formatValue={formatCurrency}
              color="#ef4444"
            />
          </ChartCard>
        </div>
        <div className="min-w-0 flex">
          <ChartCard className="flex-1" title="Deuda por cobrar" description="¿Quién tiene más pendiente?">
            <InlineRanking
              data={montoPorCobrarPorContador.filter((c) => c.monto > 0).map((c) => ({
                label: c.nombre.split(" ")[0],
                value: c.monto,
              }))}
              formatValue={formatCurrency}
              color="var(--chart-3)"
            />
          </ChartCard>
        </div>
      </div>

      {/* Fila 3 — Detalle: pivots mensuales */}
      <PivotTable
        title="Ventas por contador — Últimos 12 meses"
        rowLabel="Contador"
        rows={ventasPorContador.rows}
        rowKey="contador"
        monthLabels={ventasPorContador.labels}
      />
      <PivotTable
        title="Ventas por servicio — Últimos 12 meses"
        rowLabel="Servicio"
        rows={ventasPorServicio.rows}
        rowKey="tipoServicio"
        monthLabels={ventasPorServicio.labels}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Componente principal                                                 */
/* ------------------------------------------------------------------ */

export function FinanzasOverview({
  kpis,
  cobradoPorCuenta,
  ultimasTransacciones,
  finanzasMensuales,
  ingresosPorTipoServicio,
  ventasPorContador,
  ventasPorServicio,
  montoPorCobrarPorContador,
  egresosPorCategoria,
  todasTransacciones,
  cuentas,
  servicios,
  canEdit,
  anio,
  mes,
  tab,
  cajaChicaSaldo,
  cajaChicaBalanceDiario,
  cajaChicaMovimientos,
  cobranzasData,
}: FinanzasOverviewProps) {
  const [formOpen, setFormOpen] = React.useState(false);
  const [editRow, setEditRow] = React.useState<FinanzaRow | null>(null);
  const [pdfOpen, setPdfOpen] = React.useState(false);

  function handleEdit(row: FinanzaRow) {
    setEditRow(row);
    setFormOpen(true);
  }

  function handleCloseForm(open: boolean) {
    setFormOpen(open);
    if (!open) setEditRow(null);
  }

  return (
    <div className="flex flex-col gap-4 min-w-0">
      {/* 1. KPI bar */}
      <KPIBar kpis={kpis} mes={mes} />

      {/* 2. Tabs de navegación */}
      <TabNav tab={tab} anio={anio} mes={mes} onPdfClick={() => setPdfOpen(true)} />

      {/* ---- Tab: Transacciones (default) ---- */}
      {tab === "transacciones" && (
        <div>
          {/* Cobrado hoy por banco — barra inline */}
          <div className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-1 rounded-lg border border-border bg-muted/30 px-3 py-2">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Cobrado hoy</span>
            {cobradoPorCuenta.filter((c) => c.montoCobrado > 0).map((c) => (
              <span key={c.id} className="flex items-center gap-1.5 text-xs">
                <span className="text-muted-foreground">{c.nombre}:</span>
                <span className="font-mono font-semibold text-emerald-700 dark:text-emerald-400 tabular-nums">
                  {formatCurrency(c.montoCobrado)}
                </span>
              </span>
            ))}
            {cobradoPorCuenta.every((c) => c.montoCobrado === 0) && (
              <span className="text-xs text-muted-foreground">Sin cobros hoy</span>
            )}
            <span className="ml-auto flex items-center gap-1.5 text-xs font-semibold">
              <span className="text-muted-foreground">Total:</span>
              <span className="font-mono text-emerald-700 dark:text-emerald-400 tabular-nums">
                {formatCurrency(cobradoPorCuenta.reduce((acc, c) => acc + c.montoCobrado, 0))}
              </span>
            </span>
          </div>

          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">
              Todas las transacciones
            </h2>
            {canEdit && (
              <Button onClick={() => setFormOpen(true)} size="sm">
                <PlusIcon className="mr-1.5 size-4" />
                Nueva transacción
              </Button>
            )}
          </div>
          <FinanzaTableSimple
            data={todasTransacciones ?? []}
            total={todasTransacciones?.length ?? 0}
            isAdmin={canEdit}
          />
        </div>
      )}

      {/* ---- Tab: Cobranzas ---- */}
      {tab === "cobranzas" && cobranzasData && (
        <CobranzasTab data={cobranzasData} mes={mes} anio={anio} />
      )}

      {/* ---- Tab: Caja chica ---- */}
      {tab === "caja-chica" && cajaChicaSaldo !== undefined && (
        <CajaChicaClient
          saldoActual={cajaChicaSaldo}
          balanceDiario={cajaChicaBalanceDiario ?? []}
          movimientos={cajaChicaMovimientos as any}
          cuentas={cuentas}
          canEdit={canEdit}
          anio={anio}
          mes={mes}
        />
      )}

      {/* ---- Tab: Análisis ---- */}
      {tab === "analisis" &&
        finanzasMensuales &&
        ingresosPorTipoServicio &&
        ventasPorContador &&
        ventasPorServicio &&
        montoPorCobrarPorContador &&
        egresosPorCategoria && (
          <SeccionAnalisis
            finanzasMensuales={finanzasMensuales}
            ingresosPorTipoServicio={ingresosPorTipoServicio}
            ventasPorContador={ventasPorContador}
            ventasPorServicio={ventasPorServicio}
            montoPorCobrarPorContador={montoPorCobrarPorContador}
            egresosPorCategoria={egresosPorCategoria}
            anio={anio}
            mes={mes}
          />
        )}

      {/* Form dialog (solo necesario en tab transacciones pero lo mantenemos disponible) */}
      <FinanzaForm
        open={formOpen}
        onOpenChange={handleCloseForm}
        cuentas={cuentas}
        servicios={servicios}
        editId={editRow?.id}
        defaultValues={
          editRow
            ? {
                tipo: editRow.tipo,
                monto: editRow.monto,
                fecha: editRow.fecha,
                concepto: editRow.concepto,
                cuentaId: editRow.cuenta.id ?? "",
                categoriaGasto: (editRow.categoriaGasto as any) ?? null,
              }
            : undefined
        }
      />

      {/* PDF dialog */}
      <FinanzaPdfDialog
        open={pdfOpen}
        onOpenChange={setPdfOpen}
        data={todasTransacciones ?? []}
        kpis={kpis}
        cobradoPorCuenta={cobradoPorCuenta}
        anio={anio}
        mes={mes}
      />
    </div>
  );
}

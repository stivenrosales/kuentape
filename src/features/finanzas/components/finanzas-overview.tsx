"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowUpIcon,
  ArrowDownIcon,
  TrendingUpIcon,
  TrendingDownIcon,
  AlertCircleIcon,
  PlusIcon,
  BarChart2Icon,
  ListIcon,
  ExternalLinkIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { ChartCard } from "@/components/chart-card";
import { DonutChart } from "@/components/charts/donut-chart";
import { LineChart } from "@/components/charts/line-chart";
import { BarChart } from "@/components/charts/bar-chart";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";
import { FinanzaTableSimple } from "./finanza-table-simple";
import { FinanzaForm } from "./finanza-form";
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
  contador: string;
  total: number;
  [mes: string]: string | number;
}

interface VentasPorServicio {
  tipoServicio: string;
  total: number;
  [mes: string]: string | number;
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
  ventasPorContador?: VentasPorContador[];
  ventasPorServicio?: VentasPorServicio[];
  montoPorCobrarPorContador?: MontoPorCobrarPorContador[];
  egresosPorCategoria?: EgresosPorCategoria[];
  /* transacciones completas — solo en tab=transacciones */
  todasTransacciones?: FinanzaRow[];
  cuentas: CuentaBancaria[];
  servicios: ServicioConDeuda[];
  canEdit: boolean;
  anio: number;
  mes: number;
  tab: "overview" | "transacciones" | "analisis";
}

/* ------------------------------------------------------------------ */
/* Constantes                                                           */
/* ------------------------------------------------------------------ */

const MESES = [
  "Ene", "Feb", "Mar", "Abr", "May", "Jun",
  "Jul", "Ago", "Set", "Oct", "Nov", "Dic",
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
  const mesLabel = MESES[mes - 1];

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

function TabNav({ tab, anio, mes }: { tab: string; anio: number; mes: number }) {
  const baseParams = `anio=${anio}&mes=${mes}`;

  const tabs = [
    { key: "overview", label: "Resumen", icon: BarChart2Icon },
    { key: "transacciones", label: "Transacciones", icon: ListIcon },
    { key: "analisis", label: "Análisis", icon: TrendingUpIcon },
  ] as const;

  return (
    <div className="flex items-center gap-1 rounded-lg border border-border bg-muted/40 p-1">
      {tabs.map(({ key, label, icon: Icon }) => (
        <Link
          key={key}
          href={`/finanzas?tab=${key}&${baseParams}`}
          className={cn(
            "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
            tab === key
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Icon className="h-3 w-3" />
          {label}
        </Link>
      ))}

      {/* Separador + sub-navegación a páginas hijas */}
      <div className="ml-auto flex items-center gap-1 pl-2">
        <div className="h-4 w-px bg-border/60" />
        {[
          { href: "/finanzas/egresos", label: "Egresos" },
          { href: "/finanzas/caja-chica", label: "Caja chica" },
          { href: "/finanzas/comprobantes", label: "Comprobantes" },
        ].map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            {link.label}
            <ExternalLinkIcon className="h-2.5 w-2.5" />
          </Link>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Sección Análisis                                                     */
/* ------------------------------------------------------------------ */

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
  ventasPorContador: VentasPorContador[];
  ventasPorServicio: VentasPorServicio[];
  montoPorCobrarPorContador: MontoPorCobrarPorContador[];
  egresosPorCategoria: EgresosPorCategoria[];
  anio: number;
  mes: number;
}) {
  const mesLabel = MESES[mes - 1];

  return (
    <div className="space-y-4">
      {/* Donuts del mes */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <ChartCard
          title="Tipos de ingreso del mes"
          description={`Distribución por tipo de servicio — ${mesLabel}`}
        >
          <DonutChart
            data={ingresosPorTipoServicio.tipos.map((tipo) => {
              const row = ingresosPorTipoServicio.data.find((d) => d.mes === mesLabel);
              return { name: tipo, value: (row?.[tipo] as number) ?? 0 };
            })}
            formatValue={formatCurrency}
          />
        </ChartCard>

        <ChartCard
          title="Tipos de gasto del mes"
          description={`Distribución por categoría — ${mesLabel}`}
        >
          <DonutChart data={egresosPorCategoria} formatValue={formatCurrency} />
        </ChartCard>
      </div>

      {/* Line charts */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <ChartCard
          title="Ingresos por tipo"
          description={`Por tipo de servicio mensual — ${anio}`}
        >
          <LineChart
            data={ingresosPorTipoServicio.data}
            xKey="mes"
            lines={ingresosPorTipoServicio.tipos.map((t) => ({ key: t, label: t }))}
            formatValue={formatCurrency}
            height={260}
          />
        </ChartCard>

        <ChartCard
          title="Finanzas mes a mes"
          description={`Ingreso, egreso y utilidad — ${anio}`}
        >
          <LineChart
            data={finanzasMensuales}
            xKey="mes"
            lines={[
              { key: "ingreso", label: "Ingreso" },
              { key: "egreso", label: "Egreso" },
              { key: "utilidad", label: "Utilidad" },
            ]}
            formatValue={formatCurrency}
            height={260}
          />
        </ChartCard>
      </div>

      {/* Bar chart deuda por contador */}
      <ChartCard
        title="Monto por cobrar por contador"
        description="Deuda activa por asesor"
      >
        <BarChart
          data={montoPorCobrarPorContador.map((c) => ({
            contador: c.nombre,
            monto: c.monto,
          }))}
          xKey="contador"
          bars={[{ key: "monto", label: "Monto por cobrar" }]}
          formatValue={formatCurrency}
          height={200}
        />
      </ChartCard>

      {/* Pivot tables */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        {/* Ventas por Contador */}
        <div className="overflow-x-auto rounded-lg border border-border bg-card shadow-sm">
          <div className="border-b border-border px-4 py-3">
            <h3 className="text-sm font-semibold">Ventas por contador — {anio}</h3>
          </div>
          <div className="p-4">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border/60">
                  <th className="py-2 pr-3 text-left font-medium text-muted-foreground">
                    Contador
                  </th>
                  {MESES.map((m) => (
                    <th
                      key={m}
                      className="px-1 py-2 text-right font-medium text-muted-foreground"
                    >
                      {m}
                    </th>
                  ))}
                  <th className="py-2 pl-3 text-right font-semibold text-foreground">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody>
                {ventasPorContador.map((row) => (
                  <tr
                    key={row.contador}
                    className="border-b border-border/30 hover:bg-muted/20"
                  >
                    <td className="py-2 pr-3 font-medium text-foreground">
                      {row.contador}
                    </td>
                    {MESES.map((m) => (
                      <td
                        key={m}
                        className="px-1 py-2 text-right font-mono text-muted-foreground"
                      >
                        {row[m] ? formatCurrency(row[m] as number) : "—"}
                      </td>
                    ))}
                    <td className="py-2 pl-3 text-right font-mono font-semibold text-foreground">
                      {formatCurrency(row.total as number)}
                    </td>
                  </tr>
                ))}
                {ventasPorContador.length === 0 && (
                  <tr>
                    <td
                      colSpan={14}
                      className="py-6 text-center text-muted-foreground"
                    >
                      Sin datos
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Ventas por Servicio */}
        <div className="overflow-x-auto rounded-lg border border-border bg-card shadow-sm">
          <div className="border-b border-border px-4 py-3">
            <h3 className="text-sm font-semibold">Ventas por servicio — {anio}</h3>
          </div>
          <div className="p-4">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border/60">
                  <th className="py-2 pr-3 text-left font-medium text-muted-foreground">
                    Servicio
                  </th>
                  {MESES.map((m) => (
                    <th
                      key={m}
                      className="px-1 py-2 text-right font-medium text-muted-foreground"
                    >
                      {m}
                    </th>
                  ))}
                  <th className="py-2 pl-3 text-right font-semibold text-foreground">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody>
                {ventasPorServicio.map((row) => (
                  <tr
                    key={row.tipoServicio}
                    className="border-b border-border/30 hover:bg-muted/20"
                  >
                    <td className="py-2 pr-3 font-medium text-foreground">
                      {row.tipoServicio}
                    </td>
                    {MESES.map((m) => (
                      <td
                        key={m}
                        className="px-1 py-2 text-right font-mono text-muted-foreground"
                      >
                        {row[m] ? formatCurrency(row[m] as number) : "—"}
                      </td>
                    ))}
                    <td className="py-2 pl-3 text-right font-mono font-semibold text-foreground">
                      {formatCurrency(row.total as number)}
                    </td>
                  </tr>
                ))}
                {ventasPorServicio.length === 0 && (
                  <tr>
                    <td
                      colSpan={14}
                      className="py-6 text-center text-muted-foreground"
                    >
                      Sin datos
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
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
}: FinanzasOverviewProps) {
  const [formOpen, setFormOpen] = React.useState(false);
  const [editRow, setEditRow] = React.useState<FinanzaRow | null>(null);

  function handleEdit(row: FinanzaRow) {
    setEditRow(row);
    setFormOpen(true);
  }

  function handleCloseForm(open: boolean) {
    setFormOpen(open);
    if (!open) setEditRow(null);
  }

  return (
    <div className="flex flex-col gap-4">
      {/* 1. KPI bar */}
      <KPIBar kpis={kpis} mes={mes} />

      {/* 2. Tabs de navegación */}
      <TabNav tab={tab} anio={anio} mes={mes} />

      {/* ---- Tab: Resumen (overview) ---- */}
      {tab === "overview" && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {/* Izquierda 2/3: últimas transacciones */}
          <div className="lg:col-span-2">
            <UltimasTransacciones transacciones={ultimasTransacciones} />
          </div>

          {/* Derecha 1/3: cobrado hoy */}
          <div>
            <CobradoHoy cuentas={cobradoPorCuenta} />
          </div>
        </div>
      )}

      {/* ---- Tab: Transacciones ---- */}
      {tab === "transacciones" && (
        <div>
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
    </div>
  );
}

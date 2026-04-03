"use client";

import * as React from "react";
import { PlusIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { KPICard } from "@/components/kpi-card";
import { ChartCard } from "@/components/chart-card";
import { DonutChart } from "@/components/charts/donut-chart";
import { LineChart } from "@/components/charts/line-chart";
import { BarChart } from "@/components/charts/bar-chart";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";
import { FinanzaTable } from "./finanza-table";
import { FinanzaForm } from "./finanza-form";
import type { FinanzaRow } from "./finanza-table";

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

const MESES = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Set", "Oct", "Nov", "Dic"];

interface FinanzasClientProps {
  kpis: KPIs;
  cobradoPorCuenta: CobradoPorCuenta[];
  finanzasMensuales: FinanzasMensualesRow[];
  ingresosPorTipoServicio: IngresosPorTipoServicio;
  ventasPorContador: VentasPorContador[];
  ventasPorServicio: VentasPorServicio[];
  montoPorCobrarPorContador: MontoPorCobrarPorContador[];
  egresosPorCategoria: EgresosPorCategoria[];
  transacciones: FinanzaRow[];
  cuentas: CuentaBancaria[];
  servicios: ServicioConDeuda[];
  canEdit: boolean;
  anio: number;
  mes: number;
}

export function FinanzasClient({
  kpis,
  cobradoPorCuenta,
  finanzasMensuales,
  ingresosPorTipoServicio,
  ventasPorContador,
  ventasPorServicio,
  montoPorCobrarPorContador,
  egresosPorCategoria,
  transacciones,
  cuentas,
  servicios,
  canEdit,
  anio,
  mes,
}: FinanzasClientProps) {
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
    <div className="flex flex-col gap-6">
      {/* KPIs */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <KPICard
          label="Deuda Total"
          value={formatCurrency(kpis.deudaTotal)}
          className="border-l-2 border-l-amber-500"
        />
        <KPICard
          label={`Ingresos ${MESES[mes - 1]}`}
          value={formatCurrency(kpis.totalIngresos)}
          className="border-l-2 border-l-emerald-500"
        />
        <KPICard
          label={`Gastos ${MESES[mes - 1]}`}
          value={formatCurrency(kpis.totalEgresos)}
          className="border-l-2 border-l-red-500"
        />
        <KPICard
          label={`Utilidad ${MESES[mes - 1]}`}
          value={formatCurrency(kpis.utilidad)}
          className={cn(
            "border-l-2",
            kpis.utilidad >= 0 ? "border-l-emerald-500" : "border-l-red-500"
          )}
        />
      </div>

      {/* Cobrado Hoy */}
      <div>
        <h2 className="mb-3 text-base font-semibold text-foreground">Cobrado Hoy</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-8">
          {cobradoPorCuenta.map((cuenta) => (
            <div
              key={cuenta.id}
              className="flex flex-col gap-1 rounded-xl border border-border/60 bg-card p-3 shadow-sm"
            >
              <p className="truncate text-xs font-medium text-muted-foreground">{cuenta.nombre}</p>
              <p
                className={cn(
                  "font-mono text-sm font-semibold",
                  cuenta.montoCobrado > 0
                    ? "text-emerald-700 dark:text-emerald-400"
                    : "text-muted-foreground"
                )}
              >
                {formatCurrency(cuenta.montoCobrado)}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Charts row 1 */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <ChartCard title="Tipos de Ingreso del Mes" description="Distribución por tipo de servicio">
          <DonutChart
            data={ingresosPorTipoServicio.tipos.map((tipo, i) => {
              const mesLabel = MESES[mes - 1];
              const row = ingresosPorTipoServicio.data.find((d) => d.mes === mesLabel);
              return { name: tipo, value: (row?.[tipo] as number) ?? 0 };
            })}
            formatValue={formatCurrency}
          />
        </ChartCard>

        <ChartCard title="Tipos de Gasto del Mes" description="Distribución por categoría">
          <DonutChart
            data={egresosPorCategoria}
            formatValue={formatCurrency}
          />
        </ChartCard>
      </div>

      {/* Charts row 2 */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <ChartCard
          title="Tipos de Ingresos por Mes"
          description={`Ingresos mensuales por tipo de servicio — ${anio}`}
        >
          <LineChart
            data={ingresosPorTipoServicio.data}
            xKey="mes"
            lines={ingresosPorTipoServicio.tipos.map((t) => ({ key: t, label: t }))}
            formatValue={formatCurrency}
            height={260}
          />
        </ChartCard>

        <ChartCard title="Finanzas mes a mes" description={`Ingreso, Egreso y Utilidad — ${anio}`}>
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

      {/* Monto por cobrar por contador */}
      <ChartCard title="Monto por Cobrar por Contador" description="Deuda activa por asesor">
        <BarChart
          data={montoPorCobrarPorContador.map((c) => ({ contador: c.nombre, monto: c.monto }))}
          xKey="contador"
          bars={[{ key: "monto", label: "Monto por cobrar" }]}
          formatValue={formatCurrency}
          height={200}
        />
      </ChartCard>

      {/* Pivot tables */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        {/* Ventas por Contador */}
        <div className="rounded-[1.25rem] bg-card p-4 shadow-[0_4px_16px_-4px_rgba(0,0,0,0.12),0_2px_8px_-2px_rgba(0,0,0,0.08)] ring-1 ring-foreground/10 overflow-x-auto">
          <h3 className="mb-3 text-base font-semibold">Ventas por Contador — {anio}</h3>
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border/60">
                <th className="py-2 pr-3 text-left font-medium text-muted-foreground">Contador</th>
                {MESES.map((m) => (
                  <th key={m} className="py-2 px-1 text-right font-medium text-muted-foreground">
                    {m}
                  </th>
                ))}
                <th className="py-2 pl-3 text-right font-semibold text-foreground">Total</th>
              </tr>
            </thead>
            <tbody>
              {ventasPorContador.map((row) => (
                <tr key={row.contador} className="border-b border-border/30 hover:bg-muted/20">
                  <td className="py-2 pr-3 font-medium text-foreground">{row.contador}</td>
                  {MESES.map((m) => (
                    <td key={m} className="py-2 px-1 text-right font-mono text-muted-foreground">
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
                  <td colSpan={14} className="py-6 text-center text-muted-foreground">
                    Sin datos
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Ventas por Servicio */}
        <div className="rounded-[1.25rem] bg-card p-4 shadow-[0_4px_16px_-4px_rgba(0,0,0,0.12),0_2px_8px_-2px_rgba(0,0,0,0.08)] ring-1 ring-foreground/10 overflow-x-auto">
          <h3 className="mb-3 text-base font-semibold">Ventas por Servicio — {anio}</h3>
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border/60">
                <th className="py-2 pr-3 text-left font-medium text-muted-foreground">Servicio</th>
                {MESES.map((m) => (
                  <th key={m} className="py-2 px-1 text-right font-medium text-muted-foreground">
                    {m}
                  </th>
                ))}
                <th className="py-2 pl-3 text-right font-semibold text-foreground">Total</th>
              </tr>
            </thead>
            <tbody>
              {ventasPorServicio.map((row) => (
                <tr key={row.tipoServicio} className="border-b border-border/30 hover:bg-muted/20">
                  <td className="py-2 pr-3 font-medium text-foreground">{row.tipoServicio}</td>
                  {MESES.map((m) => (
                    <td key={m} className="py-2 px-1 text-right font-mono text-muted-foreground">
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
                  <td colSpan={14} className="py-6 text-center text-muted-foreground">
                    Sin datos
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Tabla de transacciones */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-semibold text-foreground">Todas las transacciones</h2>
          {canEdit && (
            <Button onClick={() => setFormOpen(true)} size="sm">
              <PlusIcon className="mr-1.5 size-4" />
              Nueva transacción
            </Button>
          )}
        </div>
        <FinanzaTable
          data={transacciones}
          canEdit={canEdit}
          onEdit={handleEdit}
        />
      </div>

      {/* Form dialog */}
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
                categoriaGasto: editRow.categoriaGasto as any ?? null,
              }
            : undefined
        }
      />
    </div>
  );
}

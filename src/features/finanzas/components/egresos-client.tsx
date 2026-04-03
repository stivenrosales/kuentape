"use client";

import * as React from "react";
import { PlusIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { KPICard } from "@/components/kpi-card";
import { ChartCard } from "@/components/chart-card";
import { LineChart } from "@/components/charts/line-chart";
import { BarChart } from "@/components/charts/bar-chart";
import { formatCurrency } from "@/lib/format";
import { FinanzaTable } from "./finanza-table";
import { FinanzaForm } from "./finanza-form";
import type { FinanzaRow } from "./finanza-table";

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

interface EgresosPorCategoriaData {
  data: Record<string, unknown>[];
  categorias: string[];
}

interface EgresosMensualesRow {
  name: string;
  value: number;
}

interface EgresosClientProps {
  totalEgresos: number;
  egresosPorCategoriaAnual: EgresosPorCategoriaData;
  egresosPorCategoria: EgresosMensualesRow[];
  transacciones: FinanzaRow[];
  cuentas: CuentaBancaria[];
  servicios: ServicioConDeuda[];
  canEdit: boolean;
  anio: number;
  mes: number;
}

const MESES = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Set", "Oct", "Nov", "Dic"];

export function EgresosClient({
  totalEgresos,
  egresosPorCategoriaAnual,
  egresosPorCategoria,
  transacciones,
  cuentas,
  servicios,
  canEdit,
  anio,
  mes,
}: EgresosClientProps) {
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
      {/* KPI */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <KPICard
          label={`Gasto Total ${MESES[mes - 1]} ${anio}`}
          value={formatCurrency(totalEgresos)}
          className="border-l-2 border-l-red-500"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <ChartCard
          title="Gastos por Categoría (año)"
          description={`Segmentado por tipo — ${anio}`}
        >
          <LineChart
            data={egresosPorCategoriaAnual.data}
            xKey="mes"
            lines={egresosPorCategoriaAnual.categorias.map((c) => ({ key: c, label: c }))}
            formatValue={formatCurrency}
            height={260}
          />
        </ChartCard>

        <ChartCard
          title="Distribución de Gastos"
          description={`Por categoría — ${MESES[mes - 1]} ${anio}`}
        >
          <BarChart
            data={egresosPorCategoria.map((e) => ({ categoria: e.name, monto: e.value }))}
            xKey="categoria"
            bars={[{ key: "monto", label: "Monto" }]}
            formatValue={formatCurrency}
            height={260}
          />
        </ChartCard>
      </div>

      {/* Tabla */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-semibold text-foreground">Egresos del período</h2>
          {canEdit && (
            <Button onClick={() => setFormOpen(true)} size="sm">
              <PlusIcon className="mr-1.5 size-4" />
              Nuevo egreso
            </Button>
          )}
        </div>
        <FinanzaTable
          data={transacciones}
          canEdit={canEdit}
          onEdit={handleEdit}
        />
      </div>

      <FinanzaForm
        open={formOpen}
        onOpenChange={handleCloseForm}
        cuentas={cuentas}
        servicios={servicios}
        editId={editRow?.id}
        defaultValues={
          editRow
            ? {
                tipo: "EGRESO",
                monto: editRow.monto,
                fecha: editRow.fecha,
                concepto: editRow.concepto,
                cuentaId: editRow.cuenta.id ?? "",
                categoriaGasto: editRow.categoriaGasto as any ?? null,
              }
            : { tipo: "EGRESO" }
        }
      />
    </div>
  );
}

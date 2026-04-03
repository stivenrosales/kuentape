"use client";

import * as React from "react";
import { PlusIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { KPICard } from "@/components/kpi-card";
import { ChartCard } from "@/components/chart-card";
import { AreaChart } from "@/components/charts/area-chart";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";
import { CajaChicaTable } from "./caja-chica-table";
import { CajaChicaForm } from "./caja-chica-form";
import type { CajaChicaRow } from "./caja-chica-table";

type BalanceHistoryRow = Record<string, unknown> & {
  mes: string;
  saldo: number;
};

interface CajaChicaClientProps {
  saldoActual: number;
  balanceHistory: BalanceHistoryRow[];
  movimientos: CajaChicaRow[];
  canEdit: boolean;
  anio: number;
  mes: number;
}

const MESES = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Set", "Oct", "Nov", "Dic"];

export function CajaChicaClient({
  saldoActual,
  balanceHistory,
  movimientos,
  canEdit,
  anio,
  mes,
}: CajaChicaClientProps) {
  const [formOpen, setFormOpen] = React.useState(false);
  const [editRow, setEditRow] = React.useState<CajaChicaRow | null>(null);

  function handleEdit(row: CajaChicaRow) {
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
          label="Saldo Actual"
          value={formatCurrency(saldoActual)}
          className={cn(
            "border-l-2",
            saldoActual < 0 ? "border-l-red-500" : "border-l-emerald-500"
          )}
        />
      </div>

      {/* Area chart */}
      <ChartCard
        title="Balance a lo largo del año"
        description={`Evolución del saldo de caja chica — ${anio}`}
      >
        <AreaChart
          data={balanceHistory}
          xKey="mes"
          areas={[{ key: "saldo", label: "Saldo" }]}
          formatValue={formatCurrency}
          height={260}
        />
      </ChartCard>

      {/* Tabla */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-semibold text-foreground">
            Movimientos — {MESES[mes - 1]} {anio}
          </h2>
          {canEdit && (
            <Button onClick={() => setFormOpen(true)} size="sm">
              <PlusIcon className="mr-1.5 size-4" />
              Nuevo movimiento
            </Button>
          )}
        </div>
        <CajaChicaTable
          data={movimientos}
          canEdit={canEdit}
          onEdit={handleEdit}
        />
      </div>

      <CajaChicaForm
        open={formOpen}
        onOpenChange={handleCloseForm}
        editId={editRow?.id}
        defaultValues={
          editRow
            ? {
                tipo: editRow.tipo,
                monto: editRow.monto,
                fecha: editRow.fecha,
                concepto: editRow.concepto,
                comprobanteUrl: editRow.comprobanteUrl,
              }
            : undefined
        }
      />
    </div>
  );
}

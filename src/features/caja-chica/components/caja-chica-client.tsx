"use client";

import * as React from "react";
import { PlusIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AreaChart } from "@/components/charts/area-chart";
import { formatCurrency, formatCurrencyShort, formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import { CajaChicaForm } from "./caja-chica-form";
import { CajaChicaDetailDialog } from "./caja-chica-detail-dialog";
import type { CajaChicaRow } from "./caja-chica-table";

interface CajaChicaClientProps {
  saldoActual: number;
  balanceDiario: { dia: string; saldo: number }[];
  movimientos: CajaChicaRow[];
  cuentas?: { id: string; nombre: string; banco: string }[];
  canEdit: boolean;
  anio: number;
  mes: number;
}

const MESES = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Set", "Oct", "Nov", "Dic"];

export function CajaChicaClient({
  saldoActual,
  balanceDiario,
  movimientos,
  cuentas = [],
  canEdit,
  anio,
  mes,
}: CajaChicaClientProps) {
  const [formOpen, setFormOpen] = React.useState(false);
  const [editRow, setEditRow] = React.useState<CajaChicaRow | null>(null);
  const [selectedRow, setSelectedRow] = React.useState<CajaChicaRow | null>(null);

  function handleClickRow(row: CajaChicaRow) {
    setSelectedRow(row);
  }

  function handleCloseForm(open: boolean) {
    setFormOpen(open);
    if (!open) setEditRow(null);
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Header: título + saldo + botón */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <h2 className="text-sm font-semibold text-foreground">
            Caja chica — {MESES[mes - 1]} {anio}
          </h2>
          <div className={cn(
            "rounded-md border px-2.5 py-1 font-mono text-xs font-bold tabular-nums",
            saldoActual < 0
              ? "border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950/30 dark:text-red-400"
              : "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400"
          )}>
            Saldo: {formatCurrency(saldoActual)}
          </div>
        </div>
        {canEdit && (
          <Button onClick={() => setFormOpen(true)} size="sm">
            <PlusIcon className="mr-1.5 size-4" />
            Nuevo movimiento
          </Button>
        )}
      </div>

      {/* Sparkline de saldo diario — barra compacta arriba de la tabla */}
      {balanceDiario.length > 0 && (
        <div className="rounded-lg border border-border bg-card shadow-sm px-3 py-2 overflow-hidden min-w-0">
          <AreaChart
            data={balanceDiario}
            xKey="dia"
            areas={[{ key: "saldo", label: "Saldo" }]}
            formatValue={formatCurrencyShort}
            height={80}
          />
        </div>
      )}

      {/* Tabla full width */}
      <div className="rounded-lg border border-border bg-card shadow-sm overflow-hidden">
        <table className="w-full text-sm border-collapse" style={{ tableLayout: "fixed" }}>
          <colgroup><col style={{ width: "14%" }} /><col style={{ width: "9%" }} /><col style={{ width: "24%" }} /><col style={{ width: "17%" }} /><col style={{ width: "18%" }} /><col style={{ width: "18%" }} /></colgroup>
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="px-3 py-2 text-left text-[10px] uppercase tracking-wider font-medium text-muted-foreground">Fecha</th>
              <th className="px-3 py-2 text-left text-[10px] uppercase tracking-wider font-medium text-muted-foreground">Tipo</th>
              <th className="px-3 py-2 text-left text-[10px] uppercase tracking-wider font-medium text-muted-foreground">Concepto</th>
              <th className="px-3 py-2 text-left text-[10px] uppercase tracking-wider font-medium text-muted-foreground">Categoría</th>
              <th className="px-3 py-2 text-right text-[10px] uppercase tracking-wider font-medium text-muted-foreground">Monto</th>
              <th className="px-3 py-2 text-right text-[10px] uppercase tracking-wider font-medium text-muted-foreground">Saldo</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50">
            {movimientos.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-xs text-muted-foreground">
                  Sin movimientos este mes.
                </td>
              </tr>
            ) : (
              movimientos.map((row, i) => (
                <tr
                  key={row.id}
                  onClick={() => handleClickRow(row)}
                  className={cn(
                    "transition-colors cursor-pointer hover:bg-primary/5",
                    i % 2 === 0 ? "bg-muted/10" : "bg-background"
                  )}
                >
                  <td className="px-3 py-2 font-mono text-xs text-muted-foreground whitespace-nowrap">
                    {formatDate(row.fecha)}
                  </td>
                  <td className="px-3 py-2">
                    <Badge className={cn(
                      "text-[10px]",
                      row.tipo === "INGRESO"
                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 border-transparent"
                        : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 border-transparent"
                    )}>
                      {row.tipo === "INGRESO" ? "Ingreso" : "Gasto"}
                    </Badge>
                  </td>
                  <td className="px-3 py-2 text-xs font-medium truncate">{row.concepto}</td>
                  <td className="px-3 py-2 text-xs text-muted-foreground truncate">
                    {row.categoriaGasto ?? "—"}
                  </td>
                  <td className="px-3 py-2 text-right">
                    <span className={cn(
                      "font-mono text-xs font-semibold tabular-nums",
                      row.tipo === "INGRESO"
                        ? "text-emerald-700 dark:text-emerald-400"
                        : "text-red-700 dark:text-red-400"
                    )}>
                      {row.tipo === "GASTO" ? "-" : "+"}{formatCurrency(row.monto)}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-right">
                    <span className={cn(
                      "font-mono text-xs font-semibold tabular-nums",
                      row.saldoAcumulado < 0 ? "text-red-700 dark:text-red-400" : "text-foreground"
                    )}>
                      {formatCurrency(row.saldoAcumulado)}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Detail popup */}
      {selectedRow && (
        <CajaChicaDetailDialog
          row={selectedRow}
          canEdit={canEdit}
          onClose={() => setSelectedRow(null)}
        />
      )}

      <CajaChicaForm
        open={formOpen}
        onOpenChange={handleCloseForm}
        cuentas={cuentas}
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

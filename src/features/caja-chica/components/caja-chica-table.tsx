"use client";

import * as React from "react";
import { ColumnDef } from "@tanstack/react-table";
import { ImageIcon, PencilIcon } from "lucide-react";

import { DataTable } from "@/components/data-table/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";

export interface CajaChicaRow {
  id: string;
  tipo: "INGRESO" | "GASTO";
  concepto: string;
  categoriaGasto: string | null;
  monto: number;
  fecha: Date;
  saldoAcumulado: number;
  comprobanteUrl: string | null;
}

interface CajaChicaTableProps {
  data: CajaChicaRow[];
  canEdit?: boolean;
  onEdit?: (row: CajaChicaRow) => void;
}

export function CajaChicaTable({ data, canEdit, onEdit }: CajaChicaTableProps) {
  const columns: ColumnDef<CajaChicaRow>[] = [
    {
      accessorKey: "fecha",
      header: "Fecha",
      cell: ({ row }) => (
        <span className="font-mono text-xs text-muted-foreground">
          {formatDate(row.getValue("fecha"))}
        </span>
      ),
    },
    {
      accessorKey: "concepto",
      header: "Concepto",
      cell: ({ row }) => (
        <span className="text-sm font-medium">{row.getValue("concepto")}</span>
      ),
    },
    {
      accessorKey: "tipo",
      header: "Tipo",
      cell: ({ row }) => {
        const tipo = row.getValue<"INGRESO" | "GASTO">("tipo");
        return (
          <Badge
            variant="outline"
            className={cn(
              "font-medium text-xs",
              tipo === "INGRESO"
                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                : "border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-400"
            )}
          >
            {tipo === "INGRESO" ? "Ingreso" : "Gasto"}
          </Badge>
        );
      },
    },
    {
      accessorKey: "monto",
      header: "Monto",
      cell: ({ row }) => {
        const monto = row.getValue<number>("monto");
        const tipo = row.original.tipo;
        return (
          <span
            className={cn(
              "font-mono text-sm font-semibold",
              tipo === "INGRESO"
                ? "text-emerald-700 dark:text-emerald-400"
                : "text-red-700 dark:text-red-400"
            )}
          >
            {tipo === "GASTO" ? "-" : "+"}
            {formatCurrency(monto)}
          </span>
        );
      },
    },
    {
      accessorKey: "saldoAcumulado",
      header: "Saldo",
      cell: ({ row }) => {
        const saldo = row.getValue<number>("saldoAcumulado");
        return (
          <span
            className={cn(
              "font-mono text-sm font-semibold",
              saldo < 0
                ? "text-red-700 dark:text-red-400"
                : "text-foreground"
            )}
          >
            {formatCurrency(saldo)}
          </span>
        );
      },
    },
    {
      accessorKey: "comprobanteUrl",
      header: "Comprobante",
      cell: ({ row }) => {
        const url = row.getValue<string | null>("comprobanteUrl");
        if (!url) return <span className="text-muted-foreground text-xs">—</span>;
        return (
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:text-primary/80"
            aria-label="Ver comprobante"
          >
            <ImageIcon className="size-4" />
          </a>
        );
      },
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          {canEdit && onEdit && (
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => onEdit(row.original)}
              aria-label="Editar movimiento"
            >
              <PencilIcon className="size-4" />
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={data}
      searchKey="concepto"
      searchPlaceholder="Buscar por concepto..."
      emptyMessage="No hay movimientos de caja chica."
    />
  );
}

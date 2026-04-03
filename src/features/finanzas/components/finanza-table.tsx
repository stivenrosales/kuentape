"use client";

import * as React from "react";
import { ColumnDef } from "@tanstack/react-table";
import { ImageIcon, PencilIcon, EyeIcon } from "lucide-react";

import { DataTable } from "@/components/data-table/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";

export interface FinanzaRow {
  id: string;
  tipo: "INGRESO" | "EGRESO";
  concepto: string;
  monto: number;
  fecha: Date;
  categoriaGasto: string | null;
  comprobanteUrl: string | null;
  cuenta: { id: string; nombre: string; banco: string };
  servicio?: { persona: { razonSocial: string }; tipoServicio: { nombre: string } } | null;
}

interface FinanzaTableProps {
  data: FinanzaRow[];
  canEdit?: boolean;
  onEdit?: (row: FinanzaRow) => void;
  onView?: (row: FinanzaRow) => void;
}

export function FinanzaTable({ data, canEdit, onEdit, onView }: FinanzaTableProps) {
  const columns: ColumnDef<FinanzaRow>[] = [
    {
      accessorKey: "tipo",
      header: "Tipo",
      cell: ({ row }) => {
        const tipo = row.getValue<"INGRESO" | "EGRESO">("tipo");
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
            {tipo === "INGRESO" ? "Ingreso" : "Egreso"}
          </Badge>
        );
      },
    },
    {
      accessorKey: "concepto",
      header: "Concepto",
      cell: ({ row }) => (
        <div className="max-w-[200px]">
          <p className="truncate text-sm font-medium">{row.getValue("concepto")}</p>
          {row.original.servicio && (
            <p className="truncate text-xs text-muted-foreground">
              {row.original.servicio.persona.razonSocial}
            </p>
          )}
        </div>
      ),
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
            {tipo === "EGRESO" ? "-" : ""}
            {formatCurrency(monto)}
          </span>
        );
      },
    },
    {
      accessorKey: "cuenta",
      header: "Cuenta",
      cell: ({ row }) => (
        <Badge variant="secondary" className="text-xs font-normal">
          {row.original.cuenta.nombre}
        </Badge>
      ),
    },
    {
      accessorKey: "categoriaGasto",
      header: "Categoría",
      cell: ({ row }) => {
        const cat = row.getValue<string | null>("categoriaGasto");
        if (!cat) return <span className="text-muted-foreground text-xs">—</span>;
        return <span className="text-xs text-muted-foreground">{cat}</span>;
      },
    },
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
          {onView && (
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => onView(row.original)}
              aria-label="Ver transacción"
            >
              <EyeIcon className="size-4" />
            </Button>
          )}
          {canEdit && onEdit && (
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => onEdit(row.original)}
              aria-label="Editar transacción"
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
      emptyMessage="No hay transacciones registradas."
    />
  );
}

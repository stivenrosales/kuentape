"use client";

import * as React from "react";
import Link from "next/link";
import { ColumnDef } from "@tanstack/react-table";
import { Eye, CircleDollarSign, Archive, ArchiveRestore } from "lucide-react";
import { toast } from "sonner";

import { DataTable } from "@/components/data-table/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { formatCurrency } from "@/lib/format";
import {
  archivarServicioAction,
  desarchivarServicioAction,
} from "@/features/servicios/actions";
import type { EstadoCobranza, CategoriaServicio } from "@prisma/client";

export interface ServicioRow {
  id: string;
  periodo: string | null;
  honorarios: number;
  montoCobrado: number;
  montoRestante: number;
  precioFinal: number;
  estadoCobranza: EstadoCobranza;
  estado: string;
  persona: { id: string; razonSocial: string };
  tipoServicio: { id: string; nombre: string; categoria: CategoriaServicio };
  contador: { id: string; nombre: string; apellido: string };
}

const CATEGORIA_BADGE: Record<CategoriaServicio, { className: string }> = {
  MENSUAL: {
    className:
      "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border-transparent",
  },
  ANUAL: {
    className:
      "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 border-transparent",
  },
  TRAMITE: {
    className:
      "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 border-transparent",
  },
  ASESORIA: {
    className:
      "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300 border-transparent",
  },
  CONSTITUCION: {
    className:
      "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300 border-transparent",
  },
  REGULARIZACION: {
    className:
      "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300 border-transparent",
  },
  MODIF_ESTATUTO: {
    className:
      "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 border-transparent",
  },
  OTROS: {
    className:
      "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 border-transparent",
  },
};

const COBRANZA_BADGE: Record<
  EstadoCobranza,
  { label: string; className: string }
> = {
  PENDIENTE: {
    label: "Pendiente",
    className:
      "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 border-transparent",
  },
  PARCIAL: {
    label: "Parcial",
    className:
      "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 border-transparent",
  },
  COBRADO: {
    label: "Cobrado",
    className:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 border-transparent",
  },
  INCOBRABLE: {
    label: "Incobrable",
    className:
      "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 border-transparent",
  },
};

const MESES = [
  "Ene", "Feb", "Mar", "Abr", "May", "Jun",
  "Jul", "Ago", "Sep", "Oct", "Nov", "Dic",
];

function formatPeriodo(periodo: string | null): string {
  if (!periodo) return "—";
  const parts = periodo.split("-");
  if (parts.length === 2) {
    const mes = parseInt(parts[1]!, 10) - 1;
    return `${MESES[mes] ?? parts[1]} ${parts[0]}`;
  }
  return periodo;
}

interface ServicioActionsProps {
  row: ServicioRow;
  canArchivar: boolean;
  showDesarchivar: boolean;
  onRegistrarCobro?: (row: ServicioRow) => void;
}

function ServicioActions({
  row,
  canArchivar,
  showDesarchivar,
  onRegistrarCobro,
}: ServicioActionsProps) {
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [confirmDesarchOpen, setConfirmDesarchOpen] = React.useState(false);

  async function handleArchivar() {
    const result = await archivarServicioAction(row.id);
    if (result.error) toast.error("Error al archivar el servicio");
    else toast.success("Servicio archivado");
  }

  async function handleDesarchivar() {
    const result = await desarchivarServicioAction(row.id);
    if (result.error) toast.error("Error al desarchivar el servicio");
    else toast.success("Servicio desarchivado");
  }

  return (
    <div className="flex items-center gap-1">
      <Button variant="ghost" size="sm" className="h-7 w-7 p-0" title="Ver detalle" render={<Link href={`/servicios/${row.id}`} />}>
        <Eye className="size-3.5" />
        <span className="sr-only">Ver detalle</span>
      </Button>

      {!showDesarchivar && row.estadoCobranza !== "COBRADO" && (
        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0 text-emerald-600 hover:text-emerald-700"
          onClick={() => onRegistrarCobro?.(row)}
          title="Registrar cobro"
        >
          <CircleDollarSign className="size-3.5" />
          <span className="sr-only">Registrar cobro</span>
        </Button>
      )}

      {canArchivar && !showDesarchivar && (
        <>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0 text-destructive hover:text-destructive"
            onClick={() => setConfirmOpen(true)}
            title="Archivar"
          >
            <Archive className="size-3.5" />
            <span className="sr-only">Archivar</span>
          </Button>
          <ConfirmDialog
            open={confirmOpen}
            onOpenChange={setConfirmOpen}
            title="Archivar servicio"
            description="¿Estás seguro de archivar este servicio? Se marcará como INCOBRABLE."
            onConfirm={handleArchivar}
            confirmLabel="Archivar"
            variant="destructive"
          />
        </>
      )}

      {showDesarchivar && (
        <>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0 text-blue-600 hover:text-blue-700"
            onClick={() => setConfirmDesarchOpen(true)}
            title="Desarchivar"
          >
            <ArchiveRestore className="size-3.5" />
            <span className="sr-only">Desarchivar</span>
          </Button>
          <ConfirmDialog
            open={confirmDesarchOpen}
            onOpenChange={setConfirmDesarchOpen}
            title="Desarchivar servicio"
            description="¿Estás seguro de desarchivar este servicio? Volverá al estado ACTIVO."
            onConfirm={handleDesarchivar}
            confirmLabel="Desarchivar"
          />
        </>
      )}
    </div>
  );
}

function buildColumns(
  canArchivar: boolean,
  showDesarchivar: boolean,
  onRegistrarCobro?: (row: ServicioRow) => void,
): ColumnDef<ServicioRow>[] {
  return [
    {
      accessorKey: "razonSocial",
      header: "Cliente",
      cell: ({ row }) => (
        <Link
          href={`/clientes/${row.original.persona.id}`}
          className="font-medium hover:underline"
        >
          {row.original.persona.razonSocial}
        </Link>
      ),
    },
    {
      id: "tipo",
      header: "Tipo",
      cell: ({ row }) => {
        const cfg = CATEGORIA_BADGE[row.original.tipoServicio.categoria];
        return (
          <Badge className={cfg.className}>
            {row.original.tipoServicio.nombre}
          </Badge>
        );
      },
    },
    {
      accessorKey: "periodo",
      header: "Periodo",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {formatPeriodo(row.original.periodo)}
        </span>
      ),
    },
    {
      accessorKey: "honorarios",
      header: "Honorarios",
      cell: ({ row }) => (
        <span className="font-mono text-sm">
          {formatCurrency(row.original.honorarios)}
        </span>
      ),
    },
    {
      accessorKey: "montoCobrado",
      header: "Cobrado",
      cell: ({ row }) => {
        const isFull =
          row.original.montoCobrado >= row.original.precioFinal &&
          row.original.precioFinal > 0;
        return (
          <span
            className={`font-mono text-sm ${isFull ? "text-emerald-600 dark:text-emerald-400" : ""}`}
          >
            {formatCurrency(row.original.montoCobrado)}
          </span>
        );
      },
    },
    {
      accessorKey: "montoRestante",
      header: "Restante",
      cell: ({ row }) => {
        const hasRestante = row.original.montoRestante > 0;
        return (
          <span
            className={`font-mono text-sm ${hasRestante ? "text-red-600 dark:text-red-400" : "text-muted-foreground"}`}
          >
            {formatCurrency(row.original.montoRestante)}
          </span>
        );
      },
    },
    {
      id: "estadoCobranza",
      header: "Estado Cobranza",
      cell: ({ row }) => {
        const cfg = COBRANZA_BADGE[row.original.estadoCobranza];
        return <Badge className={cfg.className}>{cfg.label}</Badge>;
      },
    },
    {
      id: "contador",
      header: "Contador",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {row.original.contador.nombre} {row.original.contador.apellido}
        </span>
      ),
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <ServicioActions
          row={row.original}
          canArchivar={canArchivar}
          showDesarchivar={showDesarchivar}
          onRegistrarCobro={onRegistrarCobro}
        />
      ),
    },
  ];
}

interface ServicioTableProps {
  data: ServicioRow[];
  canArchivar?: boolean;
  showDesarchivar?: boolean;
  onRegistrarCobro?: (row: ServicioRow) => void;
}

export function ServicioTable({
  data,
  canArchivar = false,
  showDesarchivar = false,
  onRegistrarCobro,
}: ServicioTableProps) {
  const columns = React.useMemo(
    () => buildColumns(canArchivar, showDesarchivar, onRegistrarCobro),
    [canArchivar, showDesarchivar, onRegistrarCobro],
  );

  return (
    <DataTable
      columns={columns}
      data={data}
      searchKey="razonSocial"
      searchPlaceholder="Buscar por cliente..."
      emptyMessage="No se encontraron servicios."
    />
  );
}

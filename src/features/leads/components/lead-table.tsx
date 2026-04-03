"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { ColumnDef } from "@tanstack/react-table";
import type { EstadoLead, Regimen } from "@prisma/client";

import { DataTable } from "@/components/data-table/data-table";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/format";
import { deleteLeadAction } from "@/features/leads/actions";
import { EstadoBadge } from "./lead-pipeline";

export interface LeadRow {
  id: string;
  nombre: string;
  apellido: string;
  celular: string;
  estado: EstadoLead;
  regimen: Regimen | null;
  rubro: string | null;
  asignadoA: { id: string; nombre: string; apellido: string } | null;
  createdAt: Date | string;
}

const REGIMEN_LABEL: Record<Regimen, string> = {
  MYPE: "MYPE",
  RER: "RER",
  REG: "Régimen General",
};

function ActionsCell({ lead }: { lead: LeadRow }) {
  const router = useRouter();
  const [confirmOpen, setConfirmOpen] = React.useState(false);

  async function handleDelete() {
    const result = await deleteLeadAction(lead.id);
    if (result.error) {
      toast.error(typeof result.error === "string" ? result.error : "Error al eliminar");
    } else {
      toast.success("Prospecto eliminado");
      router.refresh();
    }
  }

  return (
    <div className="flex items-center gap-1">
      <Link href={`/prospectos/${lead.id}`} className="text-xs text-muted-foreground hover:text-primary transition-colors px-2 py-1">
        Ver
      </Link>
      <button
        type="button"
        onClick={() => setConfirmOpen(true)}
        className="text-xs text-destructive hover:underline px-2 py-1"
      >
        Eliminar
      </button>
      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Eliminar prospecto"
        description={`¿Seguro que querés eliminar a ${lead.nombre} ${lead.apellido}?`}
        confirmLabel="Eliminar"
        variant="destructive"
        onConfirm={handleDelete}
      />
    </div>
  );
}

const columns: ColumnDef<LeadRow>[] = [
  {
    id: "nombreCompleto",
    header: "Nombre",
    accessorFn: (row) => `${row.nombre} ${row.apellido}`,
    cell: ({ row }) => (
      <Link
        href={`/prospectos/${row.original.id}`}
        className="font-medium hover:underline"
      >
        {row.original.nombre} {row.original.apellido}
      </Link>
    ),
  },
  {
    accessorKey: "celular",
    header: "Celular",
  },
  {
    accessorKey: "estado",
    header: "Estado",
    cell: ({ row }) => <EstadoBadge estado={row.original.estado} />,
  },
  {
    accessorKey: "regimen",
    header: "Régimen",
    cell: ({ row }) =>
      row.original.regimen ? (
        <Badge variant="outline">{REGIMEN_LABEL[row.original.regimen]}</Badge>
      ) : (
        <span className="text-muted-foreground text-xs">—</span>
      ),
  },
  {
    accessorKey: "rubro",
    header: "Rubro",
    cell: ({ row }) => (
      <span className="text-sm">
        {row.original.rubro ?? <span className="text-muted-foreground">—</span>}
      </span>
    ),
  },
  {
    id: "asignadoA",
    header: "Asignado a",
    accessorFn: (row) =>
      row.asignadoA
        ? `${row.asignadoA.nombre} ${row.asignadoA.apellido}`
        : "",
    cell: ({ row }) =>
      row.original.asignadoA ? (
        <span className="text-sm">
          {row.original.asignadoA.nombre} {row.original.asignadoA.apellido}
        </span>
      ) : (
        <span className="text-muted-foreground text-xs">Sin asignar</span>
      ),
  },
  {
    accessorKey: "createdAt",
    header: "Fecha",
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground">
        {formatDate(row.original.createdAt)}
      </span>
    ),
  },
  {
    id: "actions",
    header: "",
    cell: ({ row }) => <ActionsCell lead={row.original} />,
  },
];

interface LeadTableProps {
  data: LeadRow[];
}

export function LeadTable({ data }: LeadTableProps) {
  return (
    <DataTable
      columns={columns}
      data={data}
      searchKey="nombreCompleto"
      searchPlaceholder="Buscar prospecto..."
      emptyMessage="No hay prospectos para mostrar."
    />
  );
}

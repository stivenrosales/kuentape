"use client";

import * as React from "react";
import { ColumnDef } from "@tanstack/react-table";
import { PlusIcon, PencilIcon } from "lucide-react";

import { DataTable } from "@/components/data-table/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { toggleCuentaActivaAction } from "./actions";
import { CuentaBancariaForm } from "./cuenta-bancaria-form";

const TIPO_LABELS: Record<string, string> = {
  CORRIENTE: "Corriente",
  AHORROS: "Ahorros",
  EFECTIVO: "Efectivo",
  DIGITAL: "Digital",
};

export interface CuentaBancariaRow {
  id: string;
  nombre: string;
  banco: string;
  tipo: string;
  activo: boolean;
  orden: number;
  _count: { finanzas: number };
}

interface CuentasBancariasClientProps {
  data: CuentaBancariaRow[];
}

export function CuentasBancariasClient({ data }: CuentasBancariasClientProps) {
  const [formOpen, setFormOpen] = React.useState(false);
  const [editRow, setEditRow] = React.useState<CuentaBancariaRow | null>(null);

  function handleEdit(row: CuentaBancariaRow) {
    setEditRow(row);
    setFormOpen(true);
  }

  function handleCloseForm(open: boolean) {
    setFormOpen(open);
    if (!open) setEditRow(null);
  }

  async function handleToggleActivo(row: CuentaBancariaRow) {
    await toggleCuentaActivaAction(row.id, !row.activo);
  }

  const columns: ColumnDef<CuentaBancariaRow>[] = [
    {
      accessorKey: "nombre",
      header: "Nombre",
      cell: ({ row }) => (
        <div>
          <p className="font-medium text-sm">{row.getValue("nombre")}</p>
          <p className="text-xs text-muted-foreground">{row.original.banco}</p>
        </div>
      ),
    },
    {
      accessorKey: "tipo",
      header: "Tipo",
      cell: ({ row }) => (
        <Badge variant="secondary">
          {TIPO_LABELS[row.getValue<string>("tipo")] ?? row.getValue("tipo")}
        </Badge>
      ),
    },
    {
      accessorKey: "orden",
      header: "Orden",
      cell: ({ row }) => (
        <span className="font-mono text-sm text-muted-foreground">
          {row.getValue("orden")}
        </span>
      ),
    },
    {
      id: "finanzas",
      header: "Transacciones",
      cell: ({ row }) => (
        <span className="font-mono text-sm text-muted-foreground">
          {row.original._count.finanzas}
        </span>
      ),
    },
    {
      accessorKey: "activo",
      header: "Activo",
      cell: ({ row }) => (
        <Switch
          checked={row.getValue<boolean>("activo")}
          onCheckedChange={() => handleToggleActivo(row.original)}
          aria-label={`${row.getValue<boolean>("activo") ? "Desactivar" : "Activar"} cuenta`}
        />
      ),
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => handleEdit(row.original)}
          aria-label="Editar cuenta"
        >
          <PencilIcon className="size-4" />
        </Button>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <Button onClick={() => setFormOpen(true)} size="sm">
          <PlusIcon className="mr-1.5 size-4" />
          Nueva cuenta
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={data}
        searchKey="nombre"
        searchPlaceholder="Buscar cuenta..."
        emptyMessage="No hay cuentas bancarias registradas."
      />

      <CuentaBancariaForm
        open={formOpen}
        onOpenChange={handleCloseForm}
        editId={editRow?.id}
        defaultValues={
          editRow
            ? {
                nombre: editRow.nombre,
                banco: editRow.banco,
                tipo: editRow.tipo as any,
                activo: editRow.activo,
                orden: editRow.orden,
              }
            : undefined
        }
      />
    </div>
  );
}

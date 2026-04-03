"use client";

import * as React from "react";
import { ColumnDef } from "@tanstack/react-table";
import { Pencil } from "lucide-react";
import { toast } from "sonner";

import { DataTable } from "@/components/data-table/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { toggleTipoServicioActivoAction } from "@/features/servicios/actions";
import type { CategoriaServicio } from "@prisma/client";

export interface TipoServicioRow {
  id: string;
  nombre: string;
  categoria: CategoriaServicio;
  requierePeriodo: boolean;
  activo: boolean;
  orden: number;
}

const CATEGORIA_BADGE: Record<CategoriaServicio, { label: string; className: string }> = {
  MENSUAL: {
    label: "Mensual",
    className:
      "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border-transparent",
  },
  ANUAL: {
    label: "Anual",
    className:
      "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 border-transparent",
  },
  TRAMITE: {
    label: "Trámite",
    className:
      "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 border-transparent",
  },
  ASESORIA: {
    label: "Asesoría",
    className:
      "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300 border-transparent",
  },
  CONSTITUCION: {
    label: "Constitución",
    className:
      "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300 border-transparent",
  },
  REGULARIZACION: {
    label: "Regularización",
    className:
      "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300 border-transparent",
  },
  MODIF_ESTATUTO: {
    label: "Modif. Estatuto",
    className:
      "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 border-transparent",
  },
  OTROS: {
    label: "Otros",
    className:
      "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 border-transparent",
  },
};

interface ActivoToggleProps {
  id: string;
  activo: boolean;
}

function ActivoToggle({ id, activo }: ActivoToggleProps) {
  const [loading, setLoading] = React.useState(false);

  async function handleToggle(newValue: boolean) {
    setLoading(true);
    try {
      const result = await toggleTipoServicioActivoAction(id, newValue);
      if (!result.success) toast.error("Error al actualizar");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Switch
      checked={activo}
      onCheckedChange={handleToggle}
      disabled={loading}
      aria-label="Activo"
    />
  );
}

function buildColumns(
  onEdit: (row: TipoServicioRow) => void,
): ColumnDef<TipoServicioRow>[] {
  return [
    {
      accessorKey: "orden",
      header: "#",
      cell: ({ row }) => (
        <span className="font-mono text-sm text-muted-foreground">
          {row.original.orden}
        </span>
      ),
    },
    {
      accessorKey: "nombre",
      header: "Nombre",
      cell: ({ row }) => (
        <span className="font-medium">{row.original.nombre}</span>
      ),
    },
    {
      accessorKey: "categoria",
      header: "Categoría",
      cell: ({ row }) => {
        const cfg = CATEGORIA_BADGE[row.original.categoria];
        return <Badge className={cfg.className}>{cfg.label}</Badge>;
      },
    },
    {
      accessorKey: "requierePeriodo",
      header: "Requiere Periodo",
      cell: ({ row }) => (
        <span className="text-sm">
          {row.original.requierePeriodo ? "Sí" : "No"}
        </span>
      ),
    },
    {
      accessorKey: "activo",
      header: "Activo",
      cell: ({ row }) => (
        <ActivoToggle id={row.original.id} activo={row.original.activo} />
      ),
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0"
          onClick={() => onEdit(row.original)}
          title="Editar"
        >
          <Pencil className="size-3.5" />
          <span className="sr-only">Editar</span>
        </Button>
      ),
    },
  ];
}

interface TipoServicioTableProps {
  data: TipoServicioRow[];
  onEdit: (row: TipoServicioRow) => void;
}

export function TipoServicioTable({ data, onEdit }: TipoServicioTableProps) {
  const columns = React.useMemo(() => buildColumns(onEdit), [onEdit]);

  return (
    <DataTable
      columns={columns}
      data={data}
      searchKey="nombre"
      searchPlaceholder="Buscar tipo de servicio..."
      emptyMessage="No se encontraron tipos de servicio."
    />
  );
}

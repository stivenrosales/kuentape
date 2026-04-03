"use client";

import * as React from "react";
import { ColumnDef } from "@tanstack/react-table";
import { Star, FileCheck, Upload } from "lucide-react";
import { toast } from "sonner";

import { DataTable } from "@/components/data-table/data-table";
import { Button } from "@/components/ui/button";
import { toggleLibroCompletadoAction } from "@/features/libros/actions";

const MESES = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

export interface LibroRow {
  id: string;
  tipoLibro: string;
  anio: number;
  mes: number;
  completado: boolean;
  constanciaUrl: string | null;
  persona: {
    id: string;
    razonSocial: string;
    contadorAsignado: { id: string; nombre: string; apellido: string };
  };
}

function ToggleCompletadoButton({ row }: { row: LibroRow }) {
  const [loading, setLoading] = React.useState(false);
  const [completado, setCompletado] = React.useState(row.completado);

  async function handleToggle() {
    setLoading(true);
    try {
      const result = await toggleLibroCompletadoAction(row.id);
      if ("error" in result && result.error) {
        toast.error("Error al actualizar el libro");
      } else {
        setCompletado((prev) => !prev);
        toast.success(
          completado ? "Libro marcado como pendiente" : "Libro marcado como completado",
        );
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      className="h-7 w-7 p-0"
      onClick={handleToggle}
      disabled={loading}
      title={completado ? "Marcar como pendiente" : "Marcar como completado"}
    >
      <Star
        className={`size-4 ${completado ? "fill-emerald-500 text-emerald-500" : "text-muted-foreground"}`}
      />
      <span className="sr-only">
        {completado ? "Marcar como pendiente" : "Marcar como completado"}
      </span>
    </Button>
  );
}

function buildColumns(): ColumnDef<LibroRow>[] {
  return [
    {
      id: "completado",
      header: "Estado",
      cell: ({ row }) => <ToggleCompletadoButton row={row.original} />,
    },
    {
      id: "empresa",
      header: "Empresa",
      cell: ({ row }) => (
        <span className="text-sm font-medium">
          {row.original.persona.razonSocial}
        </span>
      ),
    },
    {
      accessorKey: "tipoLibro",
      header: "Tipo de Libro",
      cell: ({ row }) => (
        <span className="text-sm">{row.original.tipoLibro}</span>
      ),
    },
    {
      accessorKey: "anio",
      header: "Año",
      cell: ({ row }) => (
        <span className="text-sm font-mono">{row.original.anio}</span>
      ),
    },
    {
      id: "mes",
      header: "Mes",
      cell: ({ row }) => (
        <span className="text-sm">
          {MESES[row.original.mes - 1] ?? row.original.mes}
        </span>
      ),
    },
    {
      id: "contador",
      header: "Responsable",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {row.original.persona.contadorAsignado.nombre}{" "}
          {row.original.persona.contadorAsignado.apellido}
        </span>
      ),
    },
    {
      id: "constancia",
      header: "Constancia",
      cell: ({ row }) =>
        row.original.constanciaUrl ? (
          <a
            href={row.original.constanciaUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-sm text-emerald-600 hover:underline"
          >
            <FileCheck className="size-3.5" />
            <span>Ver</span>
          </a>
        ) : (
          <span className="flex items-center gap-1 text-sm text-muted-foreground">
            <Upload className="size-3.5" />
            <span>Sin constancia</span>
          </span>
        ),
    },
  ];
}

interface LibrosTableProps {
  data: LibroRow[];
}

export function LibrosTable({ data }: LibrosTableProps) {
  const columns = React.useMemo(() => buildColumns(), []);

  return (
    <DataTable
      columns={columns}
      data={data}
      searchKey="tipoLibro"
      searchPlaceholder="Buscar por tipo..."
      emptyMessage="No se encontraron libros contables."
    />
  );
}

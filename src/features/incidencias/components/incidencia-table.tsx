"use client";

import * as React from "react";
import Link from "next/link";
import { ColumnDef } from "@tanstack/react-table";
import { Eye, RefreshCw, Paperclip } from "lucide-react";
import { toast } from "sonner";

import { DataTable } from "@/components/data-table/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatDate } from "@/lib/format";
import { updateIncidenciaEstadoAction } from "@/features/incidencias/actions";
import type { Prioridad, EstadoIncidencia } from "@prisma/client";

export interface IncidenciaRow {
  id: string;
  titulo: string;
  descripcion: string;
  detalleFinanciero: string | null;
  prioridad: Prioridad;
  estado: EstadoIncidencia;
  periodo: string | null;
  createdAt: Date;
  persona: { id: string; razonSocial: string };
  contador: { id: string; nombre: string; apellido: string };
  _count: { adjuntos: number };
}

const PRIORIDAD_BADGE: Record<Prioridad, { label: string; className: string }> =
  {
    ALTA: {
      label: "Alta",
      className:
        "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 border-transparent",
    },
    MEDIA: {
      label: "Media",
      className:
        "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 border-transparent",
    },
    BAJA: {
      label: "Baja",
      className:
        "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border-transparent",
    },
  };

const ESTADO_BADGE: Record<
  EstadoIncidencia,
  { label: string; className: string }
> = {
  ABIERTA: {
    label: "Abierta",
    className:
      "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border-transparent",
  },
  EN_PROGRESO: {
    label: "En Progreso",
    className:
      "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 border-transparent",
  },
  RESUELTA: {
    label: "Resuelta",
    className:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 border-transparent",
  },
  CERRADA: {
    label: "Cerrada",
    className:
      "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 border-transparent",
  },
};

const ESTADOS: EstadoIncidencia[] = ["ABIERTA", "EN_PROGRESO", "RESUELTA", "CERRADA"];

function CambiarEstadoDialog({
  incidencia,
  open,
  onOpenChange,
}: {
  incidencia: IncidenciaRow;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [estado, setEstado] = React.useState<EstadoIncidencia>(
    incidencia.estado,
  );
  const [loading, setLoading] = React.useState(false);

  async function handleSave() {
    if (estado === incidencia.estado) {
      onOpenChange(false);
      return;
    }
    setLoading(true);
    try {
      const result = await updateIncidenciaEstadoAction(incidencia.id, estado);
      if ("error" in result && result.error) {
        toast.error("Error al cambiar el estado");
      } else {
        toast.success("Estado actualizado");
        onOpenChange(false);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Cambiar Estado</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground truncate">{incidencia.titulo}</p>
        <Select
          value={estado}
          onValueChange={(v) => setEstado(v as EstadoIncidencia)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ESTADOS.map((e) => (
              <SelectItem key={e} value={e}>
                {ESTADO_BADGE[e].label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? "Guardando..." : "Guardar"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function IncidenciaActions({ row }: { row: IncidenciaRow }) {
  const [estadoOpen, setEstadoOpen] = React.useState(false);

  return (
    <div className="flex items-center gap-1">
      <Button
        variant="ghost"
        size="sm"
        className="h-7 w-7 p-0"
        render={<Link href={`/incidencias/${row.id}`} title="Ver detalle" />}
      >
        <Eye className="size-3.5" />
        <span className="sr-only">Ver detalle</span>
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className="h-7 w-7 p-0"
        onClick={() => setEstadoOpen(true)}
        title="Cambiar estado"
      >
        <RefreshCw className="size-3.5" />
        <span className="sr-only">Cambiar estado</span>
      </Button>
      <CambiarEstadoDialog
        incidencia={row}
        open={estadoOpen}
        onOpenChange={setEstadoOpen}
      />
    </div>
  );
}

const columns: ColumnDef<IncidenciaRow>[] = [
  {
    id: "prioridad",
    header: "Prioridad",
    cell: ({ row }) => {
      const cfg = PRIORIDAD_BADGE[row.original.prioridad];
      return <Badge className={cfg.className}>{cfg.label}</Badge>;
    },
  },
  {
    accessorKey: "titulo",
    header: "Título",
    cell: ({ row }) => (
      <span className="line-clamp-1 max-w-[200px] font-medium">
        {row.original.titulo}
      </span>
    ),
  },
  {
    id: "empresa",
    header: "Empresa",
    cell: ({ row }) => (
      <span className="text-sm">{row.original.persona.razonSocial}</span>
    ),
  },
  {
    id: "detalleFinanciero",
    header: "Detalle Financiero",
    cell: ({ row }) =>
      row.original.detalleFinanciero ? (
        <span className="line-clamp-1 max-w-[180px] text-sm text-muted-foreground">
          {row.original.detalleFinanciero}
        </span>
      ) : (
        <span className="text-muted-foreground">—</span>
      ),
  },
  {
    id: "estado",
    header: "Estado",
    cell: ({ row }) => {
      const cfg = ESTADO_BADGE[row.original.estado];
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
    accessorKey: "periodo",
    header: "Periodo",
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground">
        {row.original.periodo ?? "—"}
      </span>
    ),
  },
  {
    id: "adjuntos",
    header: "Adj.",
    cell: ({ row }) =>
      row.original._count.adjuntos > 0 ? (
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <Paperclip className="size-3.5" />
          <span>{row.original._count.adjuntos}</span>
        </div>
      ) : null,
  },
  {
    id: "fecha",
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
    cell: ({ row }) => <IncidenciaActions row={row.original} />,
  },
];

interface IncidenciaTableProps {
  data: IncidenciaRow[];
}

export function IncidenciaTable({ data }: IncidenciaTableProps) {
  return (
    <DataTable
      columns={columns}
      data={data}
      searchKey="titulo"
      searchPlaceholder="Buscar por título..."
      emptyMessage="No se encontraron incidencias."
    />
  );
}

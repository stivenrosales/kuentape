"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ArrowUp, ArrowDown, ArrowUpDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/format";
import type { Prioridad, EstadoIncidencia } from "@prisma/client";
import { ContextMenuRow } from "@/components/context-menu-row";
import { updateIncidenciaEstadoAction } from "@/features/incidencias/actions";
import { IncidenciaDetailDialog } from "./incidencia-detail-dialog";
import { cn } from "@/lib/utils";

export interface IncidenciaSimpleRow {
  id: string;
  titulo: string;
  prioridad: Prioridad;
  estado: EstadoIncidencia;
  createdAt: Date;
  persona: { id: string; razonSocial: string };
  contador: { id: string; nombre: string; apellido: string };
  _count: { adjuntos: number };
}

const PRIORIDAD_BADGE: Record<Prioridad, { label: string; className: string }> = {
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

const ESTADO_BADGE: Record<EstadoIncidencia, { label: string; className: string }> = {
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

// Prioridad sort order: ALTA > MEDIA > BAJA
const PRIORIDAD_ORDER: Record<Prioridad, number> = { ALTA: 0, MEDIA: 1, BAJA: 2 };

interface IncidenciaTableSimpleProps {
  data: IncidenciaSimpleRow[];
}

type SortKey = "prioridad" | "titulo" | "empresa" | "estado" | "contador" | "fecha";
type SortDir = "asc" | "desc";

function SortableHeader({
  label,
  sortKey,
  currentKey,
  currentDir,
  onSort,
}: {
  label: string;
  sortKey: SortKey;
  currentKey: SortKey;
  currentDir: SortDir;
  onSort: (key: SortKey) => void;
}) {
  const isActive = currentKey === sortKey;
  return (
    <th
      className={cn(
        "px-3 py-2.5 text-left text-[10px] uppercase tracking-wider font-medium cursor-pointer select-none transition-colors hover:text-foreground align-middle",
        isActive ? "text-foreground" : "text-muted-foreground"
      )}
      onClick={() => onSort(sortKey)}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        {isActive ? (
          currentDir === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
        ) : (
          <ArrowUpDown className="h-3 w-3 opacity-30" />
        )}
      </span>
    </th>
  );
}

export function IncidenciaTableSimple({ data }: IncidenciaTableSimpleProps) {
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const router = useRouter();

  const [sortKey, setSortKey] = React.useState<SortKey>("fecha");
  const [sortDir, setSortDir] = React.useState<SortDir>("desc");

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  function sortItems(items: IncidenciaSimpleRow[]): IncidenciaSimpleRow[] {
    return [...items].sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case "prioridad": cmp = PRIORIDAD_ORDER[a.prioridad] - PRIORIDAD_ORDER[b.prioridad]; break;
        case "titulo": cmp = a.titulo.localeCompare(b.titulo); break;
        case "empresa": cmp = a.persona.razonSocial.localeCompare(b.persona.razonSocial); break;
        case "estado": cmp = a.estado.localeCompare(b.estado); break;
        case "contador":
          cmp = `${a.contador.nombre} ${a.contador.apellido}`.localeCompare(
            `${b.contador.nombre} ${b.contador.apellido}`
          );
          break;
        case "fecha": cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(); break;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
  }

  const sorted = sortItems(data);

  return (
    <>
    <div className="rounded-lg border border-border bg-card shadow-sm overflow-hidden">
      <table className="w-full border-collapse" style={{ tableLayout: "fixed" }}>
        <colgroup>
          <col style={{ width: "8%" }} />
          <col style={{ width: "30%" }} />
          <col style={{ width: "24%" }} />
          <col style={{ width: "13%" }} />
          <col style={{ width: "13%" }} />
          <col style={{ width: "12%" }} />
        </colgroup>
        <thead>
          <tr className="border-b border-border bg-muted/50">
            <SortableHeader label="Prior." sortKey="prioridad" currentKey={sortKey} currentDir={sortDir} onSort={handleSort} />
            <SortableHeader label="Título" sortKey="titulo" currentKey={sortKey} currentDir={sortDir} onSort={handleSort} />
            <SortableHeader label="Empresa" sortKey="empresa" currentKey={sortKey} currentDir={sortDir} onSort={handleSort} />
            <SortableHeader label="Estado" sortKey="estado" currentKey={sortKey} currentDir={sortDir} onSort={handleSort} />
            <SortableHeader label="Contador" sortKey="contador" currentKey={sortKey} currentDir={sortDir} onSort={handleSort} />
            <SortableHeader label="Fecha" sortKey="fecha" currentKey={sortKey} currentDir={sortDir} onSort={handleSort} />
          </tr>
        </thead>
        <tbody className="divide-y divide-border/50">
          {sorted.length === 0 ? (
            <tr>
              <td colSpan={6} className="py-12 text-center text-sm text-muted-foreground">
                No se encontraron incidencias.
              </td>
            </tr>
          ) : (
            sorted.map((row, i) => (
              <ContextMenuRow
                key={row.id}
                onClick={() => setSelectedId(row.id)}
                className={`cursor-pointer transition-colors hover:bg-primary/5 ${
                  i % 2 === 0 ? "bg-muted/10" : "bg-background"
                }`}
                deleteLabel="Cerrar"
                confirmMessage={`¿Cerrar la incidencia "${row.titulo}"?`}
                onDelete={async () => {
                  await updateIncidenciaEstadoAction(row.id, "CERRADA");
                  router.refresh();
                }}
              >
                <td className="px-3 py-2">
                  <Badge className={`text-[10px] ${PRIORIDAD_BADGE[row.prioridad].className}`}>
                    {PRIORIDAD_BADGE[row.prioridad].label}
                  </Badge>
                </td>
                <td className="px-3 py-2 text-xs font-medium truncate">
                  {row.titulo}
                </td>
                <td className="px-3 py-2 text-xs text-muted-foreground truncate">
                  {row.persona.razonSocial}
                </td>
                <td className="px-3 py-2">
                  <Badge className={`text-[10px] ${ESTADO_BADGE[row.estado].className}`}>
                    {ESTADO_BADGE[row.estado].label}
                  </Badge>
                </td>
                <td className="px-3 py-2 text-xs text-muted-foreground truncate">
                  {row.contador.nombre} {row.contador.apellido}
                </td>
                <td className="px-3 py-2 text-xs text-muted-foreground whitespace-nowrap">
                  {formatDate(row.createdAt)}
                </td>
              </ContextMenuRow>
            ))
          )}
        </tbody>
      </table>
    </div>

    {selectedId && (
      <IncidenciaDetailDialog
        incidenciaId={selectedId}
        onClose={() => setSelectedId(null)}
      />
    )}
    </>
  );
}

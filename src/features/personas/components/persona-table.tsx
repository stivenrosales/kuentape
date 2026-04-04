"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ArrowUp, ArrowDown, ArrowUpDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { TipoPersona, Regimen, EstadoPersona } from "@prisma/client";
import { ContextMenuRow } from "@/components/context-menu-row";
import { updatePersonaEstadoAction } from "@/features/personas/actions";
import { ClienteDetailDialog } from "./cliente-detail-dialog";
import { cn } from "@/lib/utils";

export interface PersonaRow {
  id: string;
  razonSocial: string;
  ruc: string;
  tipoPersona: TipoPersona;
  regimen: Regimen;
  estado: EstadoPersona;
  contadorAsignado: {
    nombre: string;
    apellido: string;
  };
  _count: {
    servicios: number;
    incidencias: number;
  };
}

const TIPO_BADGE: Record<TipoPersona, { label: string; className: string }> = {
  JURIDICA: { label: "Jurídica", className: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border-transparent" },
  NATURAL: { label: "Natural", className: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 border-transparent" },
  IMMUNOTEC: { label: "Immunotec", className: "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300 border-transparent" },
  FOUR_LIFE: { label: "4Life", className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 border-transparent" },
  RXH: { label: "RXH", className: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 border-transparent" },
};

const ESTADO_BADGE: Record<EstadoPersona, { label: string; className: string }> = {
  ACTIVO: { label: "Activo", className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 border-transparent" },
  INACTIVO: { label: "Inactivo", className: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 border-transparent" },
  ARCHIVADO: { label: "Archivado", className: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 border-transparent" },
};

interface PersonaTableProps {
  data: PersonaRow[];
  total?: number;
  page?: number;
  pageSize?: number;
}

type SortKey = "razonSocial" | "ruc" | "tipoPersona" | "regimen" | "estado" | "contador";
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

export function PersonaTable({ data, total = 0, page = 1, pageSize = 25 }: PersonaTableProps) {
  const router = useRouter();
  const totalPages = Math.ceil(total / pageSize);

  const [sortKey, setSortKey] = React.useState<SortKey>("razonSocial");
  const [sortDir, setSortDir] = React.useState<SortDir>("asc");
  const [selectedId, setSelectedId] = React.useState<string | null>(null);

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  function sortItems(items: PersonaRow[]): PersonaRow[] {
    return [...items].sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case "razonSocial": cmp = a.razonSocial.localeCompare(b.razonSocial); break;
        case "ruc": cmp = a.ruc.localeCompare(b.ruc); break;
        case "tipoPersona": cmp = a.tipoPersona.localeCompare(b.tipoPersona); break;
        case "regimen": cmp = a.regimen.localeCompare(b.regimen); break;
        case "estado": cmp = a.estado.localeCompare(b.estado); break;
        case "contador":
          cmp = `${a.contadorAsignado.nombre} ${a.contadorAsignado.apellido}`.localeCompare(
            `${b.contadorAsignado.nombre} ${b.contadorAsignado.apellido}`
          );
          break;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
  }

  function goToPage(p: number) {
    const params = new URLSearchParams(window.location.search);
    params.set("page", String(p));
    router.push(`?${params.toString()}`);
  }

  const sorted = sortItems(data);

  return (
    <>
    <div className="rounded-lg border border-border bg-card shadow-sm overflow-hidden">
      <table className="w-full text-sm border-collapse" style={{ tableLayout: "fixed" }}>
        <colgroup><col style={{ width: "35%" }} /><col style={{ width: "15%" }} /><col style={{ width: "12%" }} /><col style={{ width: "12%" }} /><col style={{ width: "10%" }} /><col style={{ width: "16%" }} /></colgroup>
        <thead>
          <tr className="border-b border-border bg-muted/50">
            <SortableHeader label="Empresa" sortKey="razonSocial" currentKey={sortKey} currentDir={sortDir} onSort={handleSort} />
            <SortableHeader label="RUC" sortKey="ruc" currentKey={sortKey} currentDir={sortDir} onSort={handleSort} />
            <SortableHeader label="Tipo" sortKey="tipoPersona" currentKey={sortKey} currentDir={sortDir} onSort={handleSort} />
            <SortableHeader label="Régimen" sortKey="regimen" currentKey={sortKey} currentDir={sortDir} onSort={handleSort} />
            <SortableHeader label="Estado" sortKey="estado" currentKey={sortKey} currentDir={sortDir} onSort={handleSort} />
            <SortableHeader label="Contador" sortKey="contador" currentKey={sortKey} currentDir={sortDir} onSort={handleSort} />
          </tr>
        </thead>
        <tbody className="divide-y divide-border/50">
          {sorted.length === 0 ? (
            <tr>
              <td colSpan={6} className="py-12 text-center text-sm text-muted-foreground">
                No se encontraron clientes.
              </td>
            </tr>
          ) : (
            sorted.map((row, i) => (
              <ContextMenuRow
                key={row.id}
                onClick={() => setSelectedId(row.id)}
                className={`cursor-pointer transition-colors hover:bg-primary/5 ${i % 2 === 0 ? "bg-muted/10" : "bg-background"}`}
                deleteLabel="Archivar"
                confirmMessage={`¿Seguro que querés archivar a "${row.razonSocial}"?`}
                onDelete={async () => {
                  await updatePersonaEstadoAction(row.id, "ARCHIVADO");
                  router.refresh();
                }}
              >
                <td className="px-3 py-2 text-xs font-medium truncate">{row.razonSocial}</td>
                <td className="px-3 py-2 font-mono text-xs">{row.ruc}</td>
                <td className="px-3 py-2">
                  <Badge className={`text-[10px] ${TIPO_BADGE[row.tipoPersona].className}`}>{TIPO_BADGE[row.tipoPersona].label}</Badge>
                </td>
                <td className="px-3 py-2">
                  <Badge variant="outline" className="text-[10px]">{row.regimen}</Badge>
                </td>
                <td className="px-3 py-2">
                  <Badge className={`text-[10px] ${ESTADO_BADGE[row.estado].className}`}>{ESTADO_BADGE[row.estado].label}</Badge>
                </td>
                <td className="px-3 py-2 text-xs text-muted-foreground truncate">
                  {row.contadorAsignado.nombre} {row.contadorAsignado.apellido}
                </td>
              </ContextMenuRow>
            ))
          )}
        </tbody>
      </table>
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-3 py-2 border-t border-border text-xs text-muted-foreground">
          <span>Página {page} de {totalPages} ({total} registros)</span>
          <div className="flex items-center gap-1">
            <button onClick={() => goToPage(1)} disabled={page <= 1} className="px-2 py-1 rounded hover:bg-muted disabled:opacity-30">«</button>
            <button onClick={() => goToPage(page - 1)} disabled={page <= 1} className="px-2 py-1 rounded hover:bg-muted disabled:opacity-30">‹</button>
            <button onClick={() => goToPage(page + 1)} disabled={page >= totalPages} className="px-2 py-1 rounded hover:bg-muted disabled:opacity-30">›</button>
            <button onClick={() => goToPage(totalPages)} disabled={page >= totalPages} className="px-2 py-1 rounded hover:bg-muted disabled:opacity-30">»</button>
          </div>
        </div>
      )}
    </div>

    {selectedId && (
      <ClienteDetailDialog
        clienteId={selectedId}
        onClose={() => { setSelectedId(null); router.refresh(); }}
      />
    )}
    </>
  );
}

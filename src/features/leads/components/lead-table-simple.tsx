"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ArrowUp, ArrowDown, ArrowUpDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Loader2Icon } from "lucide-react";
import { ContextMenuRow } from "@/components/context-menu-row";
import { deleteLeadAction, getLeadDetailAction } from "@/features/leads/actions";
import { LeadDetailDialog } from "./lead-detail-dialog";
import { cn } from "@/lib/utils";
import type { LeadKanbanCard } from "../queries-kanban";

interface LeadRow {
  id: string;
  nombre: string;
  apellido: string;
  celular: string;
  estado: string;
  regimen: string | null;
  rubro: string | null;
  createdAt: string | Date;
  asignadoA: { nombre: string; apellido: string } | null;
}

const ESTADO_STYLE: Record<string, string> = {
  NUEVO: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border-transparent",
  CONTACTADO: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 border-transparent",
  COTIZADO: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 border-transparent",
  CONVERTIDO: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 border-transparent",
  PERDIDO: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 border-transparent",
};

const ESTADO_LABEL: Record<string, string> = {
  NUEVO: "Nuevo",
  CONTACTADO: "Contactado",
  COTIZADO: "Cotizado",
  CONVERTIDO: "Convertido",
  PERDIDO: "Perdido",
};

type SortKey = "nombre" | "celular" | "estado" | "regimen" | "rubro" | "fecha";
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

export function LeadTableSimple({ data, staff = [] }: { data: LeadRow[]; staff?: { id: string; nombre: string; apellido: string }[] }) {
  const router = useRouter();

  const [sortKey, setSortKey] = React.useState<SortKey>("nombre");
  const [sortDir, setSortDir] = React.useState<SortDir>("asc");
  const [selectedLead, setSelectedLead] = React.useState<LeadKanbanCard | null>(null);
  const [loadingId, setLoadingId] = React.useState<string | null>(null);

  async function handleRowClick(leadId: string) {
    setLoadingId(leadId);
    const lead = await getLeadDetailAction(leadId);
    setLoadingId(null);
    if (lead) setSelectedLead(lead as LeadKanbanCard);
  }

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  function sortItems(items: LeadRow[]): LeadRow[] {
    return [...items].sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case "nombre":
          cmp = `${a.nombre} ${a.apellido}`.localeCompare(`${b.nombre} ${b.apellido}`);
          break;
        case "celular": cmp = a.celular.localeCompare(b.celular); break;
        case "estado": cmp = a.estado.localeCompare(b.estado); break;
        case "regimen": cmp = (a.regimen ?? "").localeCompare(b.regimen ?? ""); break;
        case "rubro": cmp = (a.rubro ?? "").localeCompare(b.rubro ?? ""); break;
        case "fecha": cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(); break;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
  }

  const sorted = sortItems(data);

  return (
    <>
    <div className="rounded-lg border border-border bg-card shadow-sm overflow-hidden">
      <table className="w-full text-sm border-collapse" style={{ tableLayout: "fixed" }}>
        <colgroup><col style={{ width: "25%" }} /><col style={{ width: "13%" }} /><col style={{ width: "12%" }} /><col style={{ width: "10%" }} /><col style={{ width: "26%" }} /><col style={{ width: "14%" }} /></colgroup>
        <thead>
          <tr className="border-b border-border bg-muted/50">
            <SortableHeader label="Nombre" sortKey="nombre" currentKey={sortKey} currentDir={sortDir} onSort={handleSort} />
            <SortableHeader label="Celular" sortKey="celular" currentKey={sortKey} currentDir={sortDir} onSort={handleSort} />
            <SortableHeader label="Estado" sortKey="estado" currentKey={sortKey} currentDir={sortDir} onSort={handleSort} />
            <SortableHeader label="Régimen" sortKey="regimen" currentKey={sortKey} currentDir={sortDir} onSort={handleSort} />
            <SortableHeader label="Rubro" sortKey="rubro" currentKey={sortKey} currentDir={sortDir} onSort={handleSort} />
            <SortableHeader label="Fecha" sortKey="fecha" currentKey={sortKey} currentDir={sortDir} onSort={handleSort} />
          </tr>
        </thead>
        <tbody className="divide-y divide-border/50">
          {sorted.length === 0 ? (
            <tr>
              <td colSpan={6} className="py-12 text-center text-sm text-muted-foreground">
                No se encontraron prospectos.
              </td>
            </tr>
          ) : (
            sorted.map((lead, i) => (
              <ContextMenuRow
                key={lead.id}
                onClick={() => handleRowClick(lead.id)}
                className={`cursor-pointer transition-colors hover:bg-primary/5 ${i % 2 === 0 ? "bg-muted/10" : "bg-background"} ${lead.estado === "PERDIDO" ? "opacity-50" : ""}`}
                confirmMessage={`¿Seguro que querés eliminar a "${lead.nombre} ${lead.apellido}"?`}
                onDelete={async () => {
                  await deleteLeadAction(lead.id);
                  router.refresh();
                }}
              >
                <td className="px-3 py-2 text-xs font-medium truncate">{lead.nombre} {lead.apellido}</td>
                <td className="px-3 py-2 text-xs font-mono">{lead.celular}</td>
                <td className="px-3 py-2">
                  <Badge className={`text-[10px] ${ESTADO_STYLE[lead.estado] ?? ESTADO_STYLE.NUEVO}`}>
                    {ESTADO_LABEL[lead.estado] ?? lead.estado}
                  </Badge>
                </td>
                <td className="px-3 py-2">
                  {lead.regimen ? <Badge variant="outline" className="text-[10px]">{lead.regimen}</Badge> : <span className="text-xs text-muted-foreground">—</span>}
                </td>
                <td className="px-3 py-2 text-xs truncate">{lead.rubro ?? "—"}</td>
                <td className="px-3 py-2 text-xs text-muted-foreground">{new Date(lead.createdAt).toLocaleDateString("es-PE")}</td>
              </ContextMenuRow>
            ))
          )}
        </tbody>
      </table>
    </div>

    {selectedLead && (
      <LeadDetailDialog
        lead={selectedLead}
        staff={staff}
        onClose={() => { setSelectedLead(null); router.refresh(); }}
        onMove={async () => {}}
        onUpdated={(updated) => setSelectedLead(updated)}
        onConverted={() => { setSelectedLead(null); router.refresh(); }}
      />
    )}
    </>
  );
}

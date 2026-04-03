"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  ChevronDown,
  ChevronRight,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  Archive,
  Check,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/format";
import { declararServicioAction } from "@/features/servicios/actions-workflow";
import { archivarServicioAction } from "@/features/servicios/actions";
import { ServicioDetailDialog } from "@/features/servicios/components/servicio-detail-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import type { ServicioListItem } from "@/features/servicios/queries-list";
import type { ServiciosListStats } from "@/features/servicios/queries-list";
import { ESTADO_COBRANZA_LABELS, CATEGORIA_SERVICIO_LABELS } from "@/lib/constants";
import { ContextMenuRow } from "@/components/context-menu-row";

interface ServicioListEnhancedProps {
  servicios: ServicioListItem[];
  stats: ServiciosListStats;
  cuentas: { id: string; nombre: string; banco: string }[];
}

// ─── Color por categoría de servicio ─────────────────────────────────────────
const CATEGORIA_COLOR: Record<string, string> = {
  MENSUAL: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  ANUAL: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
  TRAMITE: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  ASESORIA: "bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300",
  CONSTITUCION: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300",
  REGULARIZACION: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300",
  MODIF_ESTATUTO: "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300",
  OTROS: "bg-gray-100 text-gray-700 dark:bg-gray-800/40 dark:text-gray-300",
};

// ─── Badge de estado cobranza ─────────────────────────────────────────────────
function EstadoBadge({ estado }: { estado: string }) {
  const styles: Record<string, string> = {
    PENDIENTE: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300",
    PARCIAL: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
    COBRADO: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
    INCOBRABLE: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium",
        styles[estado] ?? styles.PENDIENTE
      )}
    >
      {ESTADO_COBRANZA_LABELS[estado] ?? estado}
    </span>
  );
}

// ─── Checkbox de declarado ────────────────────────────────────────────────────
function DeclaradoCheckbox({
  servicioId,
  estadoTrabajo,
  onOptimisticUpdate,
}: {
  servicioId: string;
  estadoTrabajo: string;
  onOptimisticUpdate: (id: string) => void;
}) {
  const [loading, setLoading] = React.useState(false);
  const isDeclared = estadoTrabajo !== "POR_DECLARAR";

  async function handleClick(e: React.MouseEvent) {
    e.stopPropagation();
    if (isDeclared || loading) return;
    setLoading(true);
    onOptimisticUpdate(servicioId);
    const result = await declararServicioAction(servicioId);
    if (result?.error) {
      toast.error(result.error);
      // revert is handled by parent re-render from server
    } else {
      toast.success("Declarado");
    }
    setLoading(false);
  }

  if (isDeclared) {
    return (
      <div className="flex items-center justify-center w-5 h-5 rounded bg-primary text-primary-foreground shrink-0">
        <Check className="h-3 w-3" />
      </div>
    );
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className={cn(
        "flex items-center justify-center w-5 h-5 rounded border-2 border-muted-foreground/30 transition-all shrink-0",
        "hover:border-primary/60 hover:bg-primary/10",
        loading && "opacity-50 cursor-wait"
      )}
      title="Marcar como declarado"
    />
  );
}

// ─── Fila de servicio ─────────────────────────────────────────────────────────
function ServicioRow({
  servicio,
  isEven,
  onOpen,
  onOptimisticDeclare,
  onArchived,
}: {
  servicio: ServicioListItem;
  isEven: boolean;
  onOpen: (s: ServicioListItem) => void;
  onOptimisticDeclare: (id: string) => void;
  onArchived: () => void;
}) {
  const isCobrado = servicio.estadoCobranza === "COBRADO";
  const isArchivado = servicio.estado === "ARCHIVADO";
  const progreso =
    servicio.precioFinal > 0
      ? Math.min(100, Math.round((servicio.montoCobrado / servicio.precioFinal) * 100))
      : 0;

  return (
    <ContextMenuRow
      onClick={() => onOpen(servicio)}
      className={cn(
        "cursor-pointer transition-colors duration-100 group",
        isCobrado
          ? "bg-primary/5 opacity-80"
          : isEven
          ? "bg-muted/10"
          : "bg-background",
        "hover:bg-primary/5",
        isArchivado && "opacity-50"
      )}
      deleteLabel="Archivar"
      confirmMessage={`¿Archivar el servicio de "${servicio.persona.razonSocial}"?`}
      onDelete={async () => {
        await archivarServicioAction(servicio.id);
        onArchived();
      }}
    >
      {/* Declarado checkbox */}
      <td
        className="px-3 py-2.5"
        onClick={(e) => e.stopPropagation()}
      >
        <DeclaradoCheckbox
          servicioId={servicio.id}
          estadoTrabajo={servicio.estadoTrabajo}
          onOptimisticUpdate={onOptimisticDeclare}
        />
      </td>

      {/* Empresa */}
      <td className="px-3 py-2.5">
        <span
          className={cn(
            "text-sm font-semibold leading-tight",
            isArchivado && "line-through text-muted-foreground"
          )}
        >
          {servicio.persona.razonSocial}
        </span>
      </td>

      {/* Tipo */}
      <td className="px-3 py-2.5 ">
        <span
          className={cn(
            "inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-medium",
            CATEGORIA_COLOR[servicio.tipoServicio.categoria] ?? CATEGORIA_COLOR.OTROS
          )}
        >
          {servicio.tipoServicio.nombre}
        </span>
      </td>

      {/* Honorarios */}
      <td className="px-3 py-2.5 text-right font-mono text-sm ">
        {formatCurrency(servicio.honorarios)}
      </td>

      {/* Cobrado */}
      <td className="px-3 py-2.5 text-right font-mono text-sm text-green-600 dark:text-green-400">
        {formatCurrency(servicio.montoCobrado)}
      </td>

      {/* Restante */}
      <td className="px-3 py-2.5 text-right font-mono text-sm ">
        <span
          className={cn(
            servicio.montoRestante > 0
              ? "text-destructive"
              : "text-green-600 dark:text-green-400"
          )}
        >
          {formatCurrency(servicio.montoRestante)}
        </span>
      </td>

      {/* Estado */}
      <td className="px-3 py-2.5">
        <EstadoBadge estado={servicio.estadoCobranza} />
      </td>

    </ContextMenuRow>
  );
}

// ─── Header de grupo colapsable ───────────────────────────────────────────────
// ─── Header de columna sortable ──────────────────────────────────────────────
function SortableHeader({
  label,
  sortKey,
  align,
  currentKey,
  currentDir,
  onSort,
}: {
  label: string;
  sortKey: string;
  align: "left" | "right";
  currentKey: string;
  currentDir: "asc" | "desc";
  onSort: (key: any) => void;
}) {
  const isActive = currentKey === sortKey;
  return (
    <th
      className={cn(
        "px-3 py-2.5 text-[10px] uppercase tracking-wider font-medium cursor-pointer select-none transition-colors hover:text-foreground align-middle",
        align === "right" ? "text-right" : "text-left",
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

// ─── Header de grupo colapsable ───────────────────────────────────────────────
function GroupHeader({
  label,
  count,
  honorarios,
  cobrado,
  restante,
  collapsed,
  onToggle,
}: {
  label: string;
  count: number;
  honorarios: number;
  cobrado: number;
  restante: number;
  collapsed: boolean;
  onToggle: () => void;
}) {
  return (
    <tr
      onClick={onToggle}
      className="cursor-pointer select-none bg-muted/30 hover:bg-muted/50 transition-colors"
    >
      <td colSpan={7} className="px-4 py-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {collapsed ? (
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
            )}
            <span className="text-xs font-semibold text-foreground">{label}</span>
            <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
              {count}
            </span>
          </div>
        </div>
      </td>
    </tr>
  );
}

// ─── Fila de totales de grupo ─────────────────────────────────────────────────
function GroupSummaryRow({
  honorarios,
  cobrado,
  restante,
}: {
  honorarios: number;
  cobrado: number;
  restante: number;
}) {
  return (
    <tr className="border-t-2 border-border bg-muted/20">
      <td className="pl-4 pr-2 py-1.5 w-10" />
      <td className="px-3 py-1.5">
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
          Subtotal
        </span>
      </td>
      <td className="" />
      <td className="px-3 py-1.5 text-right font-mono text-xs font-semibold ">
        {formatCurrency(honorarios)}
      </td>
      <td className="px-3 py-1.5 text-right font-mono text-xs font-semibold text-green-600 ">
        {formatCurrency(cobrado)}
      </td>
      <td className="px-3 py-1.5 text-right font-mono text-xs font-semibold ">
        <span className={restante > 0 ? "text-destructive" : "text-green-600 dark:text-green-400"}>
          {formatCurrency(restante)}
        </span>
      </td>
      <td />
    </tr>
  );
}

// ─── Summary de grupo ─────────────────────────────────────────────────────────
function groupSum(servicios: ServicioListItem[]) {
  return servicios.reduce(
    (acc, s) => ({
      honorarios: acc.honorarios + s.honorarios,
      cobrado: acc.cobrado + s.montoCobrado,
      restante: acc.restante + s.montoRestante,
    }),
    { honorarios: 0, cobrado: 0, restante: 0 }
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────
function EmptyState() {
  return (
    <tr>
      <td colSpan={7} className="py-16 text-center">
        <div className="flex flex-col items-center gap-3">
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-muted">
            <Archive className="h-5 w-5 text-muted-foreground" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">No hay servicios para este período</p>
            <p className="text-xs text-muted-foreground mt-1">
              Cambiá el período o los filtros para ver otros servicios
            </p>
          </div>
        </div>
      </td>
    </tr>
  );
}

// ─── Skeleton loading ─────────────────────────────────────────────────────────
function SkeletonRows() {
  return (
    <>
      {Array.from({ length: 6 }).map((_, i) => (
        <tr key={i} className={i % 2 === 0 ? "bg-muted/20" : ""}>
          <td className="pl-4 pr-2 py-3 w-10">
            <Skeleton className="w-5 h-5 rounded" />
          </td>
          <td className="px-3 py-3">
            <Skeleton className="h-4 w-40 rounded" />
          </td>
          <td className="px-3 py-3 ">
            <Skeleton className="h-4 w-20 rounded-full" />
          </td>
          <td className="px-3 py-3 ">
            <Skeleton className="h-4 w-20 ml-auto rounded" />
          </td>
          <td className="px-3 py-3 ">
            <Skeleton className="h-4 w-20 ml-auto rounded" />
          </td>
          <td className="px-3 py-3 ">
            <Skeleton className="h-4 w-20 ml-auto rounded" />
          </td>
          <td className="px-3 py-3">
            <Skeleton className="h-5 w-16 rounded-full" />
          </td>
          <td className="px-3 py-3 pr-4" />
        </tr>
      ))}
    </>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────
export function ServicioListEnhanced({
  servicios: initialServicios,
  stats,
  cuentas,
}: ServicioListEnhancedProps) {
  const router = useRouter();
  type SortKey = "empresa" | "tipo" | "honorarios" | "cobrado" | "restante" | "estado";
  type SortDir = "asc" | "desc";

  const [servicios, setServicios] = React.useState(initialServicios);
  const [selected, setSelected] = React.useState<ServicioListItem | null>(null);
  const [sortKey, setSortKey] = React.useState<SortKey>("empresa");
  const [sortDir, setSortDir] = React.useState<SortDir>("asc");

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  function sortItems(items: ServicioListItem[]): ServicioListItem[] {
    return [...items].sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case "empresa": cmp = a.persona.razonSocial.localeCompare(b.persona.razonSocial); break;
        case "tipo": cmp = a.tipoServicio.nombre.localeCompare(b.tipoServicio.nombre); break;
        case "honorarios": cmp = a.honorarios - b.honorarios; break;
        case "cobrado": cmp = a.montoCobrado - b.montoCobrado; break;
        case "restante": cmp = a.montoRestante - b.montoRestante; break;
        case "estado": cmp = a.estadoCobranza.localeCompare(b.estadoCobranza); break;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
  }

  // Sync with server data
  React.useEffect(() => {
    setServicios(initialServicios);
  }, [initialServicios]);

  // Optimistic update for declare
  function handleOptimisticDeclare(id: string) {
    setServicios((prev) =>
      prev.map((s) =>
        s.id === id ? { ...s, estadoTrabajo: "POR_COBRAR" } : s
      )
    );
  }

  // Group by tipoPersona
  const TIPO_PERSONA_LABELS: Record<string, string> = {
    JURIDICA: "Persona Jurídica",
    NATURAL: "Persona Natural",
    IMMUNOTEC: "Immunotec",
    FOUR_LIFE: "4Life",
    RXH: "RXH",
  };
  const TIPO_PERSONA_ORDER = ["JURIDICA", "NATURAL", "IMMUNOTEC", "FOUR_LIFE", "RXH"];

  const groupedByTipo: Record<string, ServicioListItem[]> = {};
  for (const s of servicios) {
    const tipo = s.persona.tipoPersona;
    if (!groupedByTipo[tipo]) groupedByTipo[tipo] = [];
    groupedByTipo[tipo]!.push(s);
  }

  // Sort groups by defined order, then sort items within each group
  const orderedGroups = TIPO_PERSONA_ORDER
    .filter((tipo) => groupedByTipo[tipo] && groupedByTipo[tipo]!.length > 0)
    .map((tipo) => ({
      tipo,
      label: TIPO_PERSONA_LABELS[tipo] ?? tipo,
      items: sortItems(groupedByTipo[tipo]!),
      sums: groupSum(groupedByTipo[tipo]!),
    }));

  const [collapsedGroups, setCollapsedGroups] = React.useState<Record<string, boolean>>({});

  return (
    <>
      <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        <table className="w-full text-sm border-collapse" style={{ tableLayout: "fixed" }}>
          <colgroup><col style={{ width: "5%" }} /><col style={{ width: "30%" }} /><col style={{ width: "15%" }} /><col style={{ width: "13%" }} /><col style={{ width: "13%" }} /><col style={{ width: "13%" }} /><col style={{ width: "11%" }} /></colgroup>
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="px-3 py-2.5 text-left align-middle text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
                <span className="inline-flex items-center gap-1">Decl.<ArrowUpDown className="h-3 w-3 opacity-0" /></span>
              </th>
              <SortableHeader label="Empresa" sortKey="empresa" align="left" currentKey={sortKey} currentDir={sortDir} onSort={handleSort} />
              <SortableHeader label="Tipo" sortKey="tipo" align="left" currentKey={sortKey} currentDir={sortDir} onSort={handleSort} />
              <SortableHeader label="Honorarios" sortKey="honorarios" align="right" currentKey={sortKey} currentDir={sortDir} onSort={handleSort} />
              <SortableHeader label="Cobrado" sortKey="cobrado" align="right" currentKey={sortKey} currentDir={sortDir} onSort={handleSort} />
              <SortableHeader label="Restante" sortKey="restante" align="right" currentKey={sortKey} currentDir={sortDir} onSort={handleSort} />
              <SortableHeader label="Estado" sortKey="estado" align="left" currentKey={sortKey} currentDir={sortDir} onSort={handleSort} />
            </tr>
          </thead>

          <tbody className="divide-y divide-border/50">
            {servicios.length === 0 ? (
              <EmptyState />
            ) : (
              <>
                {orderedGroups.map((group) => {
                  const isCollapsed = collapsedGroups[group.tipo] ?? false;
                  return (
                    <React.Fragment key={group.tipo}>
                      <GroupHeader
                        label={group.label}
                        count={group.items.length}
                        honorarios={group.sums.honorarios}
                        cobrado={group.sums.cobrado}
                        restante={group.sums.restante}
                        collapsed={isCollapsed}
                        onToggle={() => setCollapsedGroups((prev) => ({ ...prev, [group.tipo]: !isCollapsed }))}
                      />
                      {!isCollapsed && group.items.map((s, i) => (
                        <ServicioRow
                          key={s.id}
                          servicio={s}
                          isEven={i % 2 === 0}
                          onOpen={setSelected}
                          onOptimisticDeclare={handleOptimisticDeclare}
                          onArchived={() => router.refresh()}
                        />
                      ))}
                      {!isCollapsed && group.items.length > 0 && (
                        <GroupSummaryRow
                          honorarios={group.sums.honorarios}
                          cobrado={group.sums.cobrado}
                          restante={group.sums.restante}
                        />
                      )}
                    </React.Fragment>
                  );
                })}
              </>
            )}
          </tbody>
        </table>
      </div>

      {/* Detail popup */}
      <ServicioDetailDialog
        servicio={selected}
        cuentas={cuentas}
        onClose={() => {
          setSelected(null);
          router.refresh(); // Refresh server data after any edits
        }}
      />
    </>
  );
}

// ─── Loading skeleton exportado ───────────────────────────────────────────────
export function ServicioListSkeleton() {
  return (
    <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="border-b border-border bg-muted/50">
            <th className="px-3 py-2.5" />
            <th className="px-3 py-2.5 text-left">
              <Skeleton className="h-3 w-16" />
            </th>
            <th className="px-3 py-2.5 ">
              <Skeleton className="h-3 w-10" />
            </th>
            <th className="px-3 py-2.5 ">
              <Skeleton className="h-3 w-20 ml-auto" />
            </th>
            <th className="px-3 py-2.5 ">
              <Skeleton className="h-3 w-16 ml-auto" />
            </th>
            <th className="px-3 py-2.5 ">
              <Skeleton className="h-3 w-16 ml-auto" />
            </th>
            <th className="px-3 py-2.5">
              <Skeleton className="h-3 w-12" />
            </th>
            <th className="px-3 py-2.5 pr-4 w-24" />
          </tr>
        </thead>
        <tbody className="divide-y divide-border/50">
          <SkeletonRows />
        </tbody>
      </table>
    </div>
  );
}

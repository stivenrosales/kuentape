"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ChevronRight, X, Phone, User2 } from "lucide-react";
import type { EstadoLead } from "@prisma/client";

import { monitorForElements } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { combine } from "@atlaskit/pragmatic-drag-and-drop/combine";
import {
  draggable,
  dropTargetForElements,
} from "@atlaskit/pragmatic-drag-and-drop/element/adapter";

import type { LeadKanbanCard, LeadsByEstado } from "../queries-kanban";
import { moveLeadAction } from "../actions-kanban";
import { LeadDetailDialog } from "./lead-detail-dialog";

// ─── Column config ───────────────────────────────────────────────

interface ColumnConfig {
  key: EstadoLead;
  label: string;
  dot: string;
  headerBg: string;
  headerText: string;
  colBg: string;
  badgeBg: string;
  badgeText: string;
  emptyBorder: string;
  dropHighlight: string;
}

const COLUMNS: ColumnConfig[] = [
  {
    key: "NUEVO",
    label: "Nuevo",
    dot: "bg-blue-500",
    headerBg: "bg-blue-50 dark:bg-blue-950/40",
    headerText: "text-blue-800 dark:text-blue-300",
    colBg: "bg-blue-50/50 dark:bg-blue-950/20",
    badgeBg: "bg-blue-100 dark:bg-blue-900/50",
    badgeText: "text-blue-700 dark:text-blue-300",
    emptyBorder: "border-blue-200 dark:border-blue-800",
    dropHighlight: "ring-2 ring-blue-400 dark:ring-blue-500",
  },
  {
    key: "CONTACTADO",
    label: "Contactado",
    dot: "bg-amber-500",
    headerBg: "bg-amber-50 dark:bg-amber-950/40",
    headerText: "text-amber-800 dark:text-amber-300",
    colBg: "bg-amber-50/50 dark:bg-amber-950/20",
    badgeBg: "bg-amber-100 dark:bg-amber-900/50",
    badgeText: "text-amber-700 dark:text-amber-300",
    emptyBorder: "border-amber-200 dark:border-amber-800",
    dropHighlight: "ring-2 ring-amber-400 dark:ring-amber-500",
  },
  {
    key: "COTIZADO",
    label: "Cotizado",
    dot: "bg-purple-500",
    headerBg: "bg-purple-50 dark:bg-purple-950/40",
    headerText: "text-purple-800 dark:text-purple-300",
    colBg: "bg-purple-50/50 dark:bg-purple-950/20",
    badgeBg: "bg-purple-100 dark:bg-purple-900/50",
    badgeText: "text-purple-700 dark:text-purple-300",
    emptyBorder: "border-purple-200 dark:border-purple-800",
    dropHighlight: "ring-2 ring-purple-400 dark:ring-purple-500",
  },
  {
    key: "CONVERTIDO",
    label: "Convertido",
    dot: "bg-green-500",
    headerBg: "bg-green-50 dark:bg-green-950/40",
    headerText: "text-green-800 dark:text-green-300",
    colBg: "bg-green-50/50 dark:bg-green-950/20",
    badgeBg: "bg-green-100 dark:bg-green-900/50",
    badgeText: "text-green-700 dark:text-green-300",
    emptyBorder: "border-green-200 dark:border-green-800",
    dropHighlight: "ring-2 ring-green-400 dark:ring-green-500",
  },
  {
    key: "PERDIDO",
    label: "Perdido",
    dot: "bg-zinc-400",
    headerBg: "bg-zinc-100 dark:bg-zinc-800/40",
    headerText: "text-zinc-600 dark:text-zinc-400",
    colBg: "bg-zinc-50/50 dark:bg-zinc-900/20",
    badgeBg: "bg-zinc-200 dark:bg-zinc-700/50",
    badgeText: "text-zinc-600 dark:text-zinc-400",
    emptyBorder: "border-zinc-200 dark:border-zinc-700",
    dropHighlight: "ring-2 ring-zinc-400 dark:ring-zinc-500",
  },
];

// ─── Props ───────────────────────────────────────────────────────

interface Props {
  initialData: LeadsByEstado;
  stats: Record<string, number>;
  staff: { id: string; nombre: string; apellido: string }[];
}

// ─── Main Board ──────────────────────────────────────────────────

export function LeadsKanbanBoard({ initialData, stats, staff }: Props) {
  const [data, setData] = React.useState<LeadsByEstado>(initialData);
  const [selectedLead, setSelectedLead] = React.useState<LeadKanbanCard | null>(null);
  const [showFinished, setShowFinished] = React.useState(false);
  const router = useRouter();

  // Keep local stats in sync (total per column from data)
  const localStats = React.useMemo(() => {
    const s: Record<string, number> = { ...stats };
    s.NUEVO = data.NUEVO.length;
    s.CONTACTADO = data.CONTACTADO.length;
    s.COTIZADO = data.COTIZADO.length;
    // CONVERTIDO and PERDIDO keep server stats (they're capped)
    return s;
  }, [data, stats]);

  async function handleMove(leadId: string, from: EstadoLead, to: EstadoLead) {
    if (from === to) return;

    // Optimistic update
    setData((prev) => {
      const card = prev[from].find((c) => c.id === leadId);
      if (!card) return prev;
      const updated = { ...card, estado: to };
      return {
        ...prev,
        [from]: prev[from].filter((c) => c.id !== leadId),
        [to]: [updated, ...prev[to]],
      };
    });
    // Also update selected lead if it's the same one
    setSelectedLead((prev) =>
      prev?.id === leadId ? { ...prev, estado: to } : prev
    );

    const result = await moveLeadAction(leadId, to);
    if (result.error) {
      toast.error(result.error);
      // Revert
      setData((prev) => {
        const card = prev[to].find((c) => c.id === leadId);
        if (!card) return prev;
        const reverted = { ...card, estado: from };
        return {
          ...prev,
          [to]: prev[to].filter((c) => c.id !== leadId),
          [from]: [reverted, ...prev[from]],
        };
      });
    } else {
      router.refresh();
    }
  }

  function handleCardUpdated(updated: LeadKanbanCard) {
    setData((prev) => {
      const col = updated.estado as EstadoLead;
      return {
        ...prev,
        [col]: prev[col].map((c) => (c.id === updated.id ? updated : c)),
      };
    });
    setSelectedLead(updated);
  }

  async function handleDelete(leadId: string) {
    const { deleteLeadAction } = await import("@/features/leads/actions");
    const result = await deleteLeadAction(leadId);
    if (result?.error) {
      toast.error(typeof result.error === "string" ? result.error : "Error al eliminar");
    } else {
      toast.success("Prospecto eliminado");
      // Remove from local state
      setData((prev) => {
        const updated = { ...prev };
        for (const key of Object.keys(updated)) {
          updated[key as EstadoLead] = updated[key as EstadoLead].filter((c) => c.id !== leadId);
        }
        return updated;
      });
    }
  }

  function handleCardConverted(_leadId: string) {
    setSelectedLead(null);
    router.refresh();
  }

  // Monitor drag-and-drop at the board level
  React.useEffect(() => {
    return monitorForElements({
      onDrop({ source, location }) {
        const target = location.current.dropTargets[0];
        if (!target) return;

        const sourceData = source.data as {
          type?: string;
          leadId?: string;
          currentEstado?: string;
        };
        const targetData = target.data as {
          type?: string;
          columnEstado?: string;
        };

        if (
          sourceData.type !== "lead-card" ||
          targetData.type !== "column" ||
          !sourceData.leadId ||
          !sourceData.currentEstado ||
          !targetData.columnEstado
        ) {
          return;
        }

        const from = sourceData.currentEstado as EstadoLead;
        const to = targetData.columnEstado as EstadoLead;

        if (from === to) return;

        // CONVERTIDO is terminal — can't drag FROM it
        if (from === "CONVERTIDO") return;

        // Dragging to CONVERTIDO → open conversion dialog instead of moving
        if (to === "CONVERTIDO") {
          if (from === "COTIZADO") {
            const card = data[from as EstadoLead]?.find((c) => c.id === sourceData.leadId);
            if (card) setSelectedLead(card);
          } else {
            toast.error("Solo se pueden convertir prospectos en estado Cotizado");
          }
          return;
        }

        handleMove(sourceData.leadId, from, to);
      },
    });
  }, [data]);

  return (
    <>
      <div className="flex gap-3 overflow-x-auto pb-4 -mx-1 px-1">
        {COLUMNS.map((col) => (
          <KanbanColumn
            collapsible={col.key === "CONVERTIDO" || col.key === "PERDIDO"}
            key={col.key}
            config={col}
            cards={data[col.key] ?? []}
            totalCount={localStats[col.key] ?? 0}
            onMoveCard={handleMove}
            onSelectCard={setSelectedLead}
            onDeleteCard={handleDelete}
          />
        ))}
      </div>

      {selectedLead && (
        <LeadDetailDialog
          lead={selectedLead}
          staff={staff}
          onClose={() => setSelectedLead(null)}
          onMove={handleMove}
          onUpdated={handleCardUpdated}
          onConverted={handleCardConverted}
        />
      )}
    </>
  );
}

// ─── Column ──────────────────────────────────────────────────────

interface ColumnProps {
  config: ColumnConfig;
  cards: LeadKanbanCard[];
  totalCount: number;
  collapsible?: boolean;
  onMoveCard: (id: string, from: EstadoLead, to: EstadoLead) => void;
  onSelectCard: (card: LeadKanbanCard) => void;
  onDeleteCard: (id: string) => void;
}

function KanbanColumn({
  config,
  cards,
  totalCount,
  collapsible = false,
  onMoveCard,
  onSelectCard,
  onDeleteCard,
}: ColumnProps) {
  const [collapsed, setCollapsed] = React.useState(collapsible);
  const dropRef = React.useRef<HTMLDivElement>(null);
  const [isDragOver, setIsDragOver] = React.useState(false);

  React.useEffect(() => {
    const el = dropRef.current;
    if (!el) return;

    return dropTargetForElements({
      element: el,
      getData: () => ({ type: "column", columnEstado: config.key }),
      onDragEnter: () => setIsDragOver(true),
      onDragLeave: () => setIsDragOver(false),
      onDrop: () => setIsDragOver(false),
    });
  }, [config.key]);

  if (collapsed) {
    return (
      <div
        ref={dropRef}
        className={[
          "flex flex-col w-[60px] flex-shrink-0 rounded-lg border cursor-pointer hover:opacity-80 transition-opacity",
          config.colBg,
          config.emptyBorder,
          isDragOver ? config.dropHighlight : "",
        ].join(" ")}
        onClick={() => setCollapsed(false)}
      >
        <div className="flex flex-col items-center gap-2 py-3 px-1">
          <span className={["h-2 w-2 rounded-full", config.dot].join(" ")} />
          <span className={["text-[9px] font-semibold writing-mode-vertical", config.headerText].join(" ")} style={{ writingMode: "vertical-rl", textOrientation: "mixed" }}>
            {config.label}
          </span>
          <span className={["text-[9px] font-medium rounded-full px-1.5 py-0.5", config.badgeBg, config.badgeText].join(" ")}>
            {totalCount}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-[260px] flex-shrink-0">
      {/* Header */}
      <div
        className={[
          "flex items-center gap-2 rounded-t-lg px-3 py-2.5 border border-b-0",
          config.headerBg,
          config.emptyBorder,
          collapsible ? "cursor-pointer" : "",
        ].join(" ")}
        onClick={collapsible ? () => setCollapsed(true) : undefined}
      >
        <span className={["h-2 w-2 rounded-full flex-shrink-0", config.dot].join(" ")} />
        <span className={["text-xs font-semibold flex-1", config.headerText].join(" ")}>
          {config.label}
        </span>
        <span
          className={[
            "inline-flex items-center justify-center h-5 min-w-[20px] px-1.5 rounded-full text-[11px] font-bold",
            config.badgeBg,
            config.badgeText,
          ].join(" ")}
        >
          {totalCount}
        </span>
      </div>

      {/* Cards area */}
      <div
        ref={dropRef}
        className={[
          "flex flex-col gap-2 rounded-b-lg border p-2 min-h-[120px] max-h-[calc(100vh-280px)] overflow-y-auto transition-all",
          config.colBg,
          config.emptyBorder,
          isDragOver ? config.dropHighlight : "",
        ].join(" ")}
      >
        {cards.length === 0 ? (
          <div
            className={[
              "flex items-center justify-center h-20 rounded-lg border-2 border-dashed text-xs text-muted-foreground",
              config.emptyBorder,
            ].join(" ")}
          >
            Sin prospectos
          </div>
        ) : (
          cards.map((card) => (
            <LeadCard
              key={card.id}
              card={card}
              colConfig={config}
              onMove={onMoveCard}
              onDelete={onDeleteCard}
              onSelect={onSelectCard}
            />
          ))
        )}
        {collapsible && totalCount > 10 && (
          <p className="text-center text-[11px] text-muted-foreground py-1">
            Mostrando últimos 10 de {totalCount}
          </p>
        )}
      </div>
    </div>
  );
}

// ─── Card ────────────────────────────────────────────────────────

const NEXT_ESTADO: Partial<Record<EstadoLead, EstadoLead>> = {
  NUEVO: "CONTACTADO",
  CONTACTADO: "COTIZADO",
  COTIZADO: "CONVERTIDO",
};

const NEXT_LABEL: Partial<Record<EstadoLead, string>> = {
  NUEVO: "Contactar",
  CONTACTADO: "Cotizar",
  COTIZADO: "Convertir",
};

interface CardProps {
  card: LeadKanbanCard;
  colConfig: ColumnConfig;
  onMove: (id: string, from: EstadoLead, to: EstadoLead) => void;
  onSelect: (card: LeadKanbanCard) => void;
}

function LeadCard({ card, colConfig, onMove, onSelect, onDelete }: CardProps & { onDelete: (id: string) => void }) {
  const dragRef = React.useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = React.useState(false);
  const [ctxMenu, setCtxMenu] = React.useState<{ x: number; y: number } | null>(null);
  const [confirming, setConfirming] = React.useState(false);
  const ctxRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!ctxMenu) return;
    function handleClick(e: MouseEvent) {
      if (ctxRef.current && !ctxRef.current.contains(e.target as Node)) { setCtxMenu(null); setConfirming(false); }
    }
    function handleEsc(e: KeyboardEvent) { if (e.key === "Escape") { setCtxMenu(null); setConfirming(false); } }
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleEsc);
    return () => { document.removeEventListener("mousedown", handleClick); document.removeEventListener("keydown", handleEsc); };
  }, [ctxMenu]);

  const isPerdido = card.estado === "PERDIDO";
  const isConvertido = card.estado === "CONVERTIDO";
  const nextEstado = NEXT_ESTADO[card.estado as EstadoLead];
  const nextLabel = NEXT_LABEL[card.estado as EstadoLead];

  // COTIZADO→CONVERTIDO requires the conversion dialog, so we open detail instead
  const canDirectAdvance = nextEstado && card.estado !== "COTIZADO";

  React.useEffect(() => {
    const el = dragRef.current;
    if (!el || isConvertido) return;

    return combine(
      draggable({
        element: el,
        getInitialData: () => ({
          type: "lead-card",
          leadId: card.id,
          currentEstado: card.estado,
        }),
        onDragStart: () => setIsDragging(true),
        onDrop: () => setIsDragging(false),
      }),
      dropTargetForElements({
        element: el,
        getData: () => ({ type: "column", columnEstado: card.estado }),
      })
    );
  }, [card.id, card.estado, isConvertido]);

  return (
    <div
      ref={dragRef}
      className={[
        "rounded-lg border border-border bg-card shadow-sm p-3 cursor-grab active:cursor-grabbing hover:shadow-md transition-all",
        isPerdido ? "opacity-60" : "",
        isConvertido
          ? "border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-950/20 cursor-pointer"
          : "",
        isDragging ? "opacity-40 scale-[0.98]" : "",
      ].join(" ")}
      onClick={() => onSelect(card)}
      onContextMenu={(e) => { e.preventDefault(); setCtxMenu({ x: e.clientX, y: e.clientY }); setConfirming(false); }}
    >
      {/* Name */}
      <p
        className={[
          "text-sm font-semibold leading-tight mb-1.5",
          isPerdido ? "line-through text-muted-foreground" : "text-foreground",
        ].join(" ")}
      >
        {card.nombre} {card.apellido}
      </p>

      {/* Meta */}
      <div className="space-y-0.5 mb-2">
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Phone className="h-3 w-3 flex-shrink-0" />
          <span>{card.celular}</span>
          {card.regimen && (
            <>
              <span className="text-border">·</span>
              <span className="font-medium text-foreground">{card.regimen}</span>
            </>
          )}
        </div>
        {card.rubro && (
          <p className="text-xs text-muted-foreground truncate">
            Rubro: {card.rubro}
          </p>
        )}
        {card.asignadoA && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <User2 className="h-3 w-3 flex-shrink-0" />
            <span>{card.asignadoA.nombre}</span>
          </div>
        )}
        {isConvertido && card.convertidoA && (
          <p className="text-xs font-medium text-green-700 dark:text-green-400 truncate">
            Cliente: {card.convertidoA.razonSocial}
          </p>
        )}
      </div>

      {/* Actions */}
      {!isPerdido && !isConvertido && (
        <div className="flex items-center gap-1.5 mt-2" onClick={(e) => e.stopPropagation()}>
          {canDirectAdvance && nextEstado && nextLabel ? (
            <button
              type="button"
              onClick={() => onMove(card.id, card.estado as EstadoLead, nextEstado)}
              className={[
                "flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-md transition-colors",
                colConfig.badgeBg,
                colConfig.badgeText,
                "hover:opacity-80",
              ].join(" ")}
            >
              <ChevronRight className="h-3 w-3" />
              {nextLabel}
            </button>
          ) : nextEstado && nextLabel ? (
            // COTIZADO: open detail dialog for conversion
            <button
              type="button"
              onClick={() => onSelect(card)}
              className={[
                "flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-md transition-colors",
                colConfig.badgeBg,
                colConfig.badgeText,
                "hover:opacity-80",
              ].join(" ")}
            >
              <ChevronRight className="h-3 w-3" />
              {nextLabel}
            </button>
          ) : null}

          <button
            type="button"
            title="Marcar como perdido"
            onClick={() => onMove(card.id, card.estado as EstadoLead, "PERDIDO")}
            className="flex items-center justify-center h-5 w-5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors ml-auto"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      )}

      {/* Context menu */}
      {ctxMenu && (
        <div
          ref={ctxRef}
          className="fixed z-[100] rounded-lg border border-border bg-popover shadow-lg py-1 min-w-[140px] animate-in fade-in zoom-in-95 duration-100"
          style={{ top: ctxMenu.y, left: ctxMenu.x }}
        >
          {!confirming ? (
            <button
              onClick={(e) => { e.stopPropagation(); setConfirming(true); }}
              className="w-full text-left px-3 py-1.5 text-sm text-destructive hover:bg-destructive/10 transition-colors"
            >
              Eliminar
            </button>
          ) : (
            <div className="px-3 py-2 space-y-2">
              <p className="text-xs text-muted-foreground">¿Seguro que querés eliminar a {card.nombre}?</p>
              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => { e.stopPropagation(); onDelete(card.id); setCtxMenu(null); }}
                  className="rounded bg-destructive px-3 py-1 text-xs font-medium text-destructive-foreground hover:bg-destructive/90"
                >
                  Sí, eliminar
                </button>
                <button onClick={() => { setCtxMenu(null); setConfirming(false); }} className="text-xs text-muted-foreground hover:text-foreground">
                  Cancelar
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

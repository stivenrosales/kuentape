"use client";

import { Badge } from "@/components/ui/badge";
import type { EstadoLead } from "@prisma/client";

interface LeadPipelineProps {
  counts: Record<EstadoLead, number>;
  activeEstado?: EstadoLead | null;
  onEstadoClick: (estado: EstadoLead | null) => void;
}

const ESTADOS: {
  key: EstadoLead;
  label: string;
  color: string;
  bg: string;
  activeBg: string;
}[] = [
  {
    key: "NUEVO",
    label: "Nuevo",
    color: "text-blue-700 dark:text-blue-400",
    bg: "bg-blue-50 border-blue-200 dark:bg-blue-950/40 dark:border-blue-800",
    activeBg:
      "bg-blue-100 border-blue-400 dark:bg-blue-900/60 dark:border-blue-600",
  },
  {
    key: "CONTACTADO",
    label: "Contactado",
    color: "text-amber-700 dark:text-amber-400",
    bg: "bg-amber-50 border-amber-200 dark:bg-amber-950/40 dark:border-amber-800",
    activeBg:
      "bg-amber-100 border-amber-400 dark:bg-amber-900/60 dark:border-amber-600",
  },
  {
    key: "COTIZADO",
    label: "Cotizado",
    color: "text-purple-700 dark:text-purple-400",
    bg: "bg-purple-50 border-purple-200 dark:bg-purple-950/40 dark:border-purple-800",
    activeBg:
      "bg-purple-100 border-purple-400 dark:bg-purple-900/60 dark:border-purple-600",
  },
  {
    key: "CONVERTIDO",
    label: "Convertido",
    color: "text-green-700 dark:text-green-400",
    bg: "bg-green-50 border-green-200 dark:bg-green-950/40 dark:border-green-800",
    activeBg:
      "bg-green-100 border-green-400 dark:bg-green-900/60 dark:border-green-600",
  },
  {
    key: "PERDIDO",
    label: "Perdido",
    color: "text-red-700 dark:text-red-400",
    bg: "bg-red-50 border-red-200 dark:bg-red-950/40 dark:border-red-800",
    activeBg:
      "bg-red-100 border-red-400 dark:bg-red-900/60 dark:border-red-600",
  },
];

export function LeadPipeline({
  counts,
  activeEstado,
  onEstadoClick,
}: LeadPipelineProps) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
      {ESTADOS.map((e) => {
        const isActive = activeEstado === e.key;
        return (
          <button
            key={e.key}
            type="button"
            onClick={() => onEstadoClick(isActive ? null : e.key)}
            className={[
              "flex flex-col items-center gap-1 rounded-xl border p-4 text-center transition-all hover:opacity-90 cursor-pointer",
              isActive ? e.activeBg : e.bg,
            ].join(" ")}
          >
            <span className={["text-2xl font-bold", e.color].join(" ")}>
              {counts[e.key]}
            </span>
            <span className={["text-xs font-medium", e.color].join(" ")}>
              {e.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

export function EstadoBadge({ estado }: { estado: EstadoLead }) {
  const map: Record<EstadoLead, { label: string; className: string }> = {
    NUEVO: {
      label: "Nuevo",
      className:
        "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/40 dark:text-blue-400",
    },
    CONTACTADO: {
      label: "Contactado",
      className:
        "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/40 dark:text-amber-400",
    },
    COTIZADO: {
      label: "Cotizado",
      className:
        "bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/40 dark:text-purple-400",
    },
    CONVERTIDO: {
      label: "Convertido",
      className:
        "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/40 dark:text-green-400",
    },
    PERDIDO: {
      label: "Perdido",
      className:
        "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/40 dark:text-red-400",
    },
  };

  const { label, className } = map[estado];
  return (
    <Badge variant="outline" className={className}>
      {label}
    </Badge>
  );
}

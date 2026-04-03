"use client";

import * as React from "react";
import Link from "next/link";
import {
  X,
  ArrowUpCircle,
  ArrowDownCircle,
  Hash,
  Building2,
  Calendar,
  CreditCard,
  Tag,
  ExternalLink,
  ImageIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { FinanzaSimpleRow } from "./finanza-table-simple";

interface FinanzaDetailDialogProps {
  finanza: FinanzaSimpleRow;
  onClose: () => void;
}

const TIPO_CONFIG = {
  INGRESO: {
    label: "Ingreso",
    badgeClass:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 border-transparent",
    amountClass: "text-emerald-700 dark:text-emerald-400",
    prefix: "+",
    Icon: ArrowUpCircle,
    iconClass: "text-emerald-600 dark:text-emerald-400",
  },
  EGRESO: {
    label: "Egreso",
    badgeClass:
      "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 border-transparent",
    amountClass: "text-red-700 dark:text-red-400",
    prefix: "-",
    Icon: ArrowDownCircle,
    iconClass: "text-red-600 dark:text-red-400",
  },
} as const;

export function FinanzaDetailDialog({ finanza, onClose }: FinanzaDetailDialogProps) {
  const config = TIPO_CONFIG[finanza.tipo];
  const { Icon } = config;

  React.useEffect(() => {
    function handleEsc(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />
      <div
        className="relative w-full max-w-md bg-card rounded-lg shadow-2xl overflow-hidden animate-in zoom-in-95 fade-in duration-150 flex flex-col max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between px-5 pt-4 pb-3 border-b border-border flex-shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <Icon className={cn("h-5 w-5 flex-shrink-0", config.iconClass)} />
            <div className="min-w-0">
              <h2 className="text-sm font-bold text-foreground truncate">
                {finanza.concepto}
              </h2>
              <Badge className={cn("mt-0.5 text-[10px]", config.badgeClass)}>
                {config.label}
              </Badge>
            </div>
          </div>
          <button
            onClick={onClose}
            className="ml-3 flex-shrink-0 p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-5 py-4 space-y-5">
          {/* Monto destacado */}
          <div className="rounded-lg bg-muted/40 px-4 py-3 text-center">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">
              Monto
            </p>
            <p
              className={cn(
                "font-mono text-2xl font-bold tabular-nums",
                config.amountClass
              )}
            >
              {config.prefix}
              {formatCurrency(finanza.monto)}
            </p>
          </div>

          {/* Detalles */}
          <div className="space-y-2">
            <DetailRow icon={<Calendar className="h-3.5 w-3.5" />} label="Fecha">
              {formatDate(finanza.fecha)}
            </DetailRow>

            <DetailRow icon={<CreditCard className="h-3.5 w-3.5" />} label="Cuenta">
              <span className="font-medium">{finanza.cuenta.nombre}</span>
              {finanza.cuenta.banco && (
                <span className="text-muted-foreground"> — {finanza.cuenta.banco}</span>
              )}
            </DetailRow>

            {finanza.numeroOperacion && (
              <DetailRow icon={<Hash className="h-3.5 w-3.5" />} label="N° operación">
                <span className="font-mono">{finanza.numeroOperacion}</span>
              </DetailRow>
            )}

            {finanza.categoriaGasto && (
              <DetailRow icon={<Tag className="h-3.5 w-3.5" />} label="Categoría">
                {finanza.categoriaGasto}
              </DetailRow>
            )}

            {finanza.servicio && (
              <DetailRow icon={<Building2 className="h-3.5 w-3.5" />} label="Empresa">
                <span className="font-medium">
                  {finanza.servicio.persona.razonSocial}
                </span>
                <span className="text-muted-foreground">
                  {" "}— {finanza.servicio.tipoServicio.nombre}
                </span>
              </DetailRow>
            )}
          </div>

          {/* Comprobante */}
          {finanza.comprobanteUrl && (
            <div className="space-y-2">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Comprobante
              </p>
              <a
                href={finanza.comprobanteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2 text-xs font-medium text-primary hover:bg-muted/60 transition-colors"
              >
                <ImageIcon className="h-3.5 w-3.5" />
                Ver comprobante
                <ExternalLink className="h-3 w-3 ml-auto" />
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function DetailRow({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-2 text-xs min-h-[1.5rem]">
      <span className="text-muted-foreground flex-shrink-0 mt-0.5">{icon}</span>
      <span className="text-muted-foreground w-24 flex-shrink-0">{label}:</span>
      <span className="flex-1 min-w-0 text-foreground">{children}</span>
    </div>
  );
}

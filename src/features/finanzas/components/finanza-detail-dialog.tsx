"use client";

import * as React from "react";
import {
  X,
  ArrowUpCircle,
  ArrowDownCircle,
  Hash,
  Building2,
  Calendar,
  CreditCard,
  Tag,
  CheckCircle,
  ZoomIn,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { formatCurrency, formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { FinanzaSimpleRow } from "./finanza-table-simple";

interface FinanzaDetailDialogProps {
  finanza: FinanzaSimpleRow;
  isAdmin?: boolean;
  onClose: () => void;
}

const TIPO_CONFIG = {
  INGRESO: {
    label: "Ingreso",
    badgeClass: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 border-transparent",
    amountClass: "text-emerald-700 dark:text-emerald-400",
    prefix: "+",
    Icon: ArrowUpCircle,
    iconClass: "text-emerald-600 dark:text-emerald-400",
  },
  EGRESO: {
    label: "Egreso",
    badgeClass: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 border-transparent",
    amountClass: "text-red-700 dark:text-red-400",
    prefix: "-",
    Icon: ArrowDownCircle,
    iconClass: "text-red-600 dark:text-red-400",
  },
} as const;

export function FinanzaDetailDialog({ finanza, isAdmin = false, onClose }: FinanzaDetailDialogProps) {
  const router = useRouter();
  const config = TIPO_CONFIG[finanza.tipo];
  const { Icon } = config;
  const [imageExpanded, setImageExpanded] = React.useState(false);
  const [validated, setValidated] = React.useState(finanza.validado ?? false);
  const [validating, setValidating] = React.useState(false);
  const didChangeRef = React.useRef(false);

  const handleClose = React.useCallback(() => {
    if (didChangeRef.current) router.refresh();
    onClose();
  }, [onClose, router]);

  React.useEffect(() => {
    function handleEsc(e: KeyboardEvent) { if (e.key === "Escape") { e.stopImmediatePropagation(); if (imageExpanded) setImageExpanded(false); else handleClose(); } }
    document.addEventListener("keydown", handleEsc, true);
    return () => document.removeEventListener("keydown", handleEsc, true);
  }, [handleClose, imageExpanded]);

  async function handleValidate() {
    setValidating(true);
    try {
      const res = await fetch(`/api/finanzas/${finanza.id}/validar`, { method: "POST" });
      const data = await res.json().catch(() => null);
      if (res.ok && data) {
        setValidated(data.validado);
        didChangeRef.current = true;
        toast.success(data.validado ? "Pago validado" : "Validación removida");
      } else {
        console.error("Validar error:", res.status, data);
        toast.error(data?.error || `Error al validar (${res.status})`);
      }
    } catch (err) {
      console.error("Validar fetch error:", err);
      toast.error("Error de conexión al validar");
    }
    setValidating(false);
  }

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={handleClose}>
        <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />
        <div className="relative w-full max-w-md bg-card rounded-lg shadow-2xl overflow-hidden animate-in zoom-in-95 fade-in duration-150 flex flex-col max-h-[85vh]" onClick={(e) => e.stopPropagation()}>
          {/* Header */}
          <div className="flex items-start justify-between px-5 pt-4 pb-3 border-b border-border shrink-0">
            <div className="flex items-center gap-2.5 min-w-0">
              <Icon className={cn("h-5 w-5 shrink-0", config.iconClass)} />
              <div className="min-w-0">
                <h2 className="text-sm font-bold truncate">{finanza.concepto}</h2>
                <Badge className={cn("mt-0.5 text-[10px]", config.badgeClass)}>{config.label}</Badge>
              </div>
            </div>
            <button onClick={handleClose} className="ml-3 shrink-0 p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted">
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Body */}
          <div className="overflow-y-auto flex-1 px-5 py-4 space-y-4">
            {/* Monto */}
            <div className="rounded-lg bg-muted/40 px-4 py-3 text-center">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">Monto</p>
              <p className={cn("font-mono text-2xl font-bold tabular-nums", config.amountClass)}>
                {config.prefix}{formatCurrency(finanza.monto)}
              </p>
            </div>

            {/* Detalles */}
            <div className="space-y-2">
              <DetailRow icon={<Calendar className="h-3.5 w-3.5" />} label="Fecha">{formatDate(finanza.fecha)}</DetailRow>
              <DetailRow icon={<CreditCard className="h-3.5 w-3.5" />} label="Cuenta">
                <span className="font-medium">{finanza.cuenta.nombre}</span>
                {finanza.cuenta.banco && <span className="text-muted-foreground"> — {finanza.cuenta.banco}</span>}
              </DetailRow>
              {finanza.numeroOperacion && (
                <DetailRow icon={<Hash className="h-3.5 w-3.5" />} label="N° operación">
                  <span className="font-mono">{finanza.numeroOperacion}</span>
                </DetailRow>
              )}
              {finanza.categoriaGasto && (
                <DetailRow icon={<Tag className="h-3.5 w-3.5" />} label="Categoría">{finanza.categoriaGasto}</DetailRow>
              )}
              {finanza.servicio && (
                <DetailRow icon={<Building2 className="h-3.5 w-3.5" />} label="Empresa">
                  <span className="font-medium">{finanza.servicio.persona.razonSocial}</span>
                  <span className="text-muted-foreground"> — {finanza.servicio.tipoServicio.nombre}</span>
                </DetailRow>
              )}
            </div>

            {/* Comprobante preview */}
            {finanza.comprobanteUrl && (
              <div>
                <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground mb-2">Comprobante</p>
                <div
                  className="relative rounded-lg border border-border overflow-hidden cursor-pointer group"
                  onClick={() => setImageExpanded(true)}
                >
                  <img
                    src={finanza.comprobanteUrl}
                    alt="Comprobante de pago"
                    className="w-full h-48 object-contain bg-muted/20"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                    <ZoomIn className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>
              </div>
            )}

            {/* Validar pago — solo admin */}
            {isAdmin && finanza.tipo === "INGRESO" && (
              <button
                onClick={handleValidate}
                disabled={validating}
                className={cn(
                  "w-full flex items-center justify-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors disabled:opacity-50",
                  validated
                    ? "border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300"
                    : "border-border bg-muted/20 text-muted-foreground hover:bg-muted/40 hover:text-foreground"
                )}
              >
                <CheckCircle className={cn("h-4 w-4", validated ? "text-emerald-600" : "text-muted-foreground/50")} />
                {validating ? "..." : validated ? "Pago validado ✓" : "Validar pago"}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Comprobante expandido (fullscreen) */}
      {imageExpanded && finanza.comprobanteUrl && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center p-8 bg-black/80"
          onClick={() => setImageExpanded(false)}
        >
          <button className="absolute top-4 right-4 p-2 rounded-full bg-white/20 text-white hover:bg-white/30 transition-colors">
            <X className="h-5 w-5" />
          </button>
          <img
            src={finanza.comprobanteUrl}
            alt="Comprobante de pago"
            className="max-w-full max-h-full object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
}

function DetailRow({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2 text-xs min-h-[1.5rem]">
      <span className="text-muted-foreground shrink-0 mt-0.5">{icon}</span>
      <span className="text-muted-foreground w-24 shrink-0">{label}:</span>
      <span className="flex-1 min-w-0 text-foreground">{children}</span>
    </div>
  );
}

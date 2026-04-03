"use client";

import * as React from "react";
import { CheckCircle2, Circle, PartyPopper } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { updateDeclaracionAnualAction } from "@/features/servicios/actions";

interface DetalleItem {
  mes: number;
  completado: boolean;
}

interface DeclaracionAnualTrackerProps {
  servicioId: string;
  detalles: DetalleItem[];
  canEdit?: boolean;
}

const MES_LABELS: Record<number, string> = {
  1: "Ene",
  2: "Feb",
  3: "Mar",
  4: "Abr",
  5: "May",
  6: "Jun",
  7: "Jul",
  8: "Ago",
  9: "Sep",
  10: "Oct",
  11: "Nov",
  12: "Dic",
  13: "DAOT",
  14: "AP",
};

export function DeclaracionAnualTracker({
  servicioId,
  detalles,
  canEdit = true,
}: DeclaracionAnualTrackerProps) {
  const [localDetalles, setLocalDetalles] = React.useState<DetalleItem[]>(detalles);
  const [loadingMes, setLoadingMes] = React.useState<number | null>(null);

  const completados = localDetalles.filter((d) => d.completado).length;
  const total = localDetalles.length;
  const allDone = completados === total && total > 0;

  async function handleToggle(mes: number, currentState: boolean) {
    if (!canEdit || loadingMes !== null) return;
    setLoadingMes(mes);

    const newState = !currentState;

    // Optimistic update
    setLocalDetalles((prev) =>
      prev.map((d) => (d.mes === mes ? { ...d, completado: newState } : d)),
    );

    try {
      const result = await updateDeclaracionAnualAction(servicioId, mes, newState);
      if (!result.success) {
        // Revert
        setLocalDetalles((prev) =>
          prev.map((d) => (d.mes === mes ? { ...d, completado: currentState } : d)),
        );
        toast.error("Error al actualizar el estado");
      }
    } catch {
      // Revert
      setLocalDetalles((prev) =>
        prev.map((d) => (d.mes === mes ? { ...d, completado: currentState } : d)),
      );
      toast.error("Error al actualizar el estado");
    } finally {
      setLoadingMes(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          <span className="font-semibold text-foreground">{completados}</span>
          <span> / {total} completados</span>
        </p>
        <div className="h-2 w-48 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all duration-300"
            style={{ width: `${total > 0 ? (completados / total) * 100 : 0}%` }}
            role="progressbar"
            aria-valuenow={completados}
            aria-valuemin={0}
            aria-valuemax={total}
          />
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2 sm:grid-cols-7">
        {localDetalles.map((detalle) => {
          const isLoading = loadingMes === detalle.mes;
          return (
            <button
              key={detalle.mes}
              type="button"
              onClick={() => handleToggle(detalle.mes, detalle.completado)}
              disabled={!canEdit || loadingMes !== null}
              className={`flex flex-col items-center gap-1 rounded-lg border p-2 text-center transition-colors ${
                detalle.completado
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-400"
                  : "border-border bg-background text-muted-foreground hover:bg-muted/50"
              } ${!canEdit ? "cursor-default" : "cursor-pointer"} ${isLoading ? "opacity-50" : ""}`}
              title={detalle.completado ? "Marcar como pendiente" : "Marcar como completado"}
            >
              {detalle.completado ? (
                <CheckCircle2 className="size-4 shrink-0" />
              ) : (
                <Circle className="size-4 shrink-0" />
              )}
              <span className="text-xs font-medium">
                {MES_LABELS[detalle.mes] ?? `M${detalle.mes}`}
              </span>
            </button>
          );
        })}
      </div>

      {allDone && (
        <div className="flex items-center gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-3 dark:border-emerald-800 dark:bg-emerald-900/20">
          <PartyPopper className="size-5 shrink-0 text-emerald-600" />
          <div className="flex flex-1 items-center justify-between">
            <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
              Todos los periodos completados
            </p>
            <Button size="sm" variant="outline" className="text-xs">
              Completar Servicio
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

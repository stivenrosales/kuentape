"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/format";
import { ServicioDetailDialog } from "@/features/servicios/components/servicio-detail-dialog";

interface ServicioPendiente {
  id: string;
  periodo: string | null;
  baseImponible: number;
  igv: number;
  noGravado: number;
  totalImponible: number;
  honorarios: number;
  descuento: number;
  precioFinal: number;
  montoCobrado: number;
  montoRestante: number;
  estadoCobranza: string;
  estadoTrabajo: string;
  estado: string;
  notas: string | null;
  persona: { id: string; razonSocial: string; tipoPersona: string; regimen: string };
  tipoServicio: { id: string; nombre: string; categoria: string };
  contador: { id: string; nombre: string; apellido: string };
}

const ESTADO_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  PENDIENTE: "secondary",
  PARCIAL: "outline",
  COBRADO: "default",
  INCOBRABLE: "destructive",
};

const ESTADO_LABEL: Record<string, string> = {
  PENDIENTE: "Pendiente",
  PARCIAL: "Parcial",
  COBRADO: "Cobrado",
  INCOBRABLE: "Incobrable",
};

interface Props {
  servicios: ServicioPendiente[];
  cuentas: { id: string; nombre: string; banco: string }[];
}

export function CobrosPendientes({ servicios, cuentas }: Props) {
  const [selected, setSelected] = React.useState<ServicioPendiente | null>(null);

  return (
    <>
      {servicios.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted-foreground">
          Sin servicios pendientes de cobro
        </p>
      ) : (
        <div className="divide-y divide-border/50">
          {servicios.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setSelected(s)}
              className="flex w-full items-center gap-3 py-2.5 hover:bg-muted/40 -mx-2 px-2 rounded-lg transition-colors text-left"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{s.persona.razonSocial}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {s.tipoServicio.nombre}{s.periodo ? ` · ${s.periodo}` : ""}
                </p>
              </div>
              <Badge variant={ESTADO_VARIANT[s.estadoCobranza] ?? "secondary"} className="text-[10px]">
                {ESTADO_LABEL[s.estadoCobranza] ?? s.estadoCobranza}
              </Badge>
              <span className="shrink-0 text-sm font-mono font-semibold text-destructive">
                {formatCurrency(s.montoRestante)}
              </span>
            </button>
          ))}
        </div>
      )}

      <ServicioDetailDialog
        servicio={selected as any}
        cuentas={cuentas}
        onClose={() => setSelected(null)}
      />
    </>
  );
}

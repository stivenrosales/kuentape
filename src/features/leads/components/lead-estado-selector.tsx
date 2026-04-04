"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { EstadoLead } from "@prisma/client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { updateLeadEstadoAction } from "@/features/leads/actions";

const ESTADOS: { value: EstadoLead; label: string }[] = [
  { value: "NUEVO", label: "Nuevo" },
  { value: "CONTACTADO", label: "Contactado" },
  { value: "COTIZADO", label: "Cotizado" },
  { value: "CONVERTIDO", label: "Convertido" },
  { value: "PERDIDO", label: "Perdido" },
];

interface LeadEstadoSelectorProps {
  leadId: string;
  currentEstado: EstadoLead;
}

export function LeadEstadoSelector({
  leadId,
  currentEstado,
}: LeadEstadoSelectorProps) {
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);

  async function handleChange(newEstado: string) {
    if (newEstado === currentEstado) return;
    setLoading(true);
    try {
      const result = await updateLeadEstadoAction(leadId, newEstado);
      if (result.error) {
        toast.error(
          typeof result.error === "string" ? result.error : "Error al actualizar estado"
        );
      } else {
        toast.success("Estado actualizado");
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-xl border bg-card p-5 space-y-3">
      <h2 className="text-sm font-semibold text-foreground">Estado del prospecto</h2>
      <div className="space-y-1.5">
        <Label>Estado actual</Label>
        <Select
          value={currentEstado}
          onValueChange={(v) => { if (!v) return; handleChange(v); }}
          disabled={loading || currentEstado === "CONVERTIDO"}
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ESTADOS.map((e) => (
              <SelectItem key={e.value} value={e.value}>
                {e.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {currentEstado === "CONVERTIDO" && (
          <p className="text-xs text-muted-foreground">
            Los prospectos convertidos no pueden cambiar de estado.
          </p>
        )}
      </div>
    </div>
  );
}

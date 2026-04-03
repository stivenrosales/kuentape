"use client";

import { FileText, Users, Briefcase } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/format";
import type { Regimen } from "@prisma/client";

const REGIMEN_LABEL: Record<Regimen, string> = {
  MYPE: "MYPE",
  RER: "RER",
  REG: "Régimen General",
};

interface LeadCotizacionProps {
  nombre: string;
  apellido: string;
  celular: string;
  email: string | null;
  regimen: Regimen | null;
  rubro: string | null;
  numTrabajadores: number | null;
  planillaPrecioCalculado: number;
}

export function LeadCotizacion({
  nombre,
  apellido,
  celular,
  email,
  regimen,
  rubro,
  numTrabajadores,
  planillaPrecioCalculado,
}: LeadCotizacionProps) {
  const tieneInfo = regimen || rubro;
  const tienePlanilla = (numTrabajadores ?? 0) > 0;

  return (
    <div className="rounded-xl border bg-card p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <FileText className="h-4 w-4 text-muted-foreground" />
          Cotización estimada
        </h2>
        <Button size="sm" variant="outline" disabled title="Próximamente">
          Generar PDF
        </Button>
      </div>

      {/* Resumen del prospecto */}
      <div className="rounded-lg bg-muted/40 p-4 space-y-2 text-sm">
        <p className="font-medium">
          {nombre} {apellido}
        </p>
        <p className="text-muted-foreground">{celular}</p>
        {email && <p className="text-muted-foreground">{email}</p>}
      </div>

      {tieneInfo ? (
        <div className="space-y-3">
          {regimen && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground flex items-center gap-1.5">
                <Briefcase className="h-3.5 w-3.5" />
                Régimen
              </span>
              <Badge variant="outline">{REGIMEN_LABEL[regimen]}</Badge>
            </div>
          )}

          {rubro && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Rubro</span>
              <span className="font-medium">{rubro}</span>
            </div>
          )}

          {tienePlanilla && (
            <>
              <div className="border-t pt-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground flex items-center gap-1.5">
                    <Users className="h-3.5 w-3.5" />
                    N° trabajadores
                  </span>
                  <span className="font-medium">{numTrabajadores}</span>
                </div>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Planilla estimada</span>
                <span className="font-semibold text-foreground">
                  {formatCurrency(planillaPrecioCalculado)}
                </span>
              </div>
            </>
          )}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          Completá el régimen y rubro del prospecto para ver la cotización estimada.
        </p>
      )}
    </div>
  );
}

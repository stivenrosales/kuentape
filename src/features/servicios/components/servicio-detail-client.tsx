"use client";

import * as React from "react";
import Link from "next/link";
import { CircleDollarSign, Pencil, Archive } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { RegistrarCobroDialog } from "./registrar-cobro-dialog";
import { DeclaracionAnualTracker } from "./declaracion-anual-tracker";
import { formatCurrency } from "@/lib/format";
import { formatDate } from "@/lib/format";
import { archivarServicioAction } from "@/features/servicios/actions";
import type { EstadoCobranza, CategoriaServicio } from "@prisma/client";

interface CuentaOption {
  id: string;
  nombre: string;
  banco: string;
}

interface FinanzaItem {
  id: string;
  monto: number;
  fecha: Date;
  concepto: string;
  numeroOperacion: string | null;
  cuenta: { nombre: string; banco: string };
  creadoPor: { nombre: string; apellido: string };
}

interface DeclaracionItem {
  mes: number;
  completado: boolean;
}

interface ServicioDetailProps {
  servicio: {
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
    estadoCobranza: EstadoCobranza;
    estado: string;
    notas: string | null;
    createdAt: Date;
    persona: { id: string; razonSocial: string; ruc: string };
    tipoServicio: {
      nombre: string;
      categoria: CategoriaServicio;
      requierePeriodo: boolean;
    };
    contador: { nombre: string; apellido: string };
    finanzas: FinanzaItem[];
    declaracionAnualDetalles: DeclaracionItem[];
  };
  cuentas: CuentaOption[];
  canArchivar: boolean;
  canEdit: boolean;
}

const COBRANZA_BADGE: Record<
  EstadoCobranza,
  { label: string; className: string }
> = {
  PENDIENTE: {
    label: "Pendiente",
    className:
      "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 border-transparent",
  },
  PARCIAL: {
    label: "Parcial",
    className:
      "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 border-transparent",
  },
  COBRADO: {
    label: "Cobrado",
    className:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 border-transparent",
  },
  INCOBRABLE: {
    label: "Incobrable",
    className:
      "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 border-transparent",
  },
};

export function ServicioDetailClient({
  servicio,
  cuentas,
  equipo,
  canArchivar,
  canEdit,
}: ServicioDetailProps) {
  const [cobroOpen, setCobroOpen] = React.useState(false);
  const [archiveOpen, setArchiveOpen] = React.useState(false);

  const cobradoPct =
    servicio.precioFinal > 0
      ? Math.min(100, (servicio.montoCobrado / servicio.precioFinal) * 100)
      : 0;

  const isAnual =
    servicio.tipoServicio.categoria === "ANUAL" &&
    servicio.declaracionAnualDetalles.length > 0;

  async function handleArchivar() {
    const result = await archivarServicioAction(servicio.id);
    if (result.error) toast.error("Error al archivar el servicio");
    else toast.success("Servicio archivado");
  }

  const cobranzaCfg = COBRANZA_BADGE[servicio.estadoCobranza];

  return (
    <div className="space-y-6">
      {/* Acciones */}
      <div className="flex flex-wrap items-center gap-2">
        <Badge className={cobranzaCfg.className}>{cobranzaCfg.label}</Badge>

        {servicio.estado !== "ARCHIVADO" && (
          <Button
            size="sm"
            onClick={() => setCobroOpen(true)}
            className="gap-2"
          >
            <CircleDollarSign className="size-4" />
            Registrar Cobro
          </Button>
        )}

        {canEdit && (
          <Button size="sm" variant="outline" render={<Link href={`/servicios/${servicio.id}/editar`} />}>
            <Pencil className="size-4 mr-1" />
            Editar
          </Button>
        )}

        {canArchivar && servicio.estado !== "ARCHIVADO" && (
          <>
            <Button
              size="sm"
              variant="outline"
              className="text-destructive hover:text-destructive"
              onClick={() => setArchiveOpen(true)}
            >
              <Archive className="size-4 mr-1" />
              Archivar
            </Button>
            <ConfirmDialog
              open={archiveOpen}
              onOpenChange={setArchiveOpen}
              title="Archivar servicio"
              description="¿Estás seguro de archivar este servicio? Se marcará como INCOBRABLE."
              onConfirm={handleArchivar}
              confirmLabel="Archivar"
              variant="destructive"
            />
          </>
        )}
      </div>

      {/* Pricing breakdown */}
      <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {[
          { label: "Base Imponible", value: servicio.baseImponible },
          { label: "IGV (18%)", value: servicio.igv },
          { label: "No Gravado", value: servicio.noGravado },
          { label: "Total Imponible", value: servicio.totalImponible },
          { label: "Honorarios", value: servicio.honorarios },
          { label: "Descuento", value: servicio.descuento },
          {
            label: "Precio Final",
            value: servicio.precioFinal,
            highlight: true,
          },
        ].map(({ label, value, highlight }) => (
          <Card
            key={label}
            className={highlight ? "border-primary/30 bg-primary/5" : ""}
          >
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">{label}</p>
              <p
                className={`font-mono text-lg font-semibold ${highlight ? "text-primary" : ""}`}
              >
                {formatCurrency(value)}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Progreso de cobro */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Progreso de Cobro</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">
              Cobrado:{" "}
              <span className="font-mono font-medium text-foreground">
                {formatCurrency(servicio.montoCobrado)}
              </span>
            </span>
            <span className="text-muted-foreground">
              Restante:{" "}
              <span
                className={`font-mono font-medium ${servicio.montoRestante > 0 ? "text-red-600 dark:text-red-400" : "text-emerald-600"}`}
              >
                {formatCurrency(servicio.montoRestante)}
              </span>
            </span>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-muted">
            <div
              className={`h-full rounded-full transition-all duration-500 ${cobradoPct >= 100 ? "bg-emerald-500" : "bg-primary"}`}
              style={{ width: `${cobradoPct}%` }}
              role="progressbar"
              aria-valuenow={cobradoPct}
              aria-valuemin={0}
              aria-valuemax={100}
            />
          </div>
          <p className="text-right text-xs text-muted-foreground">
            {cobradoPct.toFixed(1)}% cobrado
          </p>
        </CardContent>
      </Card>

      {/* Declaración Anual Tracker */}
      {isAnual && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Seguimiento Declaración Anual</CardTitle>
          </CardHeader>
          <CardContent>
            <DeclaracionAnualTracker
              servicioId={servicio.id}
              detalles={servicio.declaracionAnualDetalles}
              canEdit={canEdit}
            />
          </CardContent>
        </Card>
      )}

      {/* Información del servicio */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Información</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          <div>
            <p className="text-xs text-muted-foreground">Cliente</p>
            <Link
              href={`/clientes/${servicio.persona.id}`}
              className="text-sm font-medium hover:underline"
            >
              {servicio.persona.razonSocial}
            </Link>
            <p className="font-mono text-xs text-muted-foreground">
              {servicio.persona.ruc}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Contador</p>
            <p className="text-sm font-medium">
              {servicio.contador.nombre} {servicio.contador.apellido}
            </p>
          </div>
          {servicio.periodo && (
            <div>
              <p className="text-xs text-muted-foreground">Periodo</p>
              <p className="text-sm font-mono">{servicio.periodo}</p>
            </div>
          )}
          <div>
            <p className="text-xs text-muted-foreground">Estado</p>
            <p className="text-sm font-medium">{servicio.estado}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Registrado</p>
            <p className="text-sm">{formatDate(servicio.createdAt)}</p>
          </div>
          {servicio.notas && (
            <div className="sm:col-span-2">
              <p className="text-xs text-muted-foreground">Notas</p>
              <p className="mt-1 text-sm whitespace-pre-line">{servicio.notas}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagos */}
      {servicio.finanzas.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Pagos Registrados ({servicio.finanzas.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {servicio.finanzas.map((f) => (
              <div
                key={f.id}
                className="flex items-center justify-between rounded-lg border border-border bg-muted/20 px-3 py-2"
              >
                <div>
                  <p className="text-sm font-medium">{f.concepto}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(f.fecha)} — {f.cuenta.nombre} ({f.cuenta.banco})
                  </p>
                  {f.numeroOperacion && (
                    <p className="font-mono text-xs text-muted-foreground">
                      Op: {f.numeroOperacion}
                    </p>
                  )}
                </div>
                <span className="font-mono text-sm font-semibold text-emerald-600">
                  {formatCurrency(f.monto)}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Dialog de cobro */}
      <RegistrarCobroDialog
        open={cobroOpen}
        onOpenChange={setCobroOpen}
        servicioId={servicio.id}
        montoCobradoActual={servicio.montoCobrado}
        montoRestante={servicio.montoRestante}
        precioFinal={servicio.precioFinal}
        cuentas={cuentas}
      />
    </div>
  );
}

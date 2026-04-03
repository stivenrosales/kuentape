"use client";

import * as React from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Paperclip, FileIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";
import { formatDate } from "@/lib/format";
import { updateIncidenciaEstadoAction } from "@/features/incidencias/actions";
import type { Prioridad, EstadoIncidencia } from "@prisma/client";

interface Adjunto {
  id: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  url: string;
  createdAt: Date;
}

interface IncidenciaDetailProps {
  incidencia: {
    id: string;
    titulo: string;
    descripcion: string;
    detalleFinanciero: string | null;
    prioridad: Prioridad;
    estado: EstadoIncidencia;
    periodo: string | null;
    fechaLimite: Date | null;
    createdAt: Date;
    persona: { id: string; razonSocial: string; ruc: string };
    contador: { id: string; nombre: string; apellido: string; email: string };
    adjuntos: Adjunto[];
  };
  canEdit: boolean;
}

const PRIORIDAD_STYLE: Record<Prioridad, string> = {
  ALTA: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 border-transparent",
  MEDIA: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 border-transparent",
  BAJA: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 border-transparent",
};

const ESTADO_LABEL: Record<EstadoIncidencia, string> = {
  ABIERTA: "Abierta",
  EN_PROGRESO: "En Progreso",
  RESUELTA: "Resuelta",
  CERRADA: "Cerrada",
};

const ESTADO_STYLE: Record<EstadoIncidencia, string> = {
  ABIERTA: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border-transparent",
  EN_PROGRESO: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 border-transparent",
  RESUELTA: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 border-transparent",
  CERRADA: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 border-transparent",
};

const ESTADOS: EstadoIncidencia[] = ["ABIERTA", "EN_PROGRESO", "RESUELTA", "CERRADA"];

export function IncidenciaDetailClient({ incidencia, canEdit }: IncidenciaDetailProps) {
  const [estado, setEstado] = React.useState<EstadoIncidencia>(incidencia.estado);
  const [saving, setSaving] = React.useState(false);

  async function handleEstadoChange(v: string) {
    const nuevoEstado = v as EstadoIncidencia;
    setEstado(nuevoEstado);
    setSaving(true);
    const result = await updateIncidenciaEstadoAction(incidencia.id, nuevoEstado);
    if (result && "error" in result) {
      toast.error("Error al actualizar");
      setEstado(incidencia.estado);
    } else {
      toast.success("Estado actualizado");
    }
    setSaving(false);
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1">
            <Badge className={`text-[10px] ${PRIORIDAD_STYLE[incidencia.prioridad]}`}>{incidencia.prioridad}</Badge>
            <Badge className={`text-[10px] ${ESTADO_STYLE[estado]}`}>{ESTADO_LABEL[estado]}</Badge>
            {incidencia.periodo && <span className="text-xs text-muted-foreground font-mono">{incidencia.periodo}</span>}
          </div>
          <h1 className="text-lg font-bold">{incidencia.titulo}</h1>
          <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
            <Link href={`/clientes/${incidencia.persona.id}`} className="hover:text-primary transition-colors">{incidencia.persona.razonSocial}</Link>
            <span>·</span>
            <span>{incidencia.contador.nombre} {incidencia.contador.apellido}</span>
            <span>·</span>
            <span>{formatDate(incidencia.createdAt)}</span>
          </div>
        </div>
        {canEdit && (
          <Select value={estado} onValueChange={handleEstadoChange}>
            <SelectTrigger className="h-8 w-[140px] text-xs shrink-0">{ESTADO_LABEL[estado]}</SelectTrigger>
            <SelectContent>
              {ESTADOS.map((e) => <SelectItem key={e} value={e}>{ESTADO_LABEL[e]}</SelectItem>)}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Body — two columns */}
      <div className="grid grid-cols-3 gap-4">
        {/* Left: content */}
        <div className="col-span-2 space-y-4">
          {/* Descripción */}
          <div className="rounded-lg border border-border bg-card shadow-sm p-4">
            <h3 className="text-xs font-medium text-muted-foreground mb-2">Descripción</h3>
            <p className="text-sm whitespace-pre-wrap leading-relaxed">{incidencia.descripcion || "Sin descripción"}</p>
          </div>

          {/* Detalle Financiero */}
          {incidencia.detalleFinanciero && (
            <div className="rounded-lg border border-border bg-card shadow-sm p-4">
              <h3 className="text-xs font-medium text-muted-foreground mb-2">Detalle Financiero</h3>
              <p className="text-sm whitespace-pre-wrap leading-relaxed">{incidencia.detalleFinanciero}</p>
            </div>
          )}

          {/* Adjuntos */}
          <div className="rounded-lg border border-border bg-card shadow-sm p-4">
            <h3 className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1.5">
              <Paperclip className="h-3 w-3" /> Adjuntos ({incidencia.adjuntos.length})
            </h3>
            {incidencia.adjuntos.length === 0 ? (
              <p className="text-xs text-muted-foreground">Sin archivos adjuntos</p>
            ) : (
              <div className="space-y-1.5">
                {incidencia.adjuntos.map((adj) => (
                  <div key={adj.id} className="flex items-center gap-2 rounded border border-border/50 px-3 py-1.5 text-xs hover:bg-muted/20 transition-colors">
                    <FileIcon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <span className="truncate flex-1 font-medium">{adj.fileName}</span>
                    <span className="text-muted-foreground shrink-0">{(adj.fileSize / 1024).toFixed(0)} KB</span>
                    <a href={adj.url} target="_blank" rel="noopener" className="text-primary hover:underline shrink-0">Abrir</a>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: sidebar info */}
        <div className="space-y-4">
          <div className="rounded-lg border border-border bg-card shadow-sm p-4 space-y-3">
            <div>
              <span className="text-[10px] text-muted-foreground">Empresa</span>
              <p className="text-sm font-medium mt-0.5">
                <Link href={`/clientes/${incidencia.persona.id}`} className="hover:text-primary transition-colors">
                  {incidencia.persona.razonSocial}
                </Link>
              </p>
              <p className="text-xs font-mono text-muted-foreground">{incidencia.persona.ruc}</p>
            </div>
            <div className="border-t border-border/50 pt-2">
              <span className="text-[10px] text-muted-foreground">Contador</span>
              <p className="text-sm font-medium mt-0.5">{incidencia.contador.nombre} {incidencia.contador.apellido}</p>
              <p className="text-xs text-muted-foreground">{incidencia.contador.email}</p>
            </div>
            <div className="border-t border-border/50 pt-2">
              <span className="text-[10px] text-muted-foreground">Periodo</span>
              <p className="text-sm font-mono font-medium mt-0.5">{incidencia.periodo ?? "—"}</p>
            </div>
            <div className="border-t border-border/50 pt-2">
              <span className="text-[10px] text-muted-foreground">Fecha Límite</span>
              <p className="text-sm font-medium mt-0.5">{incidencia.fechaLimite ? formatDate(incidencia.fechaLimite) : "Sin límite"}</p>
            </div>
            <div className="border-t border-border/50 pt-2">
              <span className="text-[10px] text-muted-foreground">Creada</span>
              <p className="text-sm font-medium mt-0.5">{formatDate(incidencia.createdAt)}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

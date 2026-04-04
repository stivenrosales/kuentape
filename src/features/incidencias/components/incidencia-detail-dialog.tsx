"use client";

import * as React from "react";
import { X, Loader2Icon, AlertTriangle, Building2, User, Calendar, Paperclip, FileIcon, MessageSquare, DollarSign } from "lucide-react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";
import { toast } from "sonner";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import { getIncidenciaDetailAction, updateIncidenciaEstadoAction } from "../actions";
import type { Prioridad, EstadoIncidencia } from "@prisma/client";

const PRIORIDAD_STYLE: Record<string, string> = {
  ALTA: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 border-transparent",
  MEDIA: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 border-transparent",
  BAJA: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 border-transparent",
};

const ESTADO_LABEL: Record<string, string> = {
  ABIERTA: "Abierta",
  EN_PROGRESO: "En Progreso",
  RESUELTA: "Resuelta",
  CERRADA: "Cerrada",
};

const ESTADO_STYLE: Record<string, string> = {
  ABIERTA: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border-transparent",
  EN_PROGRESO: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 border-transparent",
  RESUELTA: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 border-transparent",
  CERRADA: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 border-transparent",
};

const ESTADOS = ["ABIERTA", "EN_PROGRESO", "RESUELTA", "CERRADA"];

interface Props {
  incidenciaId: string;
  onClose: () => void;
}

export function IncidenciaDetailDialog({ incidenciaId, onClose }: Props) {
  const router = useRouter();
  const [data, setData] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  const [estado, setEstado] = React.useState<string>("");

  React.useEffect(() => {
    setLoading(true);
    getIncidenciaDetailAction(incidenciaId)
      .then((d) => { setData(d); if (d) setEstado(d.estado); })
      .finally(() => setLoading(false));
  }, [incidenciaId]);

  React.useEffect(() => {
    function handleEsc(e: KeyboardEvent) { if (e.key === "Escape") { e.stopImmediatePropagation(); handleClose(); } }
    document.addEventListener("keydown", handleEsc, true);
    return () => document.removeEventListener("keydown", handleEsc, true);
  }, []);

  function handleClose() {
    router.refresh();
    onClose();
  }

  async function handleEstadoChange(v: string | null) {
    if (!v || !data) return;
    setEstado(v);
    const result = await updateIncidenciaEstadoAction(data.id, v as EstadoIncidencia);
    if (result && "error" in result) {
      toast.error("Error al actualizar");
      setEstado(data.estado);
    } else {
      toast.success("Estado actualizado");
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={handleClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />
      <div
        className="relative w-full max-w-lg bg-card rounded-lg shadow-2xl overflow-hidden animate-in zoom-in-95 fade-in duration-150 flex flex-col max-h-[85vh] my-4"
        onClick={(e) => e.stopPropagation()}
      >
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2Icon className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : !data ? (
          <div className="flex items-center justify-center py-24">
            <p className="text-sm text-muted-foreground">Incidencia no encontrada</p>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="flex items-start justify-between px-5 pt-4 pb-3 border-b border-border flex-shrink-0">
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <Badge className={`text-[10px] ${PRIORIDAD_STYLE[data.prioridad]}`}>{data.prioridad}</Badge>
                  <Badge className={`text-[10px] ${ESTADO_STYLE[estado]}`}>{ESTADO_LABEL[estado]}</Badge>
                  {data.periodo && <span className="text-[10px] text-muted-foreground font-mono">{data.periodo}</span>}
                </div>
                <h2 className="text-base font-bold text-foreground">{data.titulo}</h2>
              </div>
              <button onClick={handleClose} className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted shrink-0 ml-3">
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Body */}
            <div className="overflow-y-auto flex-1">
              <div className="px-5 py-4 space-y-4">

                {/* Estado selector */}
                <Section title="Estado">
                  <Select value={estado} onValueChange={handleEstadoChange}>
                    <SelectTrigger className="h-8 w-full text-xs">{ESTADO_LABEL[estado]}</SelectTrigger>
                    <SelectContent>
                      {ESTADOS.map((e) => <SelectItem key={e} value={e}>{ESTADO_LABEL[e]}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </Section>

                {/* Información */}
                <Section title="Información">
                  <DetailRow icon={<Building2 className="h-3.5 w-3.5" />} label="Empresa">
                    {data.persona.razonSocial}
                  </DetailRow>
                  <DetailRow icon={<User className="h-3.5 w-3.5" />} label="Contador">
                    {data.contador.nombre} {data.contador.apellido}
                  </DetailRow>
                  <DetailRow icon={<Calendar className="h-3.5 w-3.5" />} label="Creada">
                    {formatDate(data.createdAt)}
                  </DetailRow>
                  {data.fechaLimite && (
                    <DetailRow icon={<AlertTriangle className="h-3.5 w-3.5" />} label="Fecha límite">
                      {formatDate(data.fechaLimite)}
                    </DetailRow>
                  )}
                </Section>

                {/* Descripción */}
                <Section title="Descripción">
                  <p className="text-xs whitespace-pre-wrap leading-relaxed text-foreground">
                    {data.descripcion || "Sin descripción"}
                  </p>
                </Section>

                {/* Detalle Financiero */}
                {data.detalleFinanciero && (
                  <Section title="Detalle Financiero">
                    <p className="text-xs whitespace-pre-wrap leading-relaxed text-foreground">
                      {data.detalleFinanciero}
                    </p>
                  </Section>
                )}

                {/* Adjuntos */}
                <Section title={`Adjuntos (${data.adjuntos?.length ?? 0})`}>
                  {(!data.adjuntos || data.adjuntos.length === 0) ? (
                    <p className="text-xs text-muted-foreground">Sin archivos adjuntos</p>
                  ) : (
                    <div className="space-y-1.5">
                      {data.adjuntos.map((adj: any) => (
                        <a
                          key={adj.id}
                          href={adj.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 rounded-lg border border-border/50 px-3 py-2 text-xs hover:bg-muted/40 transition-colors"
                        >
                          <FileIcon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                          <span className="truncate flex-1 font-medium">{adj.fileName}</span>
                          <span className="text-muted-foreground shrink-0">{(adj.fileSize / 1024).toFixed(0)} KB</span>
                        </a>
                      ))}
                    </div>
                  )}
                </Section>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">{title}</h3>
      <div className="space-y-1.5">{children}</div>
    </div>
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

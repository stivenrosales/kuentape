"use client";

import * as React from "react";
import { X, Calendar, BookOpen, Building2, User, ZoomIn, UploadIcon, Loader2Icon, Trash2Icon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { updateConstanciaAction, removeConstanciaAction } from "../actions";
import type { LibroRow } from "./libros-table";

const MESES = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

interface Props {
  libro: LibroRow;
  onClose: () => void;
}

export function LibroDetailDialog({ libro, onClose }: Props) {
  const [completado, setCompletado] = React.useState(libro.completado);
  const [constanciaUrl, setConstanciaUrl] = React.useState(libro.constanciaUrl);
  const [uploading, setUploading] = React.useState(false);
  const [removing, setRemoving] = React.useState(false);
  const [imageExpanded, setImageExpanded] = React.useState(false);
  const didChangeRef = React.useRef(false);

  React.useEffect(() => {
    function handleEsc(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.stopImmediatePropagation();
        if (imageExpanded) setImageExpanded(false);
        else handleClose();
      }
    }
    document.addEventListener("keydown", handleEsc, true);
    return () => document.removeEventListener("keydown", handleEsc, true);
  }, [imageExpanded]);

  function handleClose() {
    if (didChangeRef.current) window.location.reload();
    onClose();
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "constancias");
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      if (!res.ok) { toast.error("Error al subir"); return; }
      const { url } = await res.json();

      const result = await updateConstanciaAction(libro.id, url);
      if ("error" in result && result.error) { toast.error("Error al guardar"); return; }

      setConstanciaUrl(url);
      setCompletado(true);
      didChangeRef.current = true;
      toast.success("Constancia subida — libro completado automáticamente");
    } catch { toast.error("Error al subir"); }
    finally { setUploading(false); }
  }

  async function handleRemove() {
    setRemoving(true);
    const result = await removeConstanciaAction(libro.id);
    setRemoving(false);
    if ("error" in result && result.error) { toast.error("Error al eliminar"); return; }
    setConstanciaUrl(null);
    setCompletado(false);
    didChangeRef.current = true;
    toast.success("Constancia eliminada — libro marcado como pendiente");
  }

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={handleClose}>
        <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />
        <div className="relative w-full max-w-md bg-card rounded-lg shadow-2xl overflow-hidden animate-in zoom-in-95 fade-in duration-150 flex flex-col max-h-[85vh]" onClick={(e) => e.stopPropagation()}>
          {/* Header */}
          <div className="flex items-start justify-between px-5 pt-4 pb-3 border-b border-border shrink-0">
            <div className="flex items-center gap-2.5 min-w-0">
              <BookOpen className="h-5 w-5 shrink-0 text-primary" />
              <div className="min-w-0">
                <h2 className="text-sm font-bold truncate">{libro.tipoLibro}</h2>
                <Badge className={cn("mt-0.5 text-[10px]", completado
                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 border-transparent"
                  : "bg-muted text-muted-foreground border-transparent"
                )}>
                  {completado ? "Completado" : "Pendiente"}
                </Badge>
              </div>
            </div>
            <button onClick={handleClose} className="ml-3 shrink-0 p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted">
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Body */}
          <div className="overflow-y-auto flex-1 px-5 py-4 space-y-4">
            {/* Detalles */}
            <div className="space-y-2">
              <DetailRow icon={<Calendar className="h-3.5 w-3.5" />} label="Período">
                {MESES[libro.mes - 1]} {libro.anio}
              </DetailRow>
              <DetailRow icon={<Building2 className="h-3.5 w-3.5" />} label="Empresa">
                {libro.persona.razonSocial}
              </DetailRow>
              <DetailRow icon={<User className="h-3.5 w-3.5" />} label="Responsable">
                {libro.persona.contadorAsignado.nombre} {libro.persona.contadorAsignado.apellido}
              </DetailRow>
            </div>

            {/* Constancia — estilo comprobantes de finanzas */}
            <div>
              <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground mb-2">Constancia</p>
              {constanciaUrl ? (
                <>
                  <div
                    className="relative rounded-lg border border-border overflow-hidden cursor-pointer group"
                    onClick={() => setImageExpanded(true)}
                  >
                    <img src={constanciaUrl} alt="Constancia" className="w-full h-48 object-contain bg-muted/20" />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                      <ZoomIn className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </div>
                  {/* Acciones: cambiar o eliminar */}
                  <div className="flex items-center gap-2 mt-2">
                    <label className="flex-1 flex items-center justify-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs text-muted-foreground hover:bg-muted/40 hover:text-foreground cursor-pointer transition-colors">
                      <UploadIcon className="h-3 w-3" />
                      Cambiar
                      <input type="file" className="hidden" accept="image/*,application/pdf" onChange={handleUpload} disabled={uploading} />
                    </label>
                    <button
                      onClick={handleRemove}
                      disabled={removing}
                      className="flex items-center gap-1.5 rounded-lg border border-destructive/30 px-3 py-1.5 text-xs text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-50"
                    >
                      <Trash2Icon className="h-3 w-3" />
                      {removing ? "..." : "Eliminar"}
                    </button>
                  </div>
                </>
              ) : (
                <label className="flex items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border py-6 cursor-pointer hover:border-primary/40 hover:bg-muted/20 transition-colors">
                  {uploading ? (
                    <Loader2Icon className="h-4 w-4 animate-spin text-muted-foreground" />
                  ) : (
                    <>
                      <UploadIcon className="h-4 w-4 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">Subir constancia (marca como completado)</span>
                    </>
                  )}
                  <input type="file" className="hidden" accept="image/*,application/pdf" onChange={handleUpload} disabled={uploading} />
                </label>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Imagen expandida fullscreen */}
      {imageExpanded && constanciaUrl && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-8 bg-black/80" onClick={() => setImageExpanded(false)}>
          <button className="absolute top-4 right-4 p-2 rounded-full bg-white/20 text-white hover:bg-white/30 transition-colors">
            <X className="h-5 w-5" />
          </button>
          <img src={constanciaUrl} alt="Constancia" className="max-w-full max-h-full object-contain rounded-lg" onClick={(e) => e.stopPropagation()} />
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

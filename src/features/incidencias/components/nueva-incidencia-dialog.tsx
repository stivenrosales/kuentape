"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { toast } from "sonner";
import { createIncidenciaAction } from "@/features/incidencias/actions";
import { SearchableSelect } from "@/components/searchable-select";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";

interface Props {
  personas: { id: string; razonSocial: string }[];
  contadores: { id: string; nombre: string; apellido: string }[];
  currentUserId: string;
  isContador: boolean;
}

export function NuevaIncidenciaDialog({ personas, contadores, currentUserId, isContador }: Props) {
  const [open, setOpen] = React.useState(false);
  const router = useRouter();

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-full bg-primary px-5 py-2 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors"
      >
        + Nueva Incidencia
      </button>
    );
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-full bg-primary px-5 py-2 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors"
      >
        + Nueva Incidencia
      </button>
      <IncidenciaFormDialog
        personas={personas}
        contadores={contadores}
        currentUserId={currentUserId}
        isContador={isContador}
        onClose={() => setOpen(false)}
        onSuccess={() => { setOpen(false); router.refresh(); }}
      />
    </>
  );
}

function IncidenciaFormDialog({
  personas,
  contadores,
  currentUserId,
  isContador,
  onClose,
  onSuccess,
}: Props & { onClose: () => void; onSuccess: () => void }) {
  const [personaId, setPersonaId] = React.useState("");
  const contadorId = currentUserId;
  const [titulo, setTitulo] = React.useState("");
  const [descripcion, setDescripcion] = React.useState("");
  const [detalleFinanciero, setDetalleFinanciero] = React.useState("");
  const [prioridad, setPrioridad] = React.useState("MEDIA");
  const [periodo, setPeriodo] = React.useState("");
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    function handleEsc(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!personaId) { toast.error("Seleccioná una empresa"); return; }
    if (!titulo.trim()) { toast.error("El título es requerido"); return; }
    if (!contadorId) { toast.error("Seleccioná un contador"); return; }

    setSaving(true);
    const formData = new FormData();
    formData.set("personaId", personaId);
    formData.set("contadorId", contadorId);
    formData.set("titulo", titulo);
    formData.set("descripcion", descripcion);
    formData.set("detalleFinanciero", detalleFinanciero);
    formData.set("prioridad", prioridad);
    if (periodo) formData.set("periodo", periodo);

    const result = await createIncidenciaAction(formData as any);
    if (result && "error" in result) {
      toast.error(typeof result.error === "string" ? result.error : "Error al crear");
    } else {
      toast.success("Incidencia creada");
      onSuccess();
    }
    setSaving(false);
  }

  const inputClass = "w-full h-8 rounded-md border border-input bg-background px-3 text-sm outline-none focus:ring-1 focus:ring-primary";
  const labelClass = "text-xs font-medium text-foreground block mb-1";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />
      <div className="relative w-full max-w-lg bg-card rounded-lg shadow-2xl overflow-hidden animate-in zoom-in-95 fade-in duration-150" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-border">
          <h2 className="text-sm font-bold">Nueva Incidencia</h2>
          <button onClick={onClose} className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted"><X className="h-4 w-4" /></button>
        </div>

        <form onSubmit={handleSubmit} className="px-5 py-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className={labelClass}>Empresa *</label>
              <SearchableSelect
                options={personas.map((p) => ({ value: p.id, label: p.razonSocial }))}
                value={personaId}
                onChange={setPersonaId}
                placeholder="Buscar empresa..."
              />
            </div>
            <div className="col-span-2">
              <label className={labelClass}>Título *</label>
              <input type="text" value={titulo} onChange={(e) => setTitulo(e.target.value)} className={inputClass} placeholder="Descripción breve" autoFocus />
            </div>
            <div>
              <label className={labelClass}>Prioridad</label>
              <Select value={prioridad} onValueChange={setPrioridad}>
                <SelectTrigger className="h-8 text-sm">{prioridad === "ALTA" ? "Alta" : prioridad === "MEDIA" ? "Media" : "Baja"}</SelectTrigger>
                <SelectContent>
                  <SelectItem value="BAJA">Baja</SelectItem>
                  <SelectItem value="MEDIA">Media</SelectItem>
                  <SelectItem value="ALTA">Alta</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2">
              <label className={labelClass}>Descripción</label>
              <textarea value={descripcion} onChange={(e) => setDescripcion(e.target.value)} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary resize-none" rows={2} placeholder="Detalle de la incidencia..." />
            </div>
            <div className="col-span-2">
              <label className={labelClass}>Detalle Financiero</label>
              <input type="text" value={detalleFinanciero} onChange={(e) => setDetalleFinanciero(e.target.value)} className={inputClass} placeholder="Monto, concepto, etc. (opcional)" />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="text-sm text-muted-foreground hover:text-foreground px-3 py-1.5">Cancelar</button>
            <button type="submit" disabled={saving} className="rounded-lg bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
              {saving ? "Creando..." : "Crear Incidencia"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

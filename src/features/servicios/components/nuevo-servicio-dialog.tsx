"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { toast } from "sonner";
import { createServicioAction } from "@/features/servicios/actions";
import { formatCurrency } from "@/lib/format";
import { computeIGV, computeTotalImponible } from "@/lib/pricing";
import { SearchableSelect } from "@/components/searchable-select";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";

interface Props {
  tiposServicio: { id: string; nombre: string; categoria: string; requierePeriodo: boolean }[];
  personas: { id: string; razonSocial: string }[];
  contadores: { id: string; nombre: string; apellido: string }[];
  currentUserId: string;
  isContador: boolean;
}

export function NuevoServicioDialog({ tiposServicio, personas, contadores, currentUserId, isContador }: Props) {
  const [open, setOpen] = React.useState(false);
  const router = useRouter();

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-full bg-primary px-5 py-2 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors"
      >
        + Nuevo Servicio
      </button>
      {open && (
        <ServicioFormDialog
          tiposServicio={tiposServicio}
          personas={personas}
          contadores={contadores}
          currentUserId={currentUserId}
          isContador={isContador}
          onClose={() => setOpen(false)}
          onSuccess={() => { setOpen(false); router.refresh(); }}
        />
      )}
    </>
  );
}

function ServicioFormDialog({
  tiposServicio,
  personas,
  contadores,
  currentUserId,
  isContador,
  onClose,
  onSuccess,
}: Props & { onClose: () => void; onSuccess: () => void }) {
  const [personaId, setPersonaId] = React.useState("");
  const [tipoServicioId, setTipoServicioId] = React.useState(tiposServicio[0]?.id ?? "");
  const contadorId = currentUserId;
  const [periodoMes, setPeriodoMes] = React.useState(String(new Date().getMonth()).padStart(2, "0"));
  const [periodoAnio, setPeriodoAnio] = React.useState(String(new Date().getFullYear()));
  const [baseImponible, setBaseImponible] = React.useState("");
  const [noGravado, setNoGravado] = React.useState("");
  const [descuento, setDescuento] = React.useState("");
  const [saving, setSaving] = React.useState(false);

  const selectedTipo = tiposServicio.find((t) => t.id === tipoServicioId);

  // Live preview
  const baseVal = Math.round((parseFloat(baseImponible) || 0) * 100);
  const noGravVal = Math.round((parseFloat(noGravado) || 0) * 100);
  const igv = computeIGV(baseVal);
  const totalImp = computeTotalImponible(baseVal, igv, noGravVal);

  React.useEffect(() => {
    function handleEsc(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!personaId) { toast.error("Seleccioná una empresa"); return; }
    if (!contadorId) { toast.error("Seleccioná un contador"); return; }

    setSaving(true);
    const periodo = selectedTipo?.requierePeriodo ? `${periodoAnio}-${periodoMes}` : undefined;
    const descVal = Math.round((parseFloat(descuento) || 0) * 100);

    const result = await createServicioAction({
      personaId,
      tipoServicioId,
      contadorId,
      periodo,
      baseImponible: baseVal,
      noGravado: noGravVal,
      descuento: descVal,
    } as any);

    if (result && "error" in result) {
      toast.error(typeof result.error === "string" ? result.error : "Error al crear");
    } else {
      toast.success("Servicio creado");
      onSuccess();
    }
    setSaving(false);
  }

  const inputClass = "w-full h-8 rounded-md border border-input bg-background px-3 text-sm outline-none focus:ring-1 focus:ring-primary";
  const labelClass = "text-xs font-medium text-foreground block mb-1";
  const MESES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />
      <div className="relative w-full max-w-lg bg-card rounded-lg shadow-2xl overflow-hidden animate-in zoom-in-95 fade-in duration-150" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-border">
          <h2 className="text-sm font-bold">Nuevo Servicio</h2>
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
            <div>
              <label className={labelClass}>Tipo de Servicio *</label>
              <Select value={tipoServicioId} onValueChange={setTipoServicioId}>
                <SelectTrigger className="h-8 text-sm">{selectedTipo?.nombre ?? "Seleccionar..."}</SelectTrigger>
                <SelectContent>
                  {tiposServicio.map((t) => <SelectItem key={t.id} value={t.id}>{t.nombre}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {selectedTipo?.requierePeriodo && (
              <>
                <div>
                  <label className={labelClass}>Mes</label>
                  <Select value={periodoMes} onValueChange={setPeriodoMes}>
                    <SelectTrigger className="h-8 text-sm">{MESES[parseInt(periodoMes) - 1] ?? "Mes"}</SelectTrigger>
                    <SelectContent>
                      {MESES.map((m, i) => <SelectItem key={i} value={String(i + 1).padStart(2, "0")}>{m}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className={labelClass}>Año</label>
                  <Select value={periodoAnio} onValueChange={setPeriodoAnio}>
                    <SelectTrigger className="h-8 text-sm">{periodoAnio}</SelectTrigger>
                    <SelectContent>
                      {["2024","2025","2026","2027"].map((y) => <SelectItem key={y} value={y}>{y}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            <div>
              <label className={labelClass}>Base Imponible</label>
              <div className="flex items-center rounded-md border border-input bg-background">
                <span className="px-2 text-xs text-muted-foreground border-r border-input bg-muted/30 h-8 flex items-center">S/.</span>
                <input type="text" value={baseImponible} onChange={(e) => setBaseImponible(e.target.value)} className="flex-1 px-2 h-8 text-sm font-mono bg-transparent outline-none" placeholder="0.00" />
              </div>
            </div>
            <div>
              <label className={labelClass}>No Gravado</label>
              <div className="flex items-center rounded-md border border-input bg-background">
                <span className="px-2 text-xs text-muted-foreground border-r border-input bg-muted/30 h-8 flex items-center">S/.</span>
                <input type="text" value={noGravado} onChange={(e) => setNoGravado(e.target.value)} className="flex-1 px-2 h-8 text-sm font-mono bg-transparent outline-none" placeholder="0.00" />
              </div>
            </div>
            <div>
              <label className={labelClass}>Descuento</label>
              <div className="flex items-center rounded-md border border-input bg-background">
                <span className="px-2 text-xs text-muted-foreground border-r border-input bg-muted/30 h-8 flex items-center">S/.</span>
                <input type="text" value={descuento} onChange={(e) => setDescuento(e.target.value)} className="flex-1 px-2 h-8 text-sm font-mono bg-transparent outline-none" placeholder="0.00" />
              </div>
            </div>
            <div>
              <label className={labelClass}>Preview</label>
              <div className="text-xs text-muted-foreground space-y-0.5 mt-1">
                <p>IGV: <span className="font-mono">{formatCurrency(igv)}</span></p>
                <p>Total: <span className="font-mono">{formatCurrency(totalImp)}</span></p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="text-sm text-muted-foreground hover:text-foreground px-3 py-1.5">Cancelar</button>
            <button type="submit" disabled={saving} className="rounded-lg bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
              {saving ? "Creando..." : "Crear Servicio"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

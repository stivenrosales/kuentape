"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { toast } from "sonner";
import { createPersonaAction } from "@/features/personas/actions";
import { SearchableSelect } from "@/components/searchable-select";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";

interface Props {
  contadores: { id: string; nombre: string; apellido: string }[];
}

export function NuevoClienteDialog({ contadores }: Props) {
  const [open, setOpen] = React.useState(false);
  const router = useRouter();

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-full bg-primary px-5 py-2 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors"
      >
        + Nuevo Cliente
      </button>
      {open && (
        <ClienteFormDialog
          contadores={contadores}
          onClose={() => setOpen(false)}
          onSuccess={() => { setOpen(false); router.refresh(); }}
        />
      )}
    </>
  );
}

function ClienteFormDialog({
  contadores,
  onClose,
  onSuccess,
}: Props & { onClose: () => void; onSuccess: () => void }) {
  const [razonSocial, setRazonSocial] = React.useState("");
  const [ruc, setRuc] = React.useState("");
  const [tipoPersona, setTipoPersona] = React.useState("JURIDICA");
  const [regimen, setRegimen] = React.useState("MYPE");
  const [contadorAsignadoId, setContadorAsignadoId] = React.useState(contadores[0]?.id ?? "");
  const [direccion, setDireccion] = React.useState("");
  const [telefono, setTelefono] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    function handleEsc(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!razonSocial.trim()) { toast.error("Razón social es requerida"); return; }
    if (!ruc || ruc.length !== 11) { toast.error("RUC debe tener 11 dígitos"); return; }
    if (!contadorAsignadoId) { toast.error("Seleccioná un contador"); return; }

    setSaving(true);
    const result = await createPersonaAction({
      razonSocial,
      ruc,
      tipoPersona: tipoPersona as any,
      regimen: regimen as any,
      contadorAsignadoId,
      direccion: direccion || undefined,
      telefono: telefono || undefined,
      email: email || undefined,
    } as any);

    if (result && "error" in result) {
      const msg = typeof (result as any).error === "string" ? (result as any).error : Object.values((result as any).error as any).flat().join(", ");
      toast.error(msg);
    } else {
      toast.success("Cliente creado");
      onSuccess();
    }
    setSaving(false);
  }

  const inputClass = "w-full h-8 rounded-md border border-input bg-background px-3 text-sm outline-none focus:ring-1 focus:ring-primary";
  const labelClass = "text-xs font-medium text-foreground block mb-1";

  const TIPO_OPTIONS = [
    { value: "JURIDICA", label: "Persona Jurídica" },
    { value: "NATURAL", label: "Persona Natural" },
    { value: "IMMUNOTEC", label: "Immunotec" },
    { value: "FOUR_LIFE", label: "4Life" },
    { value: "RXH", label: "RXH" },
  ];

  const REGIMEN_OPTIONS = [
    { value: "MYPE", label: "MYPE" },
    { value: "RER", label: "RER" },
    { value: "REG", label: "General" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />
      <div className="relative w-full max-w-lg bg-card rounded-lg shadow-2xl overflow-hidden animate-in zoom-in-95 fade-in duration-150 max-h-[85vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-border shrink-0">
          <h2 className="text-sm font-bold">Nuevo Cliente</h2>
          <button onClick={onClose} className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted"><X className="h-4 w-4" /></button>
        </div>

        <form onSubmit={handleSubmit} className="px-5 py-4 space-y-3 overflow-y-auto flex-1">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className={labelClass}>Razón Social / Nombre *</label>
              <input type="text" value={razonSocial} onChange={(e) => setRazonSocial(e.target.value)} className={inputClass} placeholder="Nombre de la empresa o persona" autoFocus />
            </div>
            <div>
              <label className={labelClass}>RUC *</label>
              <input type="text" value={ruc} onChange={(e) => setRuc(e.target.value.replace(/\D/g, "").slice(0, 11))} className={`${inputClass} font-mono`} placeholder="11 dígitos" maxLength={11} />
            </div>
            <div>
              <label className={labelClass}>Tipo *</label>
              <Select value={tipoPersona} onValueChange={(v) => v && setTipoPersona(v)}>
                <SelectTrigger className="h-8 text-sm">{TIPO_OPTIONS.find(o => o.value === tipoPersona)?.label}</SelectTrigger>
                <SelectContent>
                  {TIPO_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className={labelClass}>Régimen *</label>
              <Select value={regimen} onValueChange={(v) => v && setRegimen(v)}>
                <SelectTrigger className="h-8 text-sm">{REGIMEN_OPTIONS.find(o => o.value === regimen)?.label}</SelectTrigger>
                <SelectContent>
                  {REGIMEN_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className={labelClass}>Contador *</label>
              <SearchableSelect
                options={contadores.map(c => ({ value: c.id, label: `${c.nombre} ${c.apellido}` }))}
                value={contadorAsignadoId}
                onChange={setContadorAsignadoId}
                placeholder="Seleccionar..."
              />
            </div>
            <div>
              <label className={labelClass}>Teléfono</label>
              <input type="text" value={telefono} onChange={(e) => setTelefono(e.target.value)} className={inputClass} placeholder="Opcional" />
            </div>
            <div>
              <label className={labelClass}>Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} placeholder="Opcional" />
            </div>
            <div className="col-span-2">
              <label className={labelClass}>Dirección</label>
              <input type="text" value={direccion} onChange={(e) => setDireccion(e.target.value)} className={inputClass} placeholder="Opcional" />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="text-sm text-muted-foreground hover:text-foreground px-3 py-1.5">Cancelar</button>
            <button type="submit" disabled={saving} className="rounded-lg bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
              {saving ? "Creando..." : "Crear Cliente"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

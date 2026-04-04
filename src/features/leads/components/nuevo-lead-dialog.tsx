"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, X } from "lucide-react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { createLeadAction } from "@/features/leads/actions";
import type { CreateLeadInput } from "@/features/leads/schemas";

const RUBROS = [
  "Transportes A",
  "Transportes B",
  "Transportes C",
  "Servicios y Constructoras",
  "Constructoras",
  "Inmuebles Lotes",
  "Inmuebles Casas",
  "Redes de Mercadeo",
  "Otros",
];

const REGIMEN_OPTIONS = [
  { value: "MYPE", label: "MYPE" },
  { value: "RER", label: "RER" },
  { value: "REG", label: "Régimen General" },
];

interface Props {
  staff: { id: string; nombre: string; apellido: string }[];
}

// ─── Trigger button + dialog ─────────────────────────────────────

export function NuevoLeadDialog({ staff }: Props) {
  const [open, setOpen] = React.useState(false);
  const router = useRouter();

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-full bg-primary px-5 py-2 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors"
      >
        <Plus className="h-4 w-4" />
        Nuevo prospecto
      </button>

      {open && (
        <NuevoLeadFormDialog
          staff={staff}
          onClose={() => setOpen(false)}
          onSuccess={() => {
            setOpen(false);
            router.refresh();
          }}
        />
      )}
    </>
  );
}

// ─── Form dialog ─────────────────────────────────────────────────

function NuevoLeadFormDialog({
  staff,
  onClose,
  onSuccess,
}: {
  staff: Props["staff"];
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [saving, setSaving] = React.useState(false);

  // Form state
  const [nombre, setNombre] = React.useState("");
  const [apellido, setApellido] = React.useState("");
  const [celular, setCelular] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [dni, setDni] = React.useState("");
  const [regimen, setRegimen] = React.useState<string>("");
  const [rubro, setRubro] = React.useState<string>("");
  const [numTrabajadores, setNumTrabajadores] = React.useState("");
  const [notas, setNotas] = React.useState("");
  const [asignadoAId, setAsignadoAId] = React.useState("");
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  React.useEffect(() => {
    function handleEsc(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});

    const newErrors: Record<string, string> = {};
    if (!nombre.trim()) newErrors.nombre = "Requerido";
    if (!apellido.trim()) newErrors.apellido = "Requerido";
    if (!celular.trim()) newErrors.celular = "Requerido";
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setSaving(true);

    const data: CreateLeadInput = {
      nombre: nombre.trim(),
      apellido: apellido.trim(),
      celular: celular.trim(),
      email: email.trim() || undefined,
      dni: dni.trim() || undefined,
      regimen: (regimen as "MYPE" | "RER" | "REG") || undefined,
      rubro: rubro || undefined,
      numTrabajadores: numTrabajadores ? parseInt(numTrabajadores) : undefined,
      notas: notas.trim() || undefined,
      asignadoAId: asignadoAId || undefined,
    };

    const result = await createLeadAction(data);

    if (result.error) {
      toast.error("Revisá los datos ingresados");
      setSaving(false);
      return;
    }

    toast.success("Prospecto creado");
    onSuccess();
  }

  const inputClass =
    "w-full h-8 rounded-md border border-input bg-background px-3 text-sm outline-none focus:ring-1 focus:ring-primary";
  const labelClass = "text-xs font-medium text-foreground block mb-1";
  const errorClass = "text-[11px] text-destructive mt-0.5";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />
      <div
        className="relative w-full max-w-lg bg-card rounded-lg shadow-2xl overflow-hidden animate-in zoom-in-95 fade-in duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-border">
          <h2 className="text-sm font-bold">Nuevo Prospecto</h2>
          <button
            onClick={onClose}
            className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="px-5 py-4 space-y-4 max-h-[75vh] overflow-y-auto"
        >
          {/* Datos personales */}
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">
              Datos personales
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Nombre *</label>
                <input
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  className={inputClass}
                  placeholder="Juan"
                />
                {errors.nombre && <p className={errorClass}>{errors.nombre}</p>}
              </div>
              <div>
                <label className={labelClass}>Apellido *</label>
                <input
                  value={apellido}
                  onChange={(e) => setApellido(e.target.value)}
                  className={inputClass}
                  placeholder="García"
                />
                {errors.apellido && (
                  <p className={errorClass}>{errors.apellido}</p>
                )}
              </div>
              <div>
                <label className={labelClass}>Celular *</label>
                <input
                  value={celular}
                  onChange={(e) => setCelular(e.target.value)}
                  className={inputClass}
                  placeholder="987654321"
                />
                {errors.celular && (
                  <p className={errorClass}>{errors.celular}</p>
                )}
              </div>
              <div>
                <label className={labelClass}>DNI (opcional)</label>
                <input
                  value={dni}
                  onChange={(e) => setDni(e.target.value)}
                  className={inputClass}
                  placeholder="12345678"
                  maxLength={8}
                />
              </div>
              <div className="col-span-2">
                <label className={labelClass}>Email (opcional)</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={inputClass}
                  placeholder="juan@empresa.com"
                />
              </div>
            </div>
          </div>

          {/* Datos del negocio */}
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">
              Negocio
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Régimen</label>
                <Select value={regimen} onValueChange={(v) => v && setRegimen(v)}>
                  <SelectTrigger className="h-8 text-sm">
                    {regimen
                      ? REGIMEN_OPTIONS.find((r) => r.value === regimen)?.label
                      : "Seleccionar..."}
                  </SelectTrigger>
                  <SelectContent>
                    {REGIMEN_OPTIONS.map((r) => (
                      <SelectItem key={r.value} value={r.value}>
                        {r.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className={labelClass}>Rubro</label>
                <Select value={rubro} onValueChange={(v) => v && setRubro(v)}>
                  <SelectTrigger className="h-8 text-sm">
                    {rubro || "Seleccionar..."}
                  </SelectTrigger>
                  <SelectContent>
                    {RUBROS.map((r) => (
                      <SelectItem key={r} value={r}>
                        {r}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className={labelClass}>N° de trabajadores</label>
                <input
                  type="number"
                  min={0}
                  value={numTrabajadores}
                  onChange={(e) => setNumTrabajadores(e.target.value)}
                  className={inputClass}
                  placeholder="0"
                />
              </div>

              <div>
                <label className={labelClass}>Asignado a</label>
                <Select value={asignadoAId} onValueChange={(v) => v && setAsignadoAId(v)}>
                  <SelectTrigger className="h-8 text-sm">
                    {asignadoAId
                      ? (() => {
                          const s = staff.find((x) => x.id === asignadoAId);
                          return s ? `${s.nombre} ${s.apellido}` : "Sin asignar";
                        })()
                      : "Sin asignar"}
                  </SelectTrigger>
                  <SelectContent>
                    {staff.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.nombre} {s.apellido}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="col-span-2">
                <label className={labelClass}>Notas</label>
                <textarea
                  value={notas}
                  onChange={(e) => setNotas(e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary resize-none"
                  rows={2}
                  placeholder="Observaciones del prospecto..."
                />
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="text-sm text-muted-foreground hover:text-foreground px-3 py-1.5"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {saving ? "Creando..." : "Crear prospecto"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

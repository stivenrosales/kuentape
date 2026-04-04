"use client";

import * as React from "react";
import { toast } from "sonner";
import {
  Building2,
  Users,
  AlertCircle,
  BookOpen,
  Calendar,
  CreditCard,
  Star,
  CheckCircle2,
  XCircle,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { IncidenciaDetailDialog } from "@/features/incidencias/components/incidencia-detail-dialog";
import { ServicioDetailDialog } from "@/features/servicios/components/servicio-detail-dialog";
import { CredentialReveal } from "@/features/personas/components/credential-reveal";
import { updatePersonaAction, updateCredentialsAction } from "@/features/personas/actions";
import { formatCurrency, formatDate } from "@/lib/format";
import { sunatDeadlineDay } from "@/lib/sunat";
import type {
  TipoPersona,
  Regimen,
  EstadoPersona,
  EstadoCobranza,
  Prioridad,
  EstadoIncidencia,
  TipoContabilidad,
} from "@prisma/client";

// ── Types ─────────────────────────────────────────────────────────────────────

type PersonaDetail = {
  id: string;
  razonSocial: string;
  ruc: string;
  tipoPersona: TipoPersona;
  regimen: Regimen;
  estado: EstadoPersona;
  direccion: string | null;
  telefono: string | null;
  email: string | null;
  representanteNombre: string | null;
  representanteDni: string | null;
  representanteTelefono: string | null;
  detracciones: boolean;
  planilla: boolean;
  numTrabajadores: number | null;
  tipoContabilidad: TipoContabilidad;
  partidaElectronica: string | null;
  contadorAsignado: {
    id: string;
    nombre: string;
    apellido: string;
    email: string;
  };
  _count: { servicios: number; incidencias: number; libros: number };
};

type ServicioRow = {
  id: string;
  periodo: string | null;
  precioFinal: number;
  montoCobrado: number;
  montoRestante: number;
  estadoCobranza: EstadoCobranza;
  tipoServicio: { nombre: string };
};

type IncidenciaRow = {
  id: string;
  titulo: string;
  prioridad: Prioridad;
  estado: EstadoIncidencia;
  periodo: string | null;
  createdAt: Date;
};

type LibroRow = {
  id: string;
  tipoLibro: string;
  anio: number;
  mes: number;
  completado: boolean;
};

interface ClienteDetailClientProps {
  persona: PersonaDetail;
  servicios: ServicioRow[];
  incidencias: IncidenciaRow[];
  libros: LibroRow[];
  canManage: boolean;
  hideHeader?: boolean;
  showIdentityRows?: boolean;
}

// ── Label maps ─────────────────────────────────────────────────────────────────

const TIPO_LABEL: Record<TipoPersona, string> = {
  JURIDICA: "Jurídica",
  NATURAL: "Natural",
  IMMUNOTEC: "Immunotec",
  FOUR_LIFE: "Four Life",
  RXH: "Recibo por Honorarios",
};

const REGIMEN_LABEL: Record<Regimen, string> = {
  MYPE: "MYPE",
  RER: "RER",
  REG: "Régimen General",
};

const ESTADO_LABEL: Record<EstadoPersona, string> = {
  ACTIVO: "Activo",
  INACTIVO: "Inactivo",
  ARCHIVADO: "Archivado",
};

const ESTADO_BADGE: Record<EstadoPersona, string> = {
  ACTIVO:
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 border-transparent",
  INACTIVO:
    "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 border-transparent",
  ARCHIVADO:
    "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 border-transparent",
};

const COBRANZA_BADGE: Record<EstadoCobranza, { label: string; className: string }> = {
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

const PRIORIDAD_BADGE: Record<Prioridad, { label: string; className: string }> = {
  ALTA: {
    label: "Alta",
    className:
      "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 border-transparent",
  },
  MEDIA: {
    label: "Media",
    className:
      "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 border-transparent",
  },
  BAJA: {
    label: "Baja",
    className:
      "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 border-transparent",
  },
};

const INCIDENCIA_ESTADO_BADGE: Record<EstadoIncidencia, { label: string; className: string }> = {
  ABIERTA: {
    label: "Abierta",
    className:
      "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border-transparent",
  },
  EN_PROGRESO: {
    label: "En Progreso",
    className:
      "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 border-transparent",
  },
  RESUELTA: {
    label: "Resuelta",
    className:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 border-transparent",
  },
  CERRADA: {
    label: "Cerrada",
    className:
      "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 border-transparent",
  },
};

const MESES: Record<number, string> = {
  1: "Enero",
  2: "Febrero",
  3: "Marzo",
  4: "Abril",
  5: "Mayo",
  6: "Junio",
  7: "Julio",
  8: "Agosto",
  9: "Septiembre",
  10: "Octubre",
  11: "Noviembre",
  12: "Diciembre",
};

// ── Inline edit primitives ─────────────────────────────────────────────────────

interface InlineTextProps {
  value: string | null | undefined;
  placeholder?: string;
  onSave: (val: string) => Promise<void>;
  className?: string;
  inputClassName?: string;
  readOnly?: boolean;
}

function InlineText({
  value,
  placeholder = "—",
  onSave,
  className = "",
  inputClassName = "",
  readOnly = false,
}: InlineTextProps) {
  const [editing, setEditing] = React.useState(false);
  const [val, setVal] = React.useState(value ?? "");
  const [saving, setSaving] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  // Sync external value changes
  React.useEffect(() => {
    if (!editing) setVal(value ?? "");
  }, [value, editing]);

  function startEdit() {
    if (readOnly) return;
    setEditing(true);
    setTimeout(() => inputRef.current?.select(), 0);
  }

  async function commit() {
    const trimmed = val.trim();
    if (trimmed === (value ?? "").trim()) {
      setEditing(false);
      return;
    }
    setSaving(true);
    await onSave(trimmed);
    setSaving(false);
    setEditing(false);
  }

  function cancel() {
    setVal(value ?? "");
    setEditing(false);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") {
      e.preventDefault();
      commit();
    } else if (e.key === "Escape") {
      cancel();
    }
  }

  if (editing) {
    return (
      <input
        ref={inputRef}
        autoFocus
        value={val}
        onChange={(e) => setVal(e.target.value)}
        onBlur={commit}
        onKeyDown={handleKeyDown}
        disabled={saving}
        className={`w-full rounded border border-primary/40 bg-background px-1.5 py-0.5 text-xs font-medium outline-none disabled:opacity-60 ${inputClassName}`}
      />
    );
  }

  return (
    <span
      onClick={startEdit}
      title={readOnly ? undefined : "Clic para editar"}
      className={`block rounded border border-transparent px-1.5 py-0.5 text-xs font-medium transition-colors hover:bg-muted/40 ${readOnly ? "cursor-default hover:bg-transparent" : "cursor-text"} ${className}`}
    >
      {val || <span className="text-muted-foreground/50">{placeholder}</span>}
    </span>
  );
}

interface InlineNumberProps {
  value: number | null | undefined;
  onSave: (val: number | null) => Promise<void>;
  min?: number;
  className?: string;
}

function InlineNumber({ value, onSave, min = 0, className = "" }: InlineNumberProps) {
  const [editing, setEditing] = React.useState(false);
  const [val, setVal] = React.useState(String(value ?? ""));
  const [saving, setSaving] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (!editing) setVal(String(value ?? ""));
  }, [value, editing]);

  function startEdit() {
    setEditing(true);
    setTimeout(() => inputRef.current?.select(), 0);
  }

  async function commit() {
    const num = val === "" ? null : parseInt(val, 10);
    if (num === value || (num === null && value === null)) {
      setEditing(false);
      return;
    }
    setSaving(true);
    await onSave(num);
    setSaving(false);
    setEditing(false);
  }

  function cancel() {
    setVal(String(value ?? ""));
    setEditing(false);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") {
      e.preventDefault();
      commit();
    } else if (e.key === "Escape") {
      cancel();
    }
  }

  if (editing) {
    return (
      <input
        ref={inputRef}
        autoFocus
        type="number"
        min={min}
        value={val}
        onChange={(e) => setVal(e.target.value)}
        onBlur={commit}
        onKeyDown={handleKeyDown}
        disabled={saving}
        className={`w-24 rounded border border-primary/40 bg-background px-1.5 py-0.5 text-xs font-medium outline-none disabled:opacity-60 ${className}`}
      />
    );
  }

  return (
    <span
      onClick={startEdit}
      title="Clic para editar"
      className={`block rounded border border-transparent px-1.5 py-0.5 text-xs font-medium cursor-text transition-colors hover:bg-muted/40 ${className}`}
    >
      {value !== null && value !== undefined ? value : <span className="text-muted-foreground/50">—</span>}
    </span>
  );
}

interface InlineSelectProps<T extends string> {
  value: T;
  options: { value: T; label: string }[];
  onSave: (val: T) => Promise<void>;
  className?: string;
}

function InlineSelect<T extends string>({
  value,
  options,
  onSave,
  className = "",
}: InlineSelectProps<T>) {
  const [saving, setSaving] = React.useState(false);

  async function handleChange(newVal: string | null) {
    if (!newVal || newVal === value) return;
    const next = newVal as T;
    setSaving(true);
    await onSave(next);
    setSaving(false);
  }

  const current = options.find((o) => o.value === value);

  return (
    <Select value={value} onValueChange={handleChange}>
      <SelectTrigger className={`h-auto px-1.5 py-0.5 text-xs border-transparent bg-transparent hover:bg-muted/40 transition-colors w-auto gap-0.5 font-medium rounded ${saving ? "opacity-60" : ""} ${className}`}>
        {current?.label ?? value}
      </SelectTrigger>
      <SelectContent>
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

interface InlineToggleProps {
  value: boolean;
  label: string;
  onSave: (val: boolean) => Promise<void>;
  readOnly?: boolean;
}

function InlineToggle({ value, label, onSave, readOnly = false }: InlineToggleProps) {
  const [saving, setSaving] = React.useState(false);
  const [optimistic, setOptimistic] = React.useState(value);

  React.useEffect(() => {
    setOptimistic(value);
  }, [value]);

  async function handleToggle(checked: boolean) {
    if (readOnly) return;
    setOptimistic(checked);
    setSaving(true);
    await onSave(checked);
    setSaving(false);
  }

  return (
    <div className="flex items-center gap-2">
      <Switch
        checked={optimistic}
        onCheckedChange={handleToggle}
        disabled={saving || readOnly}
        size="sm"
      />
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  );
}

// ── Section label ──────────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="pt-4 border-t border-border/60">
      <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">{title}</h3>
      <div className="space-y-1">{children}</div>
    </div>
  );
}

function EditRow({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 text-xs min-h-[2rem] py-0.5">
      <span className="text-muted-foreground shrink-0">{icon}</span>
      <span className="text-muted-foreground w-28 shrink-0">{label}:</span>
      <span className="flex-1 min-w-0">{children}</span>
    </div>
  );
}

function CredencialesSection({ personaId, canManage }: { personaId: string; canManage: boolean }) {
  const [creds, setCreds] = React.useState<Record<string, string> | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    fetch(`/api/credentials/${personaId}`)
      .then((r) => r.ok ? r.json() : {})
      .then((data) => setCreds(data))
      .catch(() => setCreds({}))
      .finally(() => setLoading(false));
  }, [personaId]);

  async function saveCred(field: string, value: string) {
    const result = await updateCredentialsAction(personaId, { [field]: value || "" });
    if (result && "error" in result) {
      toast.error("Error al guardar credencial");
    } else {
      // Update local state
      setCreds((prev) => prev ? { ...prev, [field]: value } : prev);
    }
  }

  return (
    <div className="pt-4 border-t border-border/60">
      <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Credenciales</h3>
      {loading ? (
        <p className="text-xs text-muted-foreground">Cargando...</p>
      ) : (
        <div className="space-y-1">
          <EditRow icon={<CreditCard className="h-3.5 w-3.5" />} label="SOL Usuario">
            <InlineText value={creds?.claveSolUsuario ?? null} placeholder="—" onSave={(v) => saveCred("claveSolUsuario", v)} readOnly={!canManage} className="font-mono" />
          </EditRow>
          <EditRow icon={<CreditCard className="h-3.5 w-3.5" />} label="SOL Clave">
            <InlineText value={creds?.claveSolClave ?? null} placeholder="—" onSave={(v) => saveCred("claveSolClave", v)} readOnly={!canManage} className="font-mono" />
          </EditRow>
          <EditRow icon={<CreditCard className="h-3.5 w-3.5" />} label="AFP Usuario">
            <InlineText value={creds?.afpUsuario ?? null} placeholder="—" onSave={(v) => saveCred("afpUsuario", v)} readOnly={!canManage} className="font-mono" />
          </EditRow>
          <EditRow icon={<CreditCard className="h-3.5 w-3.5" />} label="AFP Clave">
            <InlineText value={creds?.afpClave ?? null} placeholder="—" onSave={(v) => saveCred("afpClave", v)} readOnly={!canManage} className="font-mono" />
          </EditRow>
        </div>
      )}
    </div>
  );
}

function Field({ label, children, className = "" }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`flex flex-col gap-0.5 ${className}`}>
      <span className="text-[10px] text-muted-foreground">{label}</span>
      {children}
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export function ClienteDetailClient({
  persona: initialPersona,
  servicios,
  incidencias,
  libros,
  canManage,
  hideHeader = false,
  showIdentityRows = false,
}: ClienteDetailClientProps) {
  const [persona, setPersona] = React.useState<PersonaDetail>(initialPersona);
  const [saveError, setSaveError] = React.useState<string | null>(null);
  const [selectedServicio, setSelectedServicio] = React.useState<any>(null);
  const [selectedIncidenciaId, setSelectedIncidenciaId] = React.useState<string | null>(null);

  async function openServicio(id: string) {
    try {
      const res = await fetch(`/api/servicios/${id}`);
      if (res.ok) {
        const data = await res.json();
        setSelectedServicio(data);
      }
    } catch { /* silent */ }
  }

  const deadlineDay = sunatDeadlineDay(persona.ruc);

  // Refresh from API after a save
  async function refreshPersona() {
    try {
      const res = await fetch(`/api/clientes/${persona.id}`);
      if (res.ok) {
        const data = await res.json();
        setPersona(data);
      }
    } catch {
      // Silent — optimistic update already applied
    }
  }

  // Client-side validation
  function validate(field: string, value: unknown): string | null {
    const v = typeof value === "string" ? value : "";
    if (field === "representanteDni" && v && (!/^\d*$/.test(v) || (v.length > 0 && v.length !== 8))) {
      return "DNI debe tener 8 dígitos numéricos";
    }
    if (field === "email" && v && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) {
      return "Email inválido";
    }
    if (field === "numTrabajadores" && typeof value === "number" && value < 0) {
      return "No puede ser negativo";
    }
    return null;
  }

  // Generic save handler — optimistic update + server action
  async function save(field: string, value: unknown) {
    setSaveError(null);

    const validationError = validate(field, value);
    if (validationError) {
      toast.error(validationError);
      return;
    }

    // Build the full update payload required by the schema
    const payload = buildPayload(persona, field, value);
    const result = await updatePersonaAction(persona.id, payload as any) as
      | { success: true }
      | { error: string | Record<string, string[]> };

    if ("error" in result) {
      const msg =
        typeof result.error === "string"
          ? result.error
          : Object.values(result.error).flat().join(", ");
      setSaveError(msg);
      // Revert optimistic by refreshing
      await refreshPersona();
    } else {
      // Optimistic: apply locally
      setPersona((prev) => ({ ...prev, [field]: value }));
    }
  }

  return (
    <div className="space-y-5">
      {/* Error banner */}
      {saveError && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {saveError}
        </div>
      )}

      {/* Header — oculto en popup (ya lo muestra el dialog) */}
      {!hideHeader && (
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            {canManage ? (
              <InlineText
                value={persona.razonSocial}
                onSave={(v) => save("razonSocial", v)}
                className="text-lg font-bold tracking-tight text-foreground"
                inputClassName="text-lg font-bold tracking-tight"
              />
            ) : (
              <h1 className="text-lg font-bold tracking-tight">{persona.razonSocial}</h1>
            )}
            <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-muted-foreground">
              <span className="font-mono">{persona.ruc}</span>
              <span>·</span>
              <Badge className="bg-muted/60 text-foreground border-transparent text-[10px] px-1.5 py-0">{TIPO_LABEL[persona.tipoPersona]}</Badge>
              <span>·</span>
              <Badge variant="outline" className="text-[10px] px-1.5 py-0">{REGIMEN_LABEL[persona.regimen]}</Badge>
              <span>·</span>
              <span>Vence día {deadlineDay}</span>
              <span>·</span>
              <span>{persona._count.servicios} servicio{persona._count.servicios !== 1 ? "s" : ""}</span>
              <span>·</span>
              <span>{persona._count.incidencias} incidencia{persona._count.incidencias !== 1 ? "s" : ""}</span>
            </div>
          </div>
          {canManage ? (
            <InlineSelect
              value={persona.estado}
              options={[
                { value: "ACTIVO" as EstadoPersona, label: "Activo" },
                { value: "INACTIVO" as EstadoPersona, label: "Inactivo" },
                { value: "ARCHIVADO" as EstadoPersona, label: "Archivado" },
              ]}
              onSave={(v) => save("estado", v)}
            />
          ) : (
            <Badge className={ESTADO_BADGE[persona.estado]}>{ESTADO_LABEL[persona.estado]}</Badge>
          )}
        </div>
      )}

      {/* ── Identidad (solo en popup) ── */}
      {showIdentityRows && (
        <Section title="Identidad">
          <EditRow icon={<Building2 className="h-3.5 w-3.5" />} label="Razón Social">
            {canManage ? (
              <InlineText value={persona.razonSocial} onSave={(v) => save("razonSocial", v)} />
            ) : <span>{persona.razonSocial}</span>}
          </EditRow>
          <EditRow icon={<Building2 className="h-3.5 w-3.5" />} label="RUC">
            {canManage ? (
              <InlineText value={persona.ruc} onSave={(v) => save("ruc", v)} className="font-mono" inputClassName="font-mono" />
            ) : <span className="font-mono">{persona.ruc}</span>}
          </EditRow>
          <EditRow icon={<Building2 className="h-3.5 w-3.5" />} label="Tipo Persona">
            {canManage ? (
              <InlineSelect value={persona.tipoPersona} options={[
                { value: "JURIDICA" as TipoPersona, label: "Jurídica" },
                { value: "NATURAL" as TipoPersona, label: "Natural" },
                { value: "IMMUNOTEC" as TipoPersona, label: "Immunotec" },
                { value: "FOUR_LIFE" as TipoPersona, label: "4Life" },
                { value: "RXH" as TipoPersona, label: "RxH" },
              ]} onSave={(v) => save("tipoPersona", v)} />
            ) : <span>{TIPO_LABEL[persona.tipoPersona]}</span>}
          </EditRow>
          <EditRow icon={<Building2 className="h-3.5 w-3.5" />} label="Estado">
            {canManage ? (
              <InlineSelect value={persona.estado} options={[
                { value: "ACTIVO" as EstadoPersona, label: "Activo" },
                { value: "INACTIVO" as EstadoPersona, label: "Inactivo" },
                { value: "ARCHIVADO" as EstadoPersona, label: "Archivado" },
              ]} onSave={(v) => save("estado", v)} />
            ) : <span>{ESTADO_LABEL[persona.estado]}</span>}
          </EditRow>
        </Section>
      )}

      {/* ── Datos Fiscales ── */}
      <Section title="Datos Fiscales">
        <EditRow icon={<Building2 className="h-3.5 w-3.5" />} label="Régimen">
          {canManage ? (
            <InlineSelect value={persona.regimen} options={[
              { value: "MYPE" as Regimen, label: "MYPE" },
              { value: "RER" as Regimen, label: "RER" },
              { value: "REG" as Regimen, label: "General" },
            ]} onSave={(v) => save("regimen", v)} />
          ) : <span className="text-xs">{REGIMEN_LABEL[persona.regimen]}</span>}
        </EditRow>
        <EditRow icon={<Building2 className="h-3.5 w-3.5" />} label="Contabilidad">
          {canManage ? (
            <InlineSelect value={persona.tipoContabilidad} options={[
              { value: "MANUAL" as TipoContabilidad, label: "Manual" },
              { value: "COMPUTARIZADA" as TipoContabilidad, label: "Computarizada" },
            ]} onSave={(v) => save("tipoContabilidad", v)} />
          ) : <span className="text-xs">{persona.tipoContabilidad}</span>}
        </EditRow>
        <EditRow icon={<Building2 className="h-3.5 w-3.5" />} label="Planilla">
          <InlineToggle value={persona.planilla} label={persona.planilla ? "Sí" : "No"} onSave={(v) => save("planilla", v)} readOnly={!canManage} />
        </EditRow>
        <EditRow icon={<Building2 className="h-3.5 w-3.5" />} label="Detracciones">
          <InlineToggle value={persona.detracciones} label={persona.detracciones ? "Sí" : "No"} onSave={(v) => save("detracciones", v)} readOnly={!canManage} />
        </EditRow>
        <EditRow icon={<Building2 className="h-3.5 w-3.5" />} label="Dirección">
          <InlineText value={persona.direccion} placeholder="—" onSave={(v) => save("direccion", v || null)} readOnly={!canManage} />
        </EditRow>
        <EditRow icon={<Building2 className="h-3.5 w-3.5" />} label="Partida Elect.">
          <InlineText value={persona.partidaElectronica} placeholder="—" onSave={(v) => save("partidaElectronica", v || null)} readOnly={!canManage} />
        </EditRow>
        <EditRow icon={<Users className="h-3.5 w-3.5" />} label="N° Trabajadores">
          {canManage ? <InlineNumber value={persona.numTrabajadores} onSave={(v) => save("numTrabajadores", v)} min={0} /> : <span className="text-xs">{persona.numTrabajadores ?? "—"}</span>}
        </EditRow>
      </Section>

      {/* ── Contacto ── */}
      <Section title="Contacto">
        <EditRow icon={<Users className="h-3.5 w-3.5" />} label="Teléfono">
          <InlineText value={persona.telefono} placeholder="—" onSave={(v) => save("telefono", v || null)} readOnly={!canManage} />
        </EditRow>
        <EditRow icon={<Users className="h-3.5 w-3.5" />} label="Email">
          <InlineText value={persona.email} placeholder="—" onSave={(v) => save("email", v || null)} readOnly={!canManage} />
        </EditRow>
        <EditRow icon={<Users className="h-3.5 w-3.5" />} label="Contador">
          <span className="text-xs font-medium">{persona.contadorAsignado.nombre} {persona.contadorAsignado.apellido}</span>
        </EditRow>
      </Section>

      {/* ── Representante ── */}
      <Section title="Representante Legal">
        <EditRow icon={<Users className="h-3.5 w-3.5" />} label="Nombre">
          <InlineText value={persona.representanteNombre} placeholder="—" onSave={(v) => save("representanteNombre", v || null)} readOnly={!canManage} />
        </EditRow>
        <EditRow icon={<Users className="h-3.5 w-3.5" />} label="DNI">
          <InlineText value={persona.representanteDni} placeholder="—" onSave={(v) => save("representanteDni", v || null)} readOnly={!canManage} />
        </EditRow>
        <EditRow icon={<Users className="h-3.5 w-3.5" />} label="Teléfono">
          <InlineText value={persona.representanteTelefono} placeholder="—" onSave={(v) => save("representanteTelefono", v || null)} readOnly={!canManage} />
        </EditRow>
      </Section>

      {/* ── Credenciales ── */}
      <CredencialesSection personaId={persona.id} canManage={canManage} />

      {/* Tabs */}
      <div className="pt-4 border-t border-border/60">
      <Tabs defaultValue="servicios">
        <TabsList>
          <TabsTrigger value="servicios">
            Servicios ({persona._count.servicios})
          </TabsTrigger>
          <TabsTrigger value="incidencias">
            Incidencias ({persona._count.incidencias})
          </TabsTrigger>
          <TabsTrigger value="libros">
            Libros ({persona._count.libros})
          </TabsTrigger>
        </TabsList>

        {/* Servicios Tab */}
        <TabsContent value="servicios" className="mt-3">
          {servicios.length === 0 ? (
            <p className="py-6 text-center text-xs text-muted-foreground">Sin servicios registrados.</p>
          ) : (
            <div className="rounded-lg border border-border overflow-hidden">
              <table className="w-full text-xs border-collapse" style={{ tableLayout: "fixed" }}>
                <colgroup><col style={{ width: "24%" }} /><col style={{ width: "13%" }} /><col style={{ width: "16%" }} /><col style={{ width: "16%" }} /><col style={{ width: "16%" }} /><col style={{ width: "15%" }} /></colgroup>
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="px-2.5 py-2 text-left text-[10px] uppercase tracking-wider font-medium text-muted-foreground">Servicio</th>
                    <th className="px-2.5 py-2 text-left text-[10px] uppercase tracking-wider font-medium text-muted-foreground">Periodo</th>
                    <th className="px-2.5 py-2 text-right text-[10px] uppercase tracking-wider font-medium text-muted-foreground">Honorarios</th>
                    <th className="px-2.5 py-2 text-right text-[10px] uppercase tracking-wider font-medium text-muted-foreground">Cobrado</th>
                    <th className="px-2.5 py-2 text-right text-[10px] uppercase tracking-wider font-medium text-muted-foreground">Restante</th>
                    <th className="px-2.5 py-2 text-center text-[10px] uppercase tracking-wider font-medium text-muted-foreground">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {servicios.map((s, i) => {
                    const badge = COBRANZA_BADGE[s.estadoCobranza];
                    return (
                      <tr key={s.id} onClick={() => openServicio(s.id)} className={`transition-colors hover:bg-primary/5 cursor-pointer ${i % 2 === 0 ? "bg-muted/10" : ""}`}>
                        <td className="px-2.5 py-1.5 font-medium truncate">{s.tipoServicio.nombre}</td>
                        <td className="px-2.5 py-1.5 font-mono text-muted-foreground">{s.periodo ?? "—"}</td>
                        <td className="px-2.5 py-1.5 text-right font-mono tabular-nums">{formatCurrency(s.precioFinal)}</td>
                        <td className="px-2.5 py-1.5 text-right font-mono tabular-nums font-semibold text-emerald-700 dark:text-emerald-400">{formatCurrency(s.montoCobrado)}</td>
                        <td className="px-2.5 py-1.5 text-right font-mono tabular-nums text-destructive">{formatCurrency(s.montoRestante)}</td>
                        <td className="px-2.5 py-1.5 text-center"><Badge className={`text-[9px] ${badge.className}`}>{badge.label}</Badge></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>

        {/* Incidencias Tab */}
        <TabsContent value="incidencias" className="mt-3">
          {incidencias.length === 0 ? (
            <p className="py-6 text-center text-xs text-muted-foreground">Sin incidencias registradas.</p>
          ) : (
            <div className="rounded-lg border border-border overflow-hidden">
              <table className="w-full text-xs border-collapse" style={{ tableLayout: "fixed" }}>
                <colgroup><col style={{ width: "10%" }} /><col style={{ width: "42%" }} /><col style={{ width: "16%" }} /><col style={{ width: "16%" }} /><col style={{ width: "16%" }} /></colgroup>
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="px-2.5 py-2 text-center text-[10px] uppercase tracking-wider font-medium text-muted-foreground">Prio</th>
                    <th className="px-2.5 py-2 text-left text-[10px] uppercase tracking-wider font-medium text-muted-foreground">Título</th>
                    <th className="px-2.5 py-2 text-left text-[10px] uppercase tracking-wider font-medium text-muted-foreground">Periodo</th>
                    <th className="px-2.5 py-2 text-left text-[10px] uppercase tracking-wider font-medium text-muted-foreground">Fecha</th>
                    <th className="px-2.5 py-2 text-center text-[10px] uppercase tracking-wider font-medium text-muted-foreground">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {incidencias.map((inc, i) => {
                    const prioBadge = PRIORIDAD_BADGE[inc.prioridad];
                    const estadoBadge = INCIDENCIA_ESTADO_BADGE[inc.estado];
                    return (
                      <tr key={inc.id} onClick={() => setSelectedIncidenciaId(inc.id)} className={`transition-colors hover:bg-primary/5 cursor-pointer ${i % 2 === 0 ? "bg-muted/10" : ""}`}>
                        <td className="px-2.5 py-1.5 text-center"><Badge className={`text-[9px] ${prioBadge.className}`}>{prioBadge.label}</Badge></td>
                        <td className="px-2.5 py-1.5 font-medium truncate">{inc.titulo}</td>
                        <td className="px-2.5 py-1.5 font-mono text-muted-foreground">{inc.periodo ?? "—"}</td>
                        <td className="px-2.5 py-1.5 font-mono text-muted-foreground">{formatDate(inc.createdAt)}</td>
                        <td className="px-2.5 py-1.5 text-center"><Badge className={`text-[9px] ${estadoBadge.className}`}>{estadoBadge.label}</Badge></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>

        {/* Libros Tab */}
        <TabsContent value="libros" className="mt-3">
          {libros.length === 0 ? (
            <p className="py-6 text-center text-xs text-muted-foreground">Sin libros contables registrados.</p>
          ) : (
            <div className="space-y-3">
              {Array.from(new Set(libros.map((l) => l.anio)))
                .sort((a, b) => b - a)
                .map((anio) => {
                  const librosAnio = libros.filter((l) => l.anio === anio);
                  return (
                    <div key={anio}>
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Año {anio}</p>
                      <div className="rounded-lg border border-border overflow-hidden">
                        <table className="w-full text-xs border-collapse" style={{ tableLayout: "fixed" }}>
                          <colgroup><col style={{ width: "50%" }} /><col style={{ width: "30%" }} /><col style={{ width: "20%" }} /></colgroup>
                          <thead>
                            <tr className="border-b border-border bg-muted/50">
                              <th className="px-2.5 py-2 text-left text-[10px] uppercase tracking-wider font-medium text-muted-foreground">Tipo</th>
                              <th className="px-2.5 py-2 text-left text-[10px] uppercase tracking-wider font-medium text-muted-foreground">Mes</th>
                              <th className="px-2.5 py-2 text-center text-[10px] uppercase tracking-wider font-medium text-muted-foreground">Estado</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border/50">
                            {librosAnio.map((libro, i) => (
                              <tr key={libro.id} className={i % 2 === 0 ? "bg-muted/10" : ""}>
                                <td className="px-2.5 py-1.5 font-medium">{libro.tipoLibro}</td>
                                <td className="px-2.5 py-1.5 text-muted-foreground">{MESES[libro.mes] ?? libro.mes}</td>
                                <td className="px-2.5 py-1.5 text-center">
                                  {libro.completado ? (
                                    <CheckCircle2 className="mx-auto size-3.5 text-emerald-500" />
                                  ) : (
                                    <XCircle className="mx-auto size-3.5 text-muted-foreground/30" />
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </TabsContent>
      </Tabs>
      </div>

      {/* Popup servicio */}
      {selectedServicio && (
        <ServicioDetailDialog
          servicio={selectedServicio}
          cuentas={[]}
          onClose={() => setSelectedServicio(null)}
        />
      )}

      {/* Popup incidencia */}
      {selectedIncidenciaId && (
        <IncidenciaDetailDialog
          incidenciaId={selectedIncidenciaId}
          onClose={() => setSelectedIncidenciaId(null)}
        />
      )}
    </div>
  );
}

// ── Payload builder ────────────────────────────────────────────────────────────
// updatePersonaAction requires razonSocial, ruc, tipoPersona, regimen, contadorAsignadoId
// to always be present. We merge changed field on top of current persona values.

function buildPayload(persona: PersonaDetail, field: string, value: unknown) {
  // Convert null to "" for optional string fields (Zod expects string|"", not null)
  const str = (v: string | null | undefined) => v ?? "";

  const payload: Record<string, any> = {
    razonSocial: persona.razonSocial,
    ruc: persona.ruc,
    tipoPersona: persona.tipoPersona,
    regimen: persona.regimen,
    contadorAsignadoId: persona.contadorAsignado.id,
    direccion: str(persona.direccion),
    telefono: str(persona.telefono),
    email: str(persona.email),
    representanteNombre: str(persona.representanteNombre),
    representanteDni: str(persona.representanteDni),
    representanteTelefono: str(persona.representanteTelefono),
    detracciones: persona.detracciones,
    planilla: persona.planilla,
    numTrabajadores: persona.numTrabajadores ?? undefined,
    tipoContabilidad: persona.tipoContabilidad,
    partidaElectronica: str(persona.partidaElectronica),
  };

  // Override with the changed field — convert null to "" for strings
  payload[field] = value === null ? "" : value;

  return payload;
}

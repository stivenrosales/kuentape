"use client";

import * as React from "react";
import Link from "next/link";
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
import { KPICard } from "@/components/kpi-card";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { EmptyState } from "@/components/empty-state";
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
        className={`w-full rounded border border-border bg-background px-1.5 py-0.5 text-sm outline-none ring-1 ring-primary/40 focus:ring-primary disabled:opacity-60 ${inputClassName}`}
      />
    );
  }

  return (
    <span
      onClick={startEdit}
      title={readOnly ? undefined : "Clic para editar"}
      className={`block min-h-[1.5rem] cursor-text rounded px-1 py-0.5 text-sm transition-colors hover:bg-muted/50 ${readOnly ? "cursor-default hover:bg-transparent" : ""} ${className}`}
    >
      {val || <span className="text-muted-foreground/60">{placeholder}</span>}
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
        className={`w-24 rounded border border-border bg-background px-1.5 py-0.5 text-sm outline-none ring-1 ring-primary/40 focus:ring-primary disabled:opacity-60 ${className}`}
      />
    );
  }

  return (
    <span
      onClick={startEdit}
      title="Clic para editar"
      className={`block min-h-[1.5rem] cursor-text rounded px-1 py-0.5 text-sm transition-colors hover:bg-muted/50 ${className}`}
    >
      {value !== null && value !== undefined ? value : <span className="text-muted-foreground/60">—</span>}
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

  async function handleChange(newVal: string) {
    const next = newVal as T;
    if (next === value) return;
    setSaving(true);
    await onSave(next);
    setSaving(false);
  }

  const current = options.find((o) => o.value === value);

  return (
    <Select value={value} onValueChange={handleChange}>
      <SelectTrigger className={`h-auto px-2 py-0.5 text-sm border-transparent bg-transparent hover:bg-muted/40 transition-colors w-auto gap-1 ${saving ? "opacity-60" : ""} ${className}`}>
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

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-medium text-muted-foreground">{children}</p>
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
    <section className="rounded-lg border border-border bg-card shadow-sm p-4">
      <h3 className="text-xs font-medium text-muted-foreground mb-3 flex items-center gap-1.5">
        <CreditCard className="h-3.5 w-3.5" /> Credenciales
      </h3>
      {loading ? (
        <p className="text-xs text-muted-foreground">Cargando...</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-3">
          <Field label="SOL Usuario">
            <InlineText value={creds?.claveSolUsuario ?? null} placeholder="—" onSave={(v) => saveCred("claveSolUsuario", v)} readOnly={!canManage} className="font-mono" />
          </Field>
          <Field label="SOL Clave">
            <InlineText value={creds?.claveSolClave ?? null} placeholder="—" onSave={(v) => saveCred("claveSolClave", v)} readOnly={!canManage} className="font-mono" />
          </Field>
          <Field label="AFP Usuario">
            <InlineText value={creds?.afpUsuario ?? null} placeholder="—" onSave={(v) => saveCred("afpUsuario", v)} readOnly={!canManage} className="font-mono" />
          </Field>
          <Field label="AFP Clave">
            <InlineText value={creds?.afpClave ?? null} placeholder="—" onSave={(v) => saveCred("afpClave", v)} readOnly={!canManage} className="font-mono" />
          </Field>
        </div>
      )}
    </section>
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
}: ClienteDetailClientProps) {
  const [persona, setPersona] = React.useState<PersonaDetail>(initialPersona);
  const [saveError, setSaveError] = React.useState<string | null>(null);

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
    <div className="space-y-6">
      {/* Error banner */}
      {saveError && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {saveError}
        </div>
      )}

      {/* Header — compacto */}
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

      {/* ── Datos Fiscales ── */}
      <section className="rounded-lg border border-border bg-card shadow-sm p-4">
        <h3 className="text-xs font-medium text-muted-foreground mb-3 flex items-center gap-1.5">
          <Building2 className="h-3.5 w-3.5" /> Datos Fiscales
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-3">
          <Field label="Régimen">
            {canManage ? (
              <InlineSelect value={persona.regimen} options={[
                { value: "MYPE" as Regimen, label: "MYPE" },
                { value: "RER" as Regimen, label: "RER" },
                { value: "REG" as Regimen, label: "General" },
              ]} onSave={(v) => save("regimen", v)} />
            ) : <span className="text-sm">{REGIMEN_LABEL[persona.regimen]}</span>}
          </Field>
          <Field label="Contabilidad">
            {canManage ? (
              <InlineSelect value={persona.tipoContabilidad} options={[
                { value: "MANUAL" as TipoContabilidad, label: "Manual" },
                { value: "COMPUTARIZADA" as TipoContabilidad, label: "Computarizada" },
              ]} onSave={(v) => save("tipoContabilidad", v)} />
            ) : <span className="text-sm">{persona.tipoContabilidad}</span>}
          </Field>
          <Field label="Planilla">
            <InlineToggle value={persona.planilla} label={persona.planilla ? "Sí" : "No"} onSave={(v) => save("planilla", v)} readOnly={!canManage} />
          </Field>
          <Field label="Detracciones">
            <InlineToggle value={persona.detracciones} label={persona.detracciones ? "Sí" : "No"} onSave={(v) => save("detracciones", v)} readOnly={!canManage} />
          </Field>
          <Field label="Dirección" className="col-span-2">
            <InlineText value={persona.direccion} placeholder="—" onSave={(v) => save("direccion", v || null)} readOnly={!canManage} />
          </Field>
          <Field label="Partida Electrónica">
            <InlineText value={persona.partidaElectronica} placeholder="—" onSave={(v) => save("partidaElectronica", v || null)} readOnly={!canManage} />
          </Field>
          <Field label="N° Trabajadores">
            {canManage ? <InlineNumber value={persona.numTrabajadores} onSave={(v) => save("numTrabajadores", v)} min={0} /> : <span className="text-sm">{persona.numTrabajadores ?? "—"}</span>}
          </Field>
        </div>
      </section>

      {/* ── Contacto y Representante ── */}
      <section className="rounded-lg border border-border bg-card shadow-sm p-4">
        <h3 className="text-xs font-medium text-muted-foreground mb-3 flex items-center gap-1.5">
          <Users className="h-3.5 w-3.5" /> Contacto y Representante
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-3">
          <Field label="Teléfono">
            <InlineText value={persona.telefono} placeholder="—" onSave={(v) => save("telefono", v || null)} readOnly={!canManage} />
          </Field>
          <Field label="Email">
            <InlineText value={persona.email} placeholder="—" onSave={(v) => save("email", v || null)} readOnly={!canManage} />
          </Field>
          <Field label="Contador">
            <span className="text-sm">{persona.contadorAsignado.nombre} {persona.contadorAsignado.apellido}</span>
          </Field>
          <div />
          <Field label="Rep. Legal">
            <InlineText value={persona.representanteNombre} placeholder="—" onSave={(v) => save("representanteNombre", v || null)} readOnly={!canManage} />
          </Field>
          <Field label="DNI Rep.">
            <InlineText value={persona.representanteDni} placeholder="—" onSave={(v) => save("representanteDni", v || null)} readOnly={!canManage} />
          </Field>
          <Field label="Tel. Rep.">
            <InlineText value={persona.representanteTelefono} placeholder="—" onSave={(v) => save("representanteTelefono", v || null)} readOnly={!canManage} />
          </Field>
          <div />
        </div>
      </section>

      {/* ── Credenciales ── */}
      <CredencialesSection personaId={persona.id} canManage={canManage} />

      {/* Tabs */}
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
        <TabsContent value="servicios" className="mt-4">
          {servicios.length === 0 ? (
            <EmptyState
              icon={<Building2 className="size-6" />}
              title="Sin servicios"
              message="Este cliente no tiene servicios registrados."
            />
          ) : (
            <div className="rounded-lg border border-border bg-card shadow-sm overflow-hidden">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-border bg-muted/50">
                      <th className="px-3 py-2.5 text-left text-xs font-medium text-muted-foreground">Tipo de Servicio</th>
                      <th className="px-3 py-2.5 text-left text-xs font-medium text-muted-foreground">Periodo</th>
                      <th className="px-3 py-2.5 text-right text-xs font-medium text-muted-foreground">Honorarios</th>
                      <th className="px-3 py-2.5 text-right text-xs font-medium text-muted-foreground">Cobrado</th>
                      <th className="px-3 py-2.5 text-right text-xs font-medium text-muted-foreground">Restante</th>
                      <th className="px-3 py-2.5 text-left text-xs font-medium text-muted-foreground">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {servicios.map((s, i) => {
                      const badge = COBRANZA_BADGE[s.estadoCobranza];
                      return (
                        <tr key={s.id} className={`hover:bg-primary/5 transition-colors ${i % 2 === 0 ? "bg-muted/10" : ""}`}>
                          <td className="px-3 py-2">
                            <Link href={`/servicios/${s.id}`} className="font-medium text-sm hover:text-primary transition-colors">{s.tipoServicio.nombre}</Link>
                          </td>
                          <td className="px-3 py-2 font-mono text-xs text-muted-foreground">{s.periodo ?? "—"}</td>
                          <td className="px-3 py-2 text-right font-mono text-xs">{formatCurrency(s.precioFinal)}</td>
                          <td className="px-3 py-2 text-right font-mono text-xs text-green-600">{formatCurrency(s.montoCobrado)}</td>
                          <td className="px-3 py-2 text-right font-mono text-xs text-destructive">{formatCurrency(s.montoRestante)}</td>
                          <td className="px-3 py-2"><Badge className={`text-[10px] ${badge.className}`}>{badge.label}</Badge></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
            </div>
          )}
        </TabsContent>

        {/* Incidencias Tab */}
        <TabsContent value="incidencias" className="mt-4">
          {incidencias.length === 0 ? (
            <EmptyState
              icon={<AlertCircle className="size-6" />}
              title="Sin incidencias"
              message="Este cliente no tiene incidencias registradas."
            />
          ) : (
            <Card>
              <CardContent className="divide-y divide-border/50 p-0">
                {incidencias.map((inc) => {
                  const prioBadge = PRIORIDAD_BADGE[inc.prioridad];
                  const estadoBadge = INCIDENCIA_ESTADO_BADGE[inc.estado];
                  return (
                    <Link
                      key={inc.id}
                      href={`/incidencias/${inc.id}`}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-muted/40 transition-colors"
                    >
                      <Badge className={prioBadge.className}>
                        {prioBadge.label}
                      </Badge>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{inc.titulo}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(inc.createdAt)}
                          {inc.periodo ? ` · ${inc.periodo}` : ""}
                        </p>
                      </div>
                      <Badge className={estadoBadge.className}>
                        {estadoBadge.label}
                      </Badge>
                    </Link>
                  );
                })}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Libros Tab */}
        <TabsContent value="libros" className="mt-4">
          {libros.length === 0 ? (
            <EmptyState
              icon={<BookOpen className="size-6" />}
              title="Sin libros"
              message="Este cliente no tiene libros contables registrados."
            />
          ) : (
            <div className="space-y-4">
              {Array.from(new Set(libros.map((l) => l.anio)))
                .sort((a, b) => b - a)
                .map((anio) => {
                  const librosAnio = libros.filter((l) => l.anio === anio);
                  return (
                    <Card key={anio}>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                          Año {anio}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-0">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Tipo de Libro</TableHead>
                              <TableHead>Mes</TableHead>
                              <TableHead className="text-center">
                                Completado
                              </TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {librosAnio.map((libro) => (
                              <TableRow key={libro.id}>
                                <TableCell className="text-sm">
                                  {libro.tipoLibro}
                                </TableCell>
                                <TableCell className="text-sm">
                                  {MESES[libro.mes] ?? libro.mes}
                                </TableCell>
                                <TableCell className="text-center">
                                  {libro.completado ? (
                                    <Star className="mx-auto size-4 fill-amber-400 text-amber-400" />
                                  ) : (
                                    <Star className="mx-auto size-4 text-muted-foreground/30" />
                                  )}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </CardContent>
                    </Card>
                  );
                })}
            </div>
          )}
        </TabsContent>
      </Tabs>
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

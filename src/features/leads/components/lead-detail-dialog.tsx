"use client";

import * as React from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  X,
  Phone,
  Mail,
  CreditCard,
  Briefcase,
  Users,
  ExternalLink,
  ChevronRight,
  IdCard,
} from "lucide-react";
import type { EstadoLead } from "@prisma/client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";

import { EstadoBadge } from "./lead-pipeline";
import { LeadConversionDialog } from "./lead-conversion-dialog";
import { updateLeadFieldAction } from "../actions-kanban";
import type { LeadKanbanCard } from "../queries-kanban";

// ─── Types ───────────────────────────────────────────────────────

interface Props {
  lead: LeadKanbanCard;
  staff: { id: string; nombre: string; apellido: string }[];
  onClose: () => void;
  onMove: (id: string, from: EstadoLead, to: EstadoLead) => void;
  onUpdated: (lead: LeadKanbanCard) => void;
  onConverted: (leadId: string) => void;
}

const NEXT_ESTADO: Partial<Record<EstadoLead, EstadoLead>> = {
  NUEVO: "CONTACTADO",
  CONTACTADO: "COTIZADO",
};

const NEXT_LABEL: Partial<Record<EstadoLead, string>> = {
  NUEVO: "Avanzar a Contactado",
  CONTACTADO: "Avanzar a Cotizado",
};

const REGIMEN_OPTIONS = [
  { value: "MYPE", label: "MYPE" },
  { value: "RER", label: "RER" },
  { value: "REG", label: "Régimen General" },
];

// ─── Dialog ──────────────────────────────────────────────────────

export function LeadDetailDialog({
  lead: initialLead,
  staff,
  onClose,
  onMove,
  onUpdated,
  onConverted,
}: Props) {
  const [lead, setLead] = React.useState(initialLead);
  const [conversionOpen, setConversionOpen] = React.useState(false);

  // Sync when parent updates the lead (e.g. after move)
  React.useEffect(() => {
    setLead(initialLead);
  }, [initialLead]);

  React.useEffect(() => {
    function handleEsc(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.stopImmediatePropagation();
        if (!conversionOpen) onClose();
      }
    }
    document.addEventListener("keydown", handleEsc, true);
    return () => document.removeEventListener("keydown", handleEsc, true);
  }, [onClose, conversionOpen]);

  const estado = lead.estado as EstadoLead;
  const nextEstado = NEXT_ESTADO[estado];
  const nextLabel = NEXT_LABEL[estado];
  const isPerdido = estado === "PERDIDO";
  const isConvertido = estado === "CONVERTIDO";
  const isCotizado = estado === "COTIZADO";

  async function handleAdvance() {
    if (!nextEstado) return;
    onMove(lead.id, estado, nextEstado);
    onClose();
  }

  async function handleMarkPerdido() {
    onMove(lead.id, estado, "PERDIDO");
    onClose();
  }

  // Generic field save — updates local state optimistically, reports errors
  async function saveField(patch: Parameters<typeof updateLeadFieldAction>[1]) {
    const prev = { ...lead };
    const next = { ...lead, ...patch };
    setLead(next);
    onUpdated(next);

    const result = await updateLeadFieldAction(lead.id, patch);
    if (result.error) {
      setLead(prev);
      onUpdated(prev);
      toast.error("No se pudo guardar el campo");
    }
  }

  // Build lead data for the conversion dialog
  const leadForConversion = {
    id: lead.id,
    nombre: lead.nombre,
    apellido: lead.apellido,
    dni: lead.dni ?? null,
    celular: lead.celular,
    email: lead.email,
    regimen: lead.regimen as "MYPE" | "RER" | "REG" | null,
    numTrabajadores: lead.numTrabajadores,
  };

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />
        <div
          className="relative w-full max-w-lg bg-card rounded-lg shadow-2xl overflow-hidden animate-in zoom-in-95 fade-in duration-150 flex flex-col max-h-[85vh] my-4"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-start justify-between px-5 pt-4 pb-3 border-b border-border flex-shrink-0">
            <div className="space-y-1">
              <h2 className="text-base font-bold text-foreground">
                {lead.nombre} {lead.apellido}
              </h2>
              <EstadoBadge estado={estado} />
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Body */}
          <div className="overflow-y-auto flex-1">
            <div className="px-5 py-4 space-y-4">
              {/* Identidad */}
              <Section title="Identidad">
                <EditRow
                  icon={<IdCard className="h-3.5 w-3.5" />}
                  label="Nombre"
                >
                  <InlineText
                    value={lead.nombre}
                    onSave={(v) => saveField({ nombre: v })}
                  />
                </EditRow>
                <EditRow
                  icon={<IdCard className="h-3.5 w-3.5" />}
                  label="Apellido"
                >
                  <InlineText
                    value={lead.apellido}
                    onSave={(v) => saveField({ apellido: v })}
                  />
                </EditRow>
                <EditRow
                  icon={<IdCard className="h-3.5 w-3.5" />}
                  label="DNI"
                >
                  <InlineText
                    value={lead.dni ?? ""}
                    placeholder="Sin DNI"
                    onSave={(v) => saveField({ dni: v || null })}
                  />
                </EditRow>
              </Section>

              {/* Contacto */}
              <Section title="Contacto">
                <EditRow icon={<Phone className="h-3.5 w-3.5" />} label="Celular">
                  <InlineText
                    value={lead.celular}
                    onSave={(v) => saveField({ celular: v })}
                  />
                </EditRow>
                <EditRow icon={<Mail className="h-3.5 w-3.5" />} label="Email">
                  <InlineText
                    value={lead.email ?? ""}
                    placeholder="Sin email"
                    onSave={(v) => saveField({ email: v || null })}
                  />
                </EditRow>
              </Section>

              {/* Negocio */}
              <Section title="Negocio">
                <EditRow
                  icon={<CreditCard className="h-3.5 w-3.5" />}
                  label="Régimen"
                >
                  <InlineSelect
                    value={lead.regimen ?? ""}
                    placeholder="Sin régimen"
                    options={REGIMEN_OPTIONS}
                    onSave={(v) =>
                      saveField({
                        regimen: (v as "MYPE" | "RER" | "REG") || null,
                      })
                    }
                  />
                </EditRow>
                <EditRow
                  icon={<Briefcase className="h-3.5 w-3.5" />}
                  label="Rubro"
                >
                  <InlineText
                    value={lead.rubro ?? ""}
                    placeholder="Sin rubro"
                    onSave={(v) => saveField({ rubro: v || null })}
                  />
                </EditRow>
                <EditRow
                  icon={<Users className="h-3.5 w-3.5" />}
                  label="Trabajadores"
                >
                  <InlineNumber
                    value={lead.numTrabajadores}
                    onSave={(v) => saveField({ numTrabajadores: v })}
                  />
                </EditRow>
              </Section>

              {/* Assignment */}
              {lead.asignadoA && (
                <Section title="Asignado a">
                  <p className="text-sm text-foreground">
                    {lead.asignadoA.nombre} {lead.asignadoA.apellido}
                  </p>
                </Section>
              )}

              {/* Converted client link */}
              {isConvertido && lead.convertidoA && (
                <Section title="Cliente">
                  <Link
                    href={`/clientes/${lead.convertidoA.id}`}
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
                    onClick={onClose}
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    {lead.convertidoA.razonSocial}
                  </Link>
                </Section>
              )}

              {/* Notas */}
              <Section title="Notas">
                <InlineTextarea
                  value={lead.notas ?? ""}
                  placeholder="Clic para agregar notas..."
                  onSave={(v) => saveField({ notas: v || null })}
                />
              </Section>
            </div>
          </div>

          {/* Footer actions */}
          {!isPerdido && !isConvertido && (
            <div className="flex items-center gap-2 px-5 py-3 border-t border-border bg-muted/20 flex-shrink-0">
              {nextEstado && nextLabel && (
                <button
                  type="button"
                  onClick={handleAdvance}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                  <ChevronRight className="h-3.5 w-3.5" />
                  {nextLabel}
                </button>
              )}

              {isCotizado && (
                <button
                  type="button"
                  onClick={() => setConversionOpen(true)}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700 transition-colors"
                >
                  <ChevronRight className="h-3.5 w-3.5" />
                  Convertir a cliente
                </button>
              )}

              <button
                type="button"
                onClick={handleMarkPerdido}
                className="ml-auto text-xs text-muted-foreground hover:text-destructive transition-colors"
              >
                Marcar como perdido
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Conversion dialog (only for COTIZADO) */}
      {isCotizado && (
        <LeadConversionDialog
          open={conversionOpen}
          onOpenChange={(open) => {
            setConversionOpen(open);
            if (!open) {
              onConverted(lead.id);
            }
          }}
          lead={leadForConversion}
          staff={staff}
        />
      )}
    </>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {title}
      </p>
      {children}
    </div>
  );
}

function EditRow({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-2 text-sm min-h-[1.75rem]">
      <span className="text-muted-foreground flex-shrink-0">{icon}</span>
      <span className="text-muted-foreground w-24 flex-shrink-0">{label}:</span>
      <span className="flex-1 min-w-0">{children}</span>
    </div>
  );
}

// ─── Inline primitives ────────────────────────────────────────────

interface InlineTextProps {
  value: string;
  placeholder?: string;
  onSave: (val: string) => Promise<void>;
}

function InlineText({ value, placeholder = "—", onSave }: InlineTextProps) {
  const [editing, setEditing] = React.useState(false);
  const [val, setVal] = React.useState(value);
  const [saving, setSaving] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (!editing) setVal(value);
  }, [value, editing]);

  function startEdit() {
    setEditing(true);
    setTimeout(() => inputRef.current?.select(), 0);
  }

  async function commit() {
    const trimmed = val.trim();
    if (trimmed === value.trim()) {
      setEditing(false);
      return;
    }
    setSaving(true);
    await onSave(trimmed);
    setSaving(false);
    setEditing(false);
  }

  function cancel() {
    setVal(value);
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
        className="w-full rounded border border-border bg-background px-1.5 py-0.5 text-sm outline-none ring-1 ring-primary/40 focus:ring-primary disabled:opacity-60"
      />
    );
  }

  return (
    <span
      onClick={startEdit}
      title="Clic para editar"
      className="block min-h-[1.5rem] cursor-text rounded px-1 py-0.5 text-sm text-foreground font-medium transition-colors hover:bg-muted/50"
    >
      {val || <span className="text-muted-foreground/60 font-normal">{placeholder}</span>}
    </span>
  );
}

interface InlineNumberProps {
  value: number | null | undefined;
  onSave: (val: number | null) => Promise<void>;
}

function InlineNumber({ value, onSave }: InlineNumberProps) {
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
    if (num === value || (num === null && value == null)) {
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
        min={0}
        value={val}
        onChange={(e) => setVal(e.target.value)}
        onBlur={commit}
        onKeyDown={handleKeyDown}
        disabled={saving}
        className="w-24 rounded border border-border bg-background px-1.5 py-0.5 text-sm outline-none ring-1 ring-primary/40 focus:ring-primary disabled:opacity-60"
      />
    );
  }

  return (
    <span
      onClick={startEdit}
      title="Clic para editar"
      className="block min-h-[1.5rem] cursor-text rounded px-1 py-0.5 text-sm text-foreground font-medium transition-colors hover:bg-muted/50"
    >
      {value != null ? (
        value
      ) : (
        <span className="text-muted-foreground/60 font-normal">—</span>
      )}
    </span>
  );
}

interface InlineSelectProps {
  value: string;
  placeholder?: string;
  options: { value: string; label: string }[];
  onSave: (val: string) => Promise<void>;
}

function InlineSelect({ value, placeholder = "—", options, onSave }: InlineSelectProps) {
  const [saving, setSaving] = React.useState(false);

  async function handleChange(newVal: string) {
    if (newVal === value) return;
    setSaving(true);
    await onSave(newVal);
    setSaving(false);
  }

  const current = options.find((o) => o.value === value);

  return (
    <Select value={value || "__none__"} onValueChange={(v) => v && handleChange(v === "__none__" ? "" : v)}>
      <SelectTrigger
        className={`h-auto px-2 py-0.5 text-sm border-transparent bg-transparent hover:bg-muted/40 transition-colors w-auto gap-1 font-medium ${saving ? "opacity-60" : ""}`}
      >
        {current?.label ?? (
          <span className="text-muted-foreground/60 font-normal">{placeholder}</span>
        )}
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="__none__">
          <span className="text-muted-foreground">Sin régimen</span>
        </SelectItem>
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

interface InlineTextareaProps {
  value: string;
  placeholder?: string;
  onSave: (val: string) => Promise<void>;
}

function InlineTextarea({ value, placeholder = "Clic para editar...", onSave }: InlineTextareaProps) {
  const [editing, setEditing] = React.useState(false);
  const [val, setVal] = React.useState(value);
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    if (!editing) setVal(value);
  }, [value, editing]);

  async function commit() {
    const trimmed = val.trim();
    if (trimmed === value.trim()) {
      setEditing(false);
      return;
    }
    setSaving(true);
    await onSave(trimmed);
    setSaving(false);
    setEditing(false);
  }

  function cancel() {
    setVal(value);
    setEditing(false);
  }

  if (editing) {
    return (
      <div className="space-y-2">
        <textarea
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary resize-none"
          rows={3}
          value={val}
          onChange={(e) => setVal(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Escape") cancel();
          }}
          autoFocus
          disabled={saving}
        />
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={commit}
            disabled={saving}
            className="text-xs font-medium text-primary hover:text-primary/80 disabled:opacity-50"
          >
            {saving ? "Guardando..." : "Guardar"}
          </button>
          <button
            type="button"
            onClick={cancel}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            Cancelar
          </button>
        </div>
      </div>
    );
  }

  return (
    <button
      type="button"
      className="w-full text-left"
      onClick={() => setEditing(true)}
    >
      {value ? (
        <p className="text-sm text-foreground whitespace-pre-wrap hover:text-foreground/80">
          {value}
        </p>
      ) : (
        <p className="text-sm text-muted-foreground italic hover:text-muted-foreground/80">
          {placeholder}
        </p>
      )}
    </button>
  );
}


"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { X, ChevronRight, KeyRound } from "lucide-react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { updateStaffAction, toggleStaffActiveAction, resetPasswordAction } from "@/features/staff/actions";
import type { getStaffList } from "@/features/staff/queries";

type StaffMember = Awaited<ReturnType<typeof getStaffList>>[number];

const roleBadgeClass: Record<string, string> = {
  GERENCIA:
    "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
  ADMINISTRADOR:
    "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  CONTADOR:
    "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
  VENTAS:
    "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
};

const roleLabel: Record<string, string> = {
  GERENCIA: "Gerencia",
  ADMINISTRADOR: "Administrador",
  CONTADOR: "Contador",
  VENTAS: "Ventas",
};

const ROLES = [
  { value: "GERENCIA", label: "Gerencia" },
  { value: "ADMINISTRADOR", label: "Administrador" },
  { value: "CONTADOR", label: "Contador" },
  { value: "VENTAS", label: "Ventas" },
] as const;

// ─── Inline editable field ───

interface EditableFieldProps {
  label: string;
  value: string;
  onSave: (val: string) => Promise<void>;
  placeholder?: string;
}

function EditableField({ label, value, onSave, placeholder }: EditableFieldProps) {
  const [editing, setEditing] = React.useState(false);
  const [draft, setDraft] = React.useState(value);
  const [saving, setSaving] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    setDraft(value);
  }, [value]);

  React.useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  async function handleSave() {
    if (draft === value) {
      setEditing(false);
      return;
    }
    setSaving(true);
    await onSave(draft);
    setSaving(false);
    setEditing(false);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") handleSave();
    if (e.key === "Escape") {
      setDraft(value);
      setEditing(false);
    }
  }

  return (
    <div className="space-y-0.5">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
        {label}
      </p>
      {editing ? (
        <input
          ref={inputRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
          disabled={saving}
          placeholder={placeholder}
          className="w-full rounded border border-border bg-background px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
        />
      ) : (
        <button
          onClick={() => setEditing(true)}
          className="block w-full text-left rounded px-2 py-1 text-sm hover:bg-muted/50 transition-colors"
        >
          {value || <span className="text-muted-foreground italic">{placeholder ?? "—"}</span>}
        </button>
      )}
    </div>
  );
}

// ─── Main dialog ───

interface StaffDetailDialogProps {
  member: StaffMember | null;
  onClose: () => void;
}

export function StaffDetailDialog({ member, onClose }: StaffDetailDialogProps) {
  React.useEffect(() => {
    if (!member) return;
    function handleEsc(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [member, onClose]);

  if (!member) return null;

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
        <DetailContent member={member} onClose={onClose} />
      </div>
    </div>
  );
}

// ─── Content ───

function DetailContent({
  member: initial,
  onClose,
}: {
  member: StaffMember;
  onClose: () => void;
}) {
  const router = useRouter();
  const [m, setM] = React.useState(initial);
  const [togglingActive, setTogglingActive] = React.useState(false);
  const [savingRole, setSavingRole] = React.useState(false);

  // Reset password state
  const [newPassword, setNewPassword] = React.useState("");
  const [savingPassword, setSavingPassword] = React.useState(false);

  React.useEffect(() => {
    setM(initial);
  }, [initial]);

  async function saveField(field: "nombre" | "apellido" | "telefono", value: string) {
    const result = await updateStaffAction(m.id, { [field]: value });
    if (result.error) {
      toast.error(result.error);
    } else {
      setM((prev) => ({ ...prev, [field]: value }));
      router.refresh();
    }
  }

  async function saveRole(role: string) {
    setSavingRole(true);
    const result = await updateStaffAction(m.id, {
      role: role as StaffMember["role"],
    });
    if (result.error) {
      toast.error(result.error);
    } else {
      setM((prev) => ({ ...prev, role: role as StaffMember["role"] }));
      router.refresh();
    }
    setSavingRole(false);
  }

  async function handleToggleActive() {
    setTogglingActive(true);
    const result = await toggleStaffActiveAction(m.id);
    if (result.error) {
      toast.error(result.error);
    } else {
      const newActivo = result.activo ?? !m.activo;
      setM((prev) => ({ ...prev, activo: newActivo }));
      toast.success(newActivo ? "Miembro activado" : "Miembro desactivado");
      router.refresh();
    }
    setTogglingActive(false);
  }

  async function handleResetPassword() {
    if (newPassword.length < 6) {
      toast.error("La contraseña debe tener al menos 6 caracteres");
      return;
    }
    setSavingPassword(true);
    const result = await resetPasswordAction(m.id, newPassword);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Contraseña actualizada");
      setNewPassword("");
    }
    setSavingPassword(false);
  }

  return (
    <>
      {/* Header */}
      <div className="flex items-start justify-between gap-4 px-5 py-4 border-b border-border">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-lg font-semibold truncate">
              {m.nombre} {m.apellido}
            </h2>
            <span
              className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                roleBadgeClass[m.role] ?? ""
              }`}
            >
              {roleLabel[m.role] ?? m.role}
            </span>
            <div className="flex items-center gap-1">
              <span
                className={`size-2 rounded-full ${
                  m.activo ? "bg-green-500" : "bg-gray-400"
                }`}
              />
              <span className="text-xs text-muted-foreground">
                {m.activo ? "Activo" : "Inactivo"}
              </span>
            </div>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5 truncate">
            {m.email}
          </p>
        </div>
        <button
          onClick={onClose}
          className="mt-0.5 shrink-0 rounded-lg p-1 hover:bg-muted transition-colors text-muted-foreground"
        >
          <X className="size-4" />
          <span className="sr-only">Cerrar</span>
        </button>
      </div>

      {/* Body */}
      <div className="px-5 py-4 space-y-5">
        {/* Editable fields */}
        <div className="grid grid-cols-2 gap-3">
          <EditableField
            label="Nombre"
            value={m.nombre}
            onSave={(val) => saveField("nombre", val)}
            placeholder="Nombre"
          />
          <EditableField
            label="Apellido"
            value={m.apellido}
            onSave={(val) => saveField("apellido", val)}
            placeholder="Apellido"
          />
        </div>

        <EditableField
          label="Teléfono"
          value={m.telefono ?? ""}
          onSave={(val) => saveField("telefono", val)}
          placeholder="999 888 777"
        />

        {/* Rol */}
        <div className="space-y-0.5">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
            Rol
          </p>
          <Select
            value={m.role}
            onValueChange={saveRole}
            disabled={savingRole}
          >
            <SelectTrigger className="w-full">
              <SelectValue>
                {roleLabel[m.role] ?? m.role}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {ROLES.map((r) => (
                <SelectItem key={r.value} value={r.value}>
                  {r.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg border border-border bg-muted/30 px-4 py-3 text-center">
            <p className="text-2xl font-bold tabular-nums">{m._count.servicios}</p>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground mt-0.5">
              Servicios
            </p>
          </div>
          <div className="rounded-lg border border-border bg-muted/30 px-4 py-3 text-center">
            <p className="text-2xl font-bold tabular-nums">
              {m._count.personasAsignadas}
            </p>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground mt-0.5">
              Clientes
            </p>
          </div>
        </div>

        {/* Estado toggle */}
        <div className="flex items-center justify-between rounded-lg border border-border px-4 py-3">
          <div className="flex items-center gap-2">
            <span
              className={`size-2.5 rounded-full ${
                m.activo ? "bg-green-500" : "bg-gray-400"
              }`}
            />
            <span className="text-sm font-medium">
              {m.activo ? "Cuenta activa" : "Cuenta inactiva"}
            </span>
          </div>
          <button
            onClick={handleToggleActive}
            disabled={togglingActive}
            className={`rounded-md px-3 py-1 text-xs font-medium transition-colors disabled:opacity-50 ${
              m.activo
                ? "bg-destructive/10 text-destructive hover:bg-destructive/20"
                : "bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400 dark:hover:bg-green-900/50"
            }`}
          >
            {togglingActive ? "..." : m.activo ? "Desactivar" : "Activar"}
          </button>
        </div>

        {/* Reset password */}
        <div className="space-y-2 rounded-lg border border-border px-4 py-3">
          <div className="flex items-center gap-1.5 text-sm font-medium">
            <KeyRound className="size-3.5 text-muted-foreground" />
            Cambiar contraseña
          </div>
          <div className="flex gap-2">
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Nueva contraseña (mín. 6)"
              className="flex-1 rounded border border-border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <button
              onClick={handleResetPassword}
              disabled={savingPassword || newPassword.length < 6}
              className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              {savingPassword ? "..." : "Guardar"}
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-end border-t border-border px-5 py-3">
        <Link
          href={`/equipo/${m.id}`}
          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          Ver perfil completo
          <ChevronRight className="size-3" />
        </Link>
      </div>
    </>
  );
}

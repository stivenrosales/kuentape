"use client";

import * as React from "react";
import { Eye, EyeOff, Copy, Loader2, Pencil, Check, X } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { updateCredentialsAction } from "@/features/personas/actions";

interface CredentialRevealProps {
  personaId: string;
  field: "claveSolUsuario" | "claveSolClave" | "afpUsuario" | "afpClave";
  label: string;
  className?: string;
}

const REVEAL_SECONDS = 30;

export function CredentialReveal({
  personaId,
  field,
  label,
  className,
}: CredentialRevealProps) {
  const [value, setValue] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [visible, setVisible] = React.useState(false);
  const [countdown, setCountdown] = React.useState(0);
  const [copied, setCopied] = React.useState(false);
  const [editing, setEditing] = React.useState(false);
  const [editVal, setEditVal] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  const timerRef = React.useRef<ReturnType<typeof setInterval> | null>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const hide = React.useCallback(() => {
    setVisible(false);
    setValue(null);
    setCountdown(0);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  React.useEffect(() => {
    const handleBlur = () => { if (!editing) hide(); };
    window.addEventListener("blur", handleBlur);
    return () => window.removeEventListener("blur", handleBlur);
  }, [hide, editing]);

  React.useEffect(() => {
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  React.useEffect(() => {
    if (editing && inputRef.current) { inputRef.current.focus(); inputRef.current.select(); }
  }, [editing]);

  async function handleReveal() {
    if (visible) { hide(); return; }
    setLoading(true);
    try {
      const res = await fetch(`/api/credentials/${personaId}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      const fieldValue = data[field] as string;
      setValue(fieldValue || "");
      setVisible(true);
      setCountdown(REVEAL_SECONDS);
      timerRef.current = setInterval(() => {
        setCountdown((prev) => { if (prev <= 1) { hide(); return 0; } return prev - 1; });
      }, 1000);
    } catch { setValue(null); }
    finally { setLoading(false); }
  }

  async function handleCopy() {
    if (!value) return;
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function startEdit() {
    hide();
    setEditVal(value ?? "");
    setEditing(true);
  }

  async function saveEdit() {
    setSaving(true);
    try {
      const result = await updateCredentialsAction(personaId, { [field]: editVal });
      if (result && "error" in result) {
        toast.error("Error al guardar");
      } else {
        toast.success("Credencial actualizada");
        setEditing(false);
      }
    } catch {
      toast.error("Error al guardar");
    }
    setSaving(false);
  }

  function cancelEdit() {
    setEditing(false);
    setEditVal("");
  }

  if (editing) {
    return (
      <div className={cn("flex flex-col gap-1", className)}>
        <span className="text-[10px] text-muted-foreground">{label}</span>
        <div className="flex items-center gap-1">
          <input
            ref={inputRef}
            type="text"
            value={editVal}
            onChange={(e) => setEditVal(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") saveEdit(); if (e.key === "Escape") cancelEdit(); }}
            className="h-7 flex-1 rounded border border-input bg-background px-2 text-xs font-mono outline-none focus:ring-1 focus:ring-primary"
            disabled={saving}
          />
          <button onClick={saveEdit} disabled={saving} className="h-7 w-7 flex items-center justify-center rounded text-green-600 hover:bg-green-50 dark:hover:bg-green-950/30">
            <Check className="h-3.5 w-3.5" />
          </button>
          <button onClick={cancelEdit} className="h-7 w-7 flex items-center justify-center rounded text-muted-foreground hover:bg-muted">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <span className="text-[10px] text-muted-foreground">{label}</span>
      <div className="flex items-center gap-1">
        <div className="flex h-7 flex-1 items-center rounded border border-input bg-muted/20 px-2 font-mono text-xs">
          {loading ? (
            <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
          ) : visible && value !== null ? (
            <span className="select-all truncate">{value || "(vacío)"}</span>
          ) : (
            <span className="text-muted-foreground tracking-widest">••••••••</span>
          )}
        </div>

        <button
          onClick={handleReveal}
          disabled={loading}
          className="h-7 w-7 flex items-center justify-center rounded text-muted-foreground hover:bg-muted transition-colors"
          title={visible ? "Ocultar" : "Mostrar"}
        >
          {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : visible ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
        </button>

        {visible && value !== null && (
          <>
            <button onClick={handleCopy} className="h-7 w-7 flex items-center justify-center rounded text-muted-foreground hover:bg-muted" title="Copiar">
              <Copy className="h-3 w-3" />
            </button>
            <button onClick={startEdit} className="h-7 w-7 flex items-center justify-center rounded text-muted-foreground hover:bg-muted" title="Editar">
              <Pencil className="h-3 w-3" />
            </button>
          </>
        )}

        {visible && countdown > 0 && (
          <span className="text-[10px] tabular-nums text-muted-foreground">{countdown}s</span>
        )}
        {copied && <span className="text-[10px] text-green-600">Copiado</span>}
      </div>
    </div>
  );
}

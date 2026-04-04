"use client";

import * as React from "react";
import { toast } from "sonner";
import {
  X, Check, CircleDollarSign, Building2, User, Calendar,
  FileText, CreditCard, MessageSquare, Upload, ChevronRight, AlertTriangle,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { updateServicioAction } from "@/features/servicios/actions";
import { declararServicioAction, desdeclararServicioAction } from "@/features/servicios/actions-workflow";
import { registrarCobroAction } from "@/features/servicios/actions";
import type { ServicioListItem } from "@/features/servicios/queries-list";

// ─── Main Dialog ───

interface DetailDialogProps {
  servicio: ServicioListItem | null;
  cuentas: { id: string; nombre: string; banco: string }[];
  onClose: () => void;
}

export function ServicioDetailDialog({ servicio, cuentas, onClose }: DetailDialogProps) {
  React.useEffect(() => {
    if (!servicio) return;
    function handleEsc(e: KeyboardEvent) {
      if (e.key === "Escape") { e.stopImmediatePropagation(); onClose(); }
    }
    document.addEventListener("keydown", handleEsc, true);
    return () => document.removeEventListener("keydown", handleEsc, true);
  }, [servicio, onClose]);

  if (!servicio) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />
      <div
        className="relative w-full max-w-2xl bg-card rounded-lg shadow-2xl overflow-hidden animate-in zoom-in-95 fade-in duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <DetailContent servicio={servicio} cuentas={cuentas} onClose={onClose} />
      </div>
    </div>
  );
}

// ─── Content ───

function DetailContent({
  servicio: initial,
  cuentas,
  onClose,
}: {
  servicio: ServicioListItem;
  cuentas: { id: string; nombre: string; banco: string }[];
  onClose: () => void;
}) {
  const [s, setS] = React.useState(initial);
  const [saving, setSaving] = React.useState(false);
  const [refreshKey, setRefreshKey] = React.useState(0);

  React.useEffect(() => setS(initial), [initial]);

  // Refresh service data from server after mutations
  async function refreshServicio() {
    try {
      const res = await fetch(`/api/servicios/${s.id}`);
      if (res.ok) {
        const updated = await res.json();
        setS(updated);
      }
    } catch { /* silent */ }
    setRefreshKey((k) => k + 1); // triggers historial re-fetch
  }

  const progreso = s.precioFinal > 0
    ? Math.min(100, Math.round((s.montoCobrado / s.precioFinal) * 100))
    : 0;

  const yaCobrado = s.estadoCobranza === "COBRADO";
  const esPorDeclarar = s.estadoTrabajo === "POR_DECLARAR";

  async function saveField(field: string, value: number) {
    setSaving(true);
    try {
      const result = await updateServicioAction(s.id, { [field]: value } as any);
      if (result && "error" in result) {
        toast.error(typeof result.error === "string" ? result.error : "Error al guardar");
      } else {
        await refreshServicio();
      }
    } catch {
      toast.error("Error al guardar");
    }
    setSaving(false);
  }

  async function handleToggleDeclarado() {
    if (esPorDeclarar) {
      const result = await declararServicioAction(s.id);
      if (result?.error) {
        toast.error(result.error);
      } else {
        setS((prev) => ({ ...prev, estadoTrabajo: "POR_COBRAR" as any }));
        toast.success("Declarado");
      }
    } else if (s.estadoTrabajo === "POR_COBRAR") {
      const result = await desdeclararServicioAction(s.id);
      if (result?.error) {
        toast.error(result.error);
      } else {
        setS((prev) => ({ ...prev, estadoTrabajo: "POR_DECLARAR" as any }));
        toast.success("Declaración deshecha");
      }
    }
  }

  return (
    <>
      <div className="max-h-[85vh] overflow-y-auto">

        {/* ═══ HEADER ═══ */}
        <div className="px-6 pt-5 pb-4 border-b border-border">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <Badge variant="outline" className="text-xs font-medium bg-primary/10 text-primary border-transparent">
                  {s.tipoServicio.nombre}
                </Badge>
                <span className="text-sm text-muted-foreground font-mono">{s.periodo}</span>
                <Badge variant="outline" className={cn("text-xs border-transparent",
                  yaCobrado ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300" :
                  s.estadoCobranza === "PARCIAL" ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300" :
                  "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                )}>
                  {s.estadoCobranza === "COBRADO" ? "Cobrado" : s.estadoCobranza === "PARCIAL" ? "Parcial" : "Pendiente"}
                </Badge>
                {(esPorDeclarar || s.estadoTrabajo === "POR_COBRAR") && (
                  <button
                    onClick={handleToggleDeclarado}
                    className={cn(
                      "flex items-center gap-1.5 rounded px-2 py-0.5 text-[11px] font-medium transition-colors",
                      esPorDeclarar
                        ? "border border-border bg-muted/40 text-muted-foreground hover:bg-muted/70 hover:text-foreground"
                        : "border border-primary/30 bg-primary/10 text-primary hover:bg-primary/20"
                    )}
                  >
                    {esPorDeclarar ? (
                      <>
                        <div className="w-3 h-3 rounded border-[1.5px] border-current" />
                        Declarar
                      </>
                    ) : (
                      <>
                        <Check className="h-3 w-3" />
                        Declarado
                      </>
                    )}
                  </button>
                )}
              </div>
              <h2 className="text-lg font-bold leading-tight">{s.persona.razonSocial}</h2>
              <div className="flex items-center gap-2 mt-1.5 text-sm text-muted-foreground flex-wrap">
                <span className="flex items-center gap-1.5"><User className="h-3.5 w-3.5" />{s.contador.nombre} {s.contador.apellido}</span>
                <span className="text-border">·</span>
                <Badge variant="outline" className="text-[10px] px-1.5 py-0 font-normal">{s.persona.tipoPersona === "JURIDICA" ? "Jurídica" : s.persona.tipoPersona === "NATURAL" ? "Natural" : s.persona.tipoPersona}</Badge>
                <Badge variant="outline" className="text-[10px] px-1.5 py-0 font-normal">{s.persona.regimen}</Badge>
                <span className="text-border">·</span>
                <a href={`/clientes/${s.persona.id}`} className="flex items-center gap-1 hover:text-primary transition-colors text-xs">
                  <Building2 className="h-3 w-3" />Ver cliente
                </a>
              </div>
            </div>
            <button onClick={onClose} className="shrink-0 p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="px-6 py-4 space-y-4">

          {/* ═══ COBRANZA — compacto ═══ */}
          <section>
            <SectionLabel icon={<CreditCard />} label="Cobranza" />
            <div className="grid grid-cols-4 gap-px bg-border rounded-lg overflow-hidden mt-2">
              <StatCard label="Precio Final" value={formatCurrency(s.precioFinal)} />
              <StatCard label="Cobrado" value={formatCurrency(s.montoCobrado)} variant="green" />
              <StatCard label="Restante" value={formatCurrency(s.montoRestante)} variant={s.montoRestante > 0 ? "red" : "green"} />
              <StatCard label="Avance" value={`${progreso}%`} />
            </div>
            {progreso > 0 && (
              <div className="h-1.5 rounded-full bg-muted overflow-hidden mt-2">
                <div className="h-full rounded-full transition-all duration-500 bg-primary" style={{ width: `${progreso}%` }} />
              </div>
            )}
            {yaCobrado && (
              <div className="flex items-center gap-1.5 mt-2 text-xs font-medium text-green-600 dark:text-green-400">
                <Check className="h-3.5 w-3.5" /> Totalmente cobrado
              </div>
            )}
          </section>

          {/* ═══ ACCIONES DE WORKFLOW ═══ */}
          {esPorDeclarar && (
            <button
              onClick={handleToggleDeclarado}
              className="w-full flex items-center justify-center gap-2 rounded-lg border border-border bg-muted/20 px-4 py-2.5 text-sm font-medium text-foreground hover:bg-muted/40 transition-colors"
            >
              <div className="w-4 h-4 rounded border-2 border-muted-foreground/40" />
              Marcar como Declarado
            </button>
          )}

          {/* ═══ REGISTRAR COBRO ═══ */}
          {!yaCobrado && !esPorDeclarar && s.montoRestante > 0 && (
            <CobroCard servicioId={s.id} montoRestante={s.montoRestante} cuentas={cuentas} onSuccess={refreshServicio} />
          )}

          {/* ═══ HISTORIAL DE PAGOS ═══ */}
          <HistorialPagos servicioId={s.id} refreshKey={refreshKey} />

          {/* ═══ DETALLE TRIBUTARIO — grid 4×2 uniforme ═══ */}
          <section>
            <SectionLabel icon={<FileText />} label="Detalle Tributario" />
            <div className="mt-2 rounded-lg border border-border overflow-hidden">
              <div className="grid grid-cols-4 divide-x divide-border">
                <EditableField label="Base Imp." value={s.baseImponible} onSave={(v) => saveField("baseImponible", v)} />
                <EditableField label="No Gravado" value={s.noGravado} onSave={(v) => saveField("noGravado", v)} />
                <ReadOnlyField label="IGV (18%)" value={s.igv} />
                <ReadOnlyField label="Total Imp." value={s.totalImponible} />
              </div>
              <div className="grid grid-cols-4 divide-x divide-border border-t border-border bg-muted/10">
                <ReadOnlyField label="Honorarios" value={s.honorarios} computed />
                <EditableField label="Descuento" value={s.descuento} onSave={(v) => saveField("descuento", v)} />
                <ReadOnlyField label="Precio Final" value={s.precioFinal} computed />
                <ReadOnlyField label="Monto Rest." value={s.montoRestante} computed />
              </div>
            </div>
          </section>

          {/* ═══ INFORMACIÓN + CLIENTE — inline ═══ */}
          <section>
            <SectionLabel icon={<Calendar />} label="Información" />
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-2 text-xs">
              <InfoRow label="Tipo" value={s.tipoServicio.nombre} />
              <InfoRow label="Período" value={s.periodo ?? "—"} />
              <InfoRow label="Contador" value={`${s.contador.nombre} ${s.contador.apellido}`} />
              <InfoRow label="Estado" value={
                s.estadoTrabajo === "POR_DECLARAR" ? "Por Declarar" :
                s.estadoTrabajo === "POR_COBRAR" ? "Por Cobrar" :
                s.estadoTrabajo === "ARCHIVADO" ? "Archivado" : s.estadoTrabajo
              } />
            </div>
          </section>

          {/* ═══ DATOS DEL CLIENTE — toggle sutil ═══ */}
          <ClienteToggle personaId={s.persona.id} personaNombre={s.persona.razonSocial} />

          {/* ═══ INCIDENCIAS ═══ */}
          <IncidenciasSection personaId={s.persona.id} />
        </div>
      </div>

      {saving && (
        <div className="absolute top-3 right-12 flex items-center gap-1.5 text-xs text-muted-foreground">
          <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
          Guardando...
        </div>
      )}
    </>
  );
}

// ─── COBRO CARD — colapsable, compacto ───

function CobroCard({
  servicioId,
  montoRestante,
  cuentas,
  onSuccess,
}: {
  servicioId: string;
  montoRestante: number;
  cuentas: { id: string; nombre: string; banco: string }[];
  onSuccess: () => void;
}) {
  const [open, setOpen] = React.useState(false);
  const [monto, setMonto] = React.useState(String((montoRestante / 100).toFixed(2)));
  const [cuentaId, setCuentaId] = React.useState(cuentas[0]?.id ?? "");
  const [fecha, setFecha] = React.useState(() => new Date().toISOString().split("T")[0]!);
  const [concepto, setConcepto] = React.useState("Cobro de servicio");
  const [numeroOp, setNumeroOp] = React.useState("");
  const [adjunto, setAdjunto] = React.useState<File | null>(null);
  const [loading, setLoading] = React.useState(false);
  const fileRef = React.useRef<HTMLInputElement>(null);

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full flex items-center justify-between rounded-lg border border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-950/10 px-4 py-2.5 text-sm hover:bg-green-100/50 dark:hover:bg-green-950/20 transition-colors"
      >
        <span className="flex items-center gap-2 font-medium text-green-700 dark:text-green-300">
          <CircleDollarSign className="h-4 w-4" />
          Registrar Cobro
        </span>
        <span className="text-xs text-green-600/70 dark:text-green-400/70">
          Pendiente: {formatCurrency(montoRestante)}
        </span>
      </button>
    );
  }

  async function uploadFile(file: File): Promise<string | undefined> {
    const form = new FormData();
    form.append("file", file);
    form.append("folder", "comprobantes");
    const res = await fetch("/api/upload", { method: "POST", body: form });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      toast.error(err.error || "Error al subir archivo");
      return undefined;
    }
    const data = await res.json();
    return data.url;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const centavos = Math.round(parseFloat(monto) * 100);
    if (isNaN(centavos) || centavos <= 0) {
      toast.error("Monto inválido");
      setLoading(false);
      return;
    }

    // Upload comprobante to R2 if selected
    let comprobanteUrl: string | undefined;
    if (adjunto) {
      comprobanteUrl = await uploadFile(adjunto);
    }

    const result = await registrarCobroAction(servicioId, {
      monto: centavos,
      cuentaId,
      fecha: new Date(fecha + "T12:00:00"),
      concepto,
      numeroOperacion: numeroOp || undefined,
      comprobanteUrl,
    });

    if (result && "error" in result) {
      toast.error(typeof result.error === "string" ? result.error : "Error al registrar cobro");
    } else {
      toast.success("Cobro registrado");
      setOpen(false);
      onSuccess();
    }
    setLoading(false);
  }

  return (
    <section className="rounded-lg border border-green-200 dark:border-green-800 bg-green-50/30 dark:bg-green-950/10 overflow-hidden">
      {/* Header colapsable */}
      <button
        onClick={() => setOpen(false)}
        className="w-full flex items-center justify-between px-4 py-2 text-sm font-medium text-green-700 dark:text-green-300 hover:bg-green-100/30 transition-colors"
      >
        <span className="flex items-center gap-2">
          <CircleDollarSign className="h-4 w-4" />
          Registrar Cobro
        </span>
        <X className="h-3.5 w-3.5 text-muted-foreground" />
      </button>

      <form onSubmit={handleSubmit} className="px-4 pb-3 space-y-2.5">
        {/* Fila 1: Monto + Cuenta + Fecha */}
        <div className="grid grid-cols-3 gap-2">
          <div>
            <label className="text-[10px] text-muted-foreground block mb-0.5">Monto *</label>
            <div className="flex items-center rounded-md border border-input bg-background h-8">
              <span className="px-2 text-xs text-muted-foreground border-r border-input bg-muted/30 h-full flex items-center">S/.</span>
              <input
                type="text"
                value={monto}
                onChange={(e) => setMonto(e.target.value)}
                className="flex-1 px-2 text-xs font-mono bg-transparent outline-none h-full"
                autoFocus
              />
            </div>
          </div>
          <div>
            <label className="text-[10px] text-muted-foreground block mb-0.5">Cuenta *</label>
            <select
              value={cuentaId}
              onChange={(e) => setCuentaId(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-2 h-8 text-xs outline-none"
            >
              {cuentas.map((c) => (
                <option key={c.id} value={c.id}>{c.nombre}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-[10px] text-muted-foreground block mb-0.5">Fecha *</label>
            <input
              type="date"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-2 h-8 text-xs outline-none"
            />
          </div>
        </div>

        {/* Fila 2: Concepto + N° Op + Adjunto */}
        <div className="grid grid-cols-3 gap-2">
          <div>
            <label className="text-[10px] text-muted-foreground block mb-0.5">Concepto</label>
            <input
              type="text"
              value={concepto}
              onChange={(e) => setConcepto(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-2 h-8 text-xs outline-none"
            />
          </div>
          <div>
            <label className="text-[10px] text-muted-foreground block mb-0.5">N° Operación</label>
            <input
              type="text"
              value={numeroOp}
              onChange={(e) => setNumeroOp(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-2 h-8 text-xs font-mono outline-none"
              placeholder="Opcional"
            />
          </div>
          <div>
            <label className="text-[10px] text-muted-foreground block mb-0.5">Comprobante</label>
            <div
              onClick={() => fileRef.current?.click()}
              className="flex items-center gap-1.5 rounded-md border border-dashed border-input bg-background px-2 h-8 cursor-pointer hover:bg-muted/30 transition-colors"
            >
              <Upload className="h-3 w-3 text-muted-foreground shrink-0" />
              <span className="text-[10px] text-muted-foreground truncate">
                {adjunto ? adjunto.name : "Subir captura"}
              </span>
              <input ref={fileRef} type="file" accept="image/*,.pdf" className="hidden" onChange={(e) => setAdjunto(e.target.files?.[0] ?? null)} />
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex items-center justify-end gap-2 pt-0.5">
          <button type="button" onClick={() => setOpen(false)} className="text-xs text-muted-foreground hover:text-foreground px-2 py-1">
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="rounded-md bg-green-600 hover:bg-green-700 px-4 py-1.5 text-xs font-medium text-white disabled:opacity-50 transition-colors"
          >
            {loading ? "..." : "Confirmar Cobro"}
          </button>
        </div>
      </form>
    </section>
  );
}

// ─── Historial de pagos (fetches data client-side) ───

// ─── Datos del cliente — toggle colapsable ───

function ClienteToggle({ personaId, personaNombre }: { personaId: string; personaNombre: string }) {
  const [data, setData] = React.useState<any | null>(null);

  React.useEffect(() => {
    fetch(`/api/servicios/${personaId}/cliente`)
      .then((r) => r.ok ? r.json() : null)
      .then(setData)
      .catch(() => setData(null));
  }, [personaId]);

  if (!data) return null;

  return (
    <section>
      <SectionLabel icon={<Building2 />} label="Datos del Cliente" />
      <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-2 text-xs">
        <InfoRow label="RUC" value={<span className="font-mono">{data.ruc}</span>} />
        <InfoRow label="Dirección" value={data.direccion || "—"} />
        <InfoRow label="Teléfono" value={data.telefono || "—"} />
        <InfoRow label="Email" value={data.email || "—"} />
        {data.representanteNombre && <InfoRow label="Rep. Legal" value={data.representanteNombre} />}
        {data.representanteTelefono && <InfoRow label="Tel. Rep." value={data.representanteTelefono} />}
      </div>
      <a href={`/clientes/${personaId}`} className="inline-block mt-2 text-[10px] text-primary hover:underline">
        Ver ficha completa →
      </a>
    </section>
  );
}

// ─── Incidencias del cliente ───

function IncidenciasSection({ personaId }: { personaId: string }) {
  const [incidencias, setIncidencias] = React.useState<any[] | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [formOpen, setFormOpen] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [titulo, setTitulo] = React.useState("");
  const [descripcion, setDescripcion] = React.useState("");
  const [prioridad, setPrioridad] = React.useState("MEDIA");

  function fetchIncidencias() {
    fetch(`/api/clientes/${personaId}/incidencias`)
      .then((r) => r.ok ? r.json() : [])
      .then(setIncidencias)
      .catch(() => setIncidencias([]))
      .finally(() => setLoading(false));
  }

  React.useEffect(() => { fetchIncidencias(); }, [personaId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!titulo.trim()) { toast.error("El título es requerido"); return; }
    setSaving(true);
    try {
      const res = await fetch(`/api/clientes/${personaId}/incidencias`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ titulo, descripcion, prioridad }),
      });
      if (res.ok) {
        toast.success("Incidencia registrada");
        setTitulo("");
        setDescripcion("");
        setPrioridad("MEDIA");
        setFormOpen(false);
        fetchIncidencias();
      } else {
        toast.error("Error al registrar");
      }
    } catch { toast.error("Error al registrar"); }
    setSaving(false);
  }

  const PRIORIDAD_STYLE: Record<string, string> = {
    ALTA: "text-red-600 bg-red-100 dark:bg-red-900/30 dark:text-red-300",
    MEDIA: "text-amber-600 bg-amber-100 dark:bg-amber-900/30 dark:text-amber-300",
    BAJA: "text-gray-600 bg-gray-100 dark:bg-gray-800 dark:text-gray-400",
  };

  return (
    <section>
      <div className="flex items-center justify-between">
        <SectionLabel icon={<AlertTriangle />} label="Incidencias" />
        {!formOpen && (
          <button onClick={() => setFormOpen(true)} className="rounded-full border border-primary/30 bg-primary/10 px-3 py-0.5 text-[11px] font-medium text-primary hover:bg-primary/20 transition-colors">
            + Nueva incidencia
          </button>
        )}
      </div>

      {/* Form colapsable */}
      {formOpen && (
        <form onSubmit={handleSubmit} className="mt-2 rounded-lg border border-border bg-muted/10 p-3 space-y-2">
          <div className="grid grid-cols-3 gap-2">
            <div className="col-span-2">
              <label className="text-[10px] text-muted-foreground block mb-0.5">Título *</label>
              <input
                type="text"
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                className="w-full h-7 rounded border border-input bg-background px-2 text-xs outline-none focus:ring-1 focus:ring-primary"
                placeholder="Descripción breve"
                autoFocus
              />
            </div>
            <div>
              <label className="text-[10px] text-muted-foreground block mb-0.5">Prioridad</label>
              <select
                value={prioridad}
                onChange={(e) => setPrioridad(e.target.value)}
                className="w-full h-7 rounded border border-input bg-background px-2 text-xs outline-none"
              >
                <option value="BAJA">Baja</option>
                <option value="MEDIA">Media</option>
                <option value="ALTA">Alta</option>
              </select>
            </div>
          </div>
          <div>
            <label className="text-[10px] text-muted-foreground block mb-0.5">Detalle</label>
            <textarea
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              className="w-full rounded border border-input bg-background px-2 py-1.5 text-xs outline-none focus:ring-1 focus:ring-primary resize-none"
              rows={2}
              placeholder="Detalle de la incidencia..."
            />
          </div>
          <div className="flex items-center justify-end gap-2">
            <button type="button" onClick={() => setFormOpen(false)} className="text-xs text-muted-foreground hover:text-foreground px-2 py-1">Cancelar</button>
            <button type="submit" disabled={saving} className="rounded bg-primary px-3 py-1 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
              {saving ? "..." : "Registrar"}
            </button>
          </div>
        </form>
      )}

      {/* Lista */}
      <div className="mt-2 space-y-1">
        {loading ? (
          <p className="text-xs text-muted-foreground text-center py-2">Cargando...</p>
        ) : !incidencias || incidencias.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-3 border border-dashed border-border rounded-lg">Sin incidencias</p>
        ) : (
          incidencias.map((inc: any) => (
            <div key={inc.id} className="flex items-start gap-2 rounded-lg border border-border px-3 py-2 text-xs">
              <span className={`shrink-0 rounded px-1.5 py-0.5 text-[9px] font-medium ${PRIORIDAD_STYLE[inc.prioridad] ?? PRIORIDAD_STYLE.MEDIA}`}>
                {inc.prioridad}
              </span>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{inc.titulo}</p>
                {inc.descripcion && <p className="text-muted-foreground truncate mt-0.5">{inc.descripcion}</p>}
              </div>
              <span className="text-[9px] text-muted-foreground shrink-0">
                {new Date(inc.createdAt).toLocaleDateString("es-PE")}
              </span>
            </div>
          ))
        )}
      </div>
    </section>
  );
}

function HistorialPagos({ servicioId, refreshKey = 0 }: { servicioId: string; refreshKey?: number }) {
  const [pagos, setPagos] = React.useState<any[] | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [selectedPago, setSelectedPago] = React.useState<any | null>(null);

  React.useEffect(() => {
    setLoading(true);
    fetch(`/api/servicios/${servicioId}/pagos`)
      .then((r) => r.ok ? r.json() : [])
      .then((data) => setPagos(data))
      .catch(() => setPagos([]))
      .finally(() => setLoading(false));
  }, [servicioId, refreshKey]);

  return (
    <section>
      <SectionLabel icon={<CreditCard />} label="Historial de Pagos" />
      <div className="mt-3">
        {loading ? (
          <div className="text-xs text-muted-foreground py-3 text-center">Cargando pagos...</div>
        ) : !pagos || pagos.length === 0 ? (
          <div className="text-xs text-muted-foreground py-3 text-center border border-dashed border-border rounded-lg">
            Sin pagos registrados
          </div>
        ) : (
          <div className="space-y-1.5">
            {pagos.map((pago: any) => (
              <button
                key={pago.id}
                type="button"
                onClick={() => setSelectedPago(pago)}
                className="w-full flex items-center gap-3 rounded-lg border border-border px-3 py-2 text-sm text-left hover:bg-muted/30 transition-colors cursor-pointer"
              >
                {pago.comprobanteUrl ? (
                  <img src={pago.comprobanteUrl} alt="" className="h-10 w-10 rounded object-cover border border-border shrink-0" />
                ) : (
                  <div className="h-10 w-10 rounded bg-muted/50 flex items-center justify-center shrink-0">
                    <CreditCard className="h-4 w-4 text-muted-foreground/40" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-semibold text-green-600">{formatCurrency(pago.monto)}</span>
                    <span className="text-[10px] text-muted-foreground">{pago.cuenta?.nombre ?? ""}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{new Date(pago.fecha).toLocaleDateString("es-PE")}</span>
                    {pago.concepto && <span>• {pago.concepto}</span>}
                    {pago.numeroOperacion && <span className="font-mono">N° {pago.numeroOperacion}</span>}
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground/30 shrink-0" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Popup de detalle del pago */}
      {selectedPago && (
        <PagoDetailPopup pago={selectedPago} onClose={() => setSelectedPago(null)} />
      )}
    </section>
  );
}

// ─── Popup detalle de un pago ───

function PagoDetailPopup({ pago, onClose }: { pago: any; onClose: () => void }) {
  React.useEffect(() => {
    function handleEsc(e: KeyboardEvent) {
      if (e.key === "Escape") { e.stopPropagation(); onClose(); }
    }
    document.addEventListener("keydown", handleEsc, true);
    return () => document.removeEventListener("keydown", handleEsc, true);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/30" />
      <div
        className="relative w-full max-w-sm bg-card rounded-lg shadow-2xl overflow-hidden animate-in zoom-in-95 fade-in duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">Detalle del Pago</h3>
            <button onClick={onClose} className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted">
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Monto destacado */}
          <div className="text-center py-2">
            <p className="text-2xl font-mono font-bold text-green-600">{formatCurrency(pago.monto)}</p>
            <p className="text-xs text-muted-foreground mt-1">{pago.cuenta?.nombre ?? "Sin cuenta"}</p>
          </div>

          {/* Detalles */}
          <div className="space-y-2 text-sm">
            <div className="flex justify-between py-1 border-b border-border/40">
              <span className="text-muted-foreground">Fecha</span>
              <span className="font-medium">{new Date(pago.fecha).toLocaleDateString("es-PE", { day: "2-digit", month: "long", year: "numeric" })}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-border/40">
              <span className="text-muted-foreground">Concepto</span>
              <span className="font-medium">{pago.concepto || "—"}</span>
            </div>
            {pago.numeroOperacion && (
              <div className="flex justify-between py-1 border-b border-border/40">
                <span className="text-muted-foreground">N° Operación</span>
                <span className="font-mono font-medium">{pago.numeroOperacion}</span>
              </div>
            )}
            <div className="flex justify-between py-1 border-b border-border/40">
              <span className="text-muted-foreground">Cuenta</span>
              <span className="font-medium">{pago.cuenta?.nombre ?? "—"}</span>
            </div>
          </div>

          {/* Comprobante */}
          <div>
            <p className="text-xs text-muted-foreground mb-2">Comprobante</p>
            {pago.comprobanteUrl ? (
              <a href={pago.comprobanteUrl} target="_blank" rel="noopener noreferrer" className="block">
                <img
                  src={pago.comprobanteUrl}
                  alt="Comprobante de pago"
                  className="w-full rounded-lg border border-border object-contain max-h-[300px] bg-muted/20"
                />
                <p className="text-[10px] text-primary mt-1 text-center">Click para abrir en nueva pestaña</p>
              </a>
            ) : (
              <div className="flex flex-col items-center gap-2 py-6 rounded-lg border border-dashed border-border bg-muted/20">
                <CreditCard className="h-8 w-8 text-muted-foreground/30" />
                <p className="text-xs text-muted-foreground">Sin comprobante adjunto</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Sub-components ───

function SectionLabel({ icon, label, hint }: { icon: React.ReactNode; label: string; hint?: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-muted-foreground [&>svg]:h-3.5 [&>svg]:w-3.5">{icon}</span>
      <h3 className="text-sm font-semibold text-foreground">{label}</h3>
      {hint && <span className="text-[10px] text-muted-foreground/60 ml-auto">{hint}</span>}
    </div>
  );
}

function StatCard({ label, value, variant }: { label: string; value: string; variant?: "green" | "red" }) {
  return (
    <div className="bg-card px-3 py-2">
      <p className={cn("text-[10px] mb-0.5",
        variant === "green" ? "text-green-600 dark:text-green-400" :
        variant === "red" ? "text-destructive" :
        "text-muted-foreground"
      )}>{label}</p>
      <p className={cn("text-sm font-mono font-bold",
        variant === "green" ? "text-green-600 dark:text-green-400" :
        variant === "red" ? "text-destructive" :
        "text-foreground"
      )}>{value}</p>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-border/40">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-sm font-medium">{value}</span>
    </div>
  );
}

// ─── Editable field — sobrio, solo hover revela que es editable ───

function EditableField({
  label,
  value,
  onSave,
  note,
}: {
  label: string;
  value: number;
  onSave: (value: number) => void;
  note?: string;
}) {
  const [editing, setEditing] = React.useState(false);
  const [displayVal, setDisplayVal] = React.useState(String((value / 100).toFixed(2)));
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => { setDisplayVal(String((value / 100).toFixed(2))); }, [value]);
  React.useEffect(() => { if (editing && inputRef.current) { inputRef.current.focus(); inputRef.current.select(); } }, [editing]);

  function handleSave() {
    setEditing(false);
    const parsed = parseFloat(displayVal);
    if (isNaN(parsed)) { setDisplayVal(String((value / 100).toFixed(2))); return; }
    const centavos = Math.round(parsed * 100);
    if (centavos !== value) onSave(centavos);
  }

  return (
    <div
      className={cn(
        "px-2.5 py-1.5 transition-colors cursor-pointer bg-card",
        editing ? "bg-primary/5" : "hover:bg-muted/30"
      )}
      onClick={() => !editing && setEditing(true)}
    >
      <p className="text-[9px] text-muted-foreground">{label}</p>
      {editing ? (
        <div className="flex items-center gap-1">
          <span className="text-[10px] text-muted-foreground">S/.</span>
          <input
            ref={inputRef}
            type="text"
            value={displayVal}
            onChange={(e) => setDisplayVal(e.target.value)}
            onBlur={handleSave}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSave();
              if (e.key === "Escape") { setEditing(false); setDisplayVal(String((value / 100).toFixed(2))); }
            }}
            className="w-full bg-transparent font-mono text-xs font-semibold outline-none"
          />
        </div>
      ) : (
        <p className="font-mono text-xs font-semibold">{formatCurrency(value)}</p>
      )}
    </div>
  );
}

// ─── Read-only / auto-calculated field ───

function ReadOnlyField({ label, value, computed }: { label: string; value: number; computed?: boolean }) {
  return (
    <div className="px-2.5 py-1.5">
      <p className="text-[9px] text-muted-foreground/50">{label}</p>
      <p className={cn("font-mono text-xs", computed ? "font-medium text-foreground/60" : "font-medium text-muted-foreground/70")}>
        {formatCurrency(value)}
      </p>
    </div>
  );
}

// ─── Notas editables ───

function InlineNotas({ servicioId, initialNotas }: { servicioId: string; initialNotas: string }) {
  const [notas, setNotas] = React.useState(initialNotas);
  const [saved, setSaved] = React.useState(true);

  async function handleBlur() {
    if (notas === initialNotas) return;
    setSaved(false);
    try {
      await updateServicioAction(servicioId, { notas } as any);
      setSaved(true);
      toast.success("Notas guardadas");
    } catch {
      toast.error("Error al guardar notas");
    }
  }

  return (
    <div className="mt-3">
      {!saved && <span className="text-[10px] text-amber-500 animate-pulse block mb-1">● Cambios sin guardar — guardará al salir del campo</span>}
      <textarea
        value={notas}
        onChange={(e) => { setNotas(e.target.value); setSaved(false); }}
        onBlur={handleBlur}
        placeholder="Agregar notas, observaciones, incidencias de este servicio..."
        className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm resize-none outline-none focus:ring-2 focus:ring-primary/20 min-h-[72px] placeholder:text-muted-foreground/40"
        rows={3}
      />
    </div>
  );
}

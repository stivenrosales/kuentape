"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  X, ArrowUpCircle, ArrowDownCircle, Calendar, Tag, Hash,
  ZoomIn, PencilIcon, CheckIcon, UploadIcon, Loader2Icon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { formatCurrency, formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import { CATEGORIAS_CAJA_CHICA } from "../schemas";
import { updateCajaChicaAction } from "../actions";
import type { CajaChicaRow } from "./caja-chica-table";

const TIPO_CONFIG = {
  INGRESO: {
    label: "Ingreso",
    badgeClass: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 border-transparent",
    amountClass: "text-emerald-700 dark:text-emerald-400",
    prefix: "+",
    Icon: ArrowUpCircle,
    iconClass: "text-emerald-600 dark:text-emerald-400",
  },
  GASTO: {
    label: "Gasto",
    badgeClass: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 border-transparent",
    amountClass: "text-red-700 dark:text-red-400",
    prefix: "-",
    Icon: ArrowDownCircle,
    iconClass: "text-red-600 dark:text-red-400",
  },
} as const;

interface Props {
  row: CajaChicaRow;
  canEdit?: boolean;
  onClose: () => void;
  onEdit?: () => void;
}

export function CajaChicaDetailDialog({ row, canEdit, onClose }: Props) {
  const router = useRouter();
  const config = TIPO_CONFIG[row.tipo];
  const { Icon } = config;

  const [imageExpanded, setImageExpanded] = React.useState(false);
  const [editing, setEditing] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [uploading, setUploading] = React.useState(false);
  const didChangeRef = React.useRef(false);

  // Editable fields
  const [concepto, setConcepto] = React.useState(row.concepto);
  const [categoriaGasto, setCategoriaGasto] = React.useState(row.categoriaGasto ?? "");
  const [comprobanteUrl, setComprobanteUrl] = React.useState(row.comprobanteUrl);

  React.useEffect(() => {
    function handleEsc(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.stopImmediatePropagation();
        if (imageExpanded) setImageExpanded(false);
        else if (editing) setEditing(false);
        else handleClose();
      }
    }
    document.addEventListener("keydown", handleEsc, true);
    return () => document.removeEventListener("keydown", handleEsc, true);
  }, [imageExpanded, editing]);

  function handleClose() {
    if (didChangeRef.current) router.refresh();
    onClose();
  }

  async function handleSave() {
    setSaving(true);
    const result = await updateCajaChicaAction(row.id, {
      tipo: row.tipo,
      monto: row.monto,
      fecha: row.fecha,
      concepto,
      categoriaGasto: row.tipo === "GASTO" ? (categoriaGasto || null) : null,
      comprobanteUrl,
    });
    setSaving(false);

    if (result.error) {
      toast.error("Error al guardar");
      return;
    }

    toast.success("Movimiento actualizado");
    didChangeRef.current = true;
    setEditing(false);
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "caja-chica");

      const res = await fetch("/api/upload", { method: "POST", body: formData });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Error al subir archivo");
        return;
      }

      const { url } = await res.json();
      setComprobanteUrl(url);
      toast.success("Comprobante subido");
    } catch {
      toast.error("Error al subir archivo");
    } finally {
      setUploading(false);
    }
  }

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={handleClose}>
        <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />
        <div
          className="relative w-full max-w-sm bg-card rounded-lg shadow-2xl overflow-hidden animate-in zoom-in-95 fade-in duration-150 flex flex-col max-h-[85vh]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-start justify-between px-5 pt-4 pb-3 border-b border-border shrink-0">
            <div className="flex items-center gap-2.5 min-w-0">
              <Icon className={cn("h-5 w-5 shrink-0", config.iconClass)} />
              <div className="min-w-0">
                {editing ? (
                  <input
                    className="text-sm font-bold bg-transparent border-b border-primary/40 outline-none w-full"
                    value={concepto}
                    onChange={(e) => setConcepto(e.target.value)}
                    autoFocus
                  />
                ) : (
                  <h2 className="text-sm font-bold truncate">{concepto}</h2>
                )}
                <Badge className={cn("mt-0.5 text-[10px]", config.badgeClass)}>{config.label}</Badge>
              </div>
            </div>
            <div className="flex items-center gap-1 ml-3 shrink-0">
              {canEdit && !editing && (
                <button onClick={() => setEditing(true)} className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted" aria-label="Editar">
                  <PencilIcon className="h-4 w-4" />
                </button>
              )}
              {editing && (
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="p-1 rounded text-primary hover:bg-primary/10"
                  aria-label="Guardar"
                >
                  {saving ? <Loader2Icon className="h-4 w-4 animate-spin" /> : <CheckIcon className="h-4 w-4" />}
                </button>
              )}
              <button onClick={handleClose} className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted">
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="overflow-y-auto flex-1 px-5 py-4 space-y-4">
            {/* Monto */}
            <div className="rounded-lg bg-muted/40 px-4 py-3 text-center">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">Monto</p>
              <p className={cn("font-mono text-2xl font-bold tabular-nums", config.amountClass)}>
                {config.prefix}{formatCurrency(row.monto)}
              </p>
            </div>

            {/* Detalles */}
            <div className="space-y-2">
              <DetailRow icon={<Calendar className="h-3.5 w-3.5" />} label="Fecha">
                {formatDate(row.fecha)}
              </DetailRow>

              {/* Categoría — editable inline */}
              {(row.tipo === "GASTO" || categoriaGasto) && (
                <DetailRow icon={<Tag className="h-3.5 w-3.5" />} label="Categoría">
                  {editing ? (
                    <select
                      className="bg-transparent border-b border-primary/40 outline-none text-xs w-full"
                      value={categoriaGasto}
                      onChange={(e) => setCategoriaGasto(e.target.value)}
                    >
                      <option value="">Sin categoría</option>
                      {CATEGORIAS_CAJA_CHICA.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  ) : (
                    <span>{categoriaGasto || "—"}</span>
                  )}
                </DetailRow>
              )}

              <DetailRow icon={<Hash className="h-3.5 w-3.5" />} label="Saldo después">
                <span className={cn("font-mono font-semibold", row.saldoAcumulado < 0 ? "text-red-700 dark:text-red-400" : "text-foreground")}>
                  {formatCurrency(row.saldoAcumulado)}
                </span>
              </DetailRow>
            </div>

            {/* Comprobante */}
            <div>
              <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground mb-2">Comprobante</p>
              {comprobanteUrl ? (
                <div className="relative rounded-lg border border-border overflow-hidden cursor-pointer group" onClick={() => !editing && setImageExpanded(true)}>
                  <img src={comprobanteUrl} alt="Comprobante" className="w-full h-40 object-contain bg-muted/20" />
                  {!editing && (
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                      <ZoomIn className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  )}
                  {editing && (
                    <label className="absolute inset-0 flex items-center justify-center bg-black/30 cursor-pointer hover:bg-black/40 transition-colors">
                      <span className="flex items-center gap-1.5 text-white text-xs font-medium">
                        <UploadIcon className="h-4 w-4" /> Cambiar
                      </span>
                      <input type="file" className="hidden" accept="image/*,application/pdf" onChange={handleUpload} />
                    </label>
                  )}
                </div>
              ) : editing ? (
                <label className="flex items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border py-6 cursor-pointer hover:border-primary/40 hover:bg-muted/20 transition-colors">
                  {uploading ? (
                    <Loader2Icon className="h-4 w-4 animate-spin text-muted-foreground" />
                  ) : (
                    <>
                      <UploadIcon className="h-4 w-4 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">Subir comprobante</span>
                    </>
                  )}
                  <input type="file" className="hidden" accept="image/*,application/pdf" onChange={handleUpload} disabled={uploading} />
                </label>
              ) : (
                <p className="text-xs text-muted-foreground/50 text-center py-3">Sin comprobante adjunto</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Imagen expandida */}
      {imageExpanded && comprobanteUrl && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-8 bg-black/80" onClick={() => setImageExpanded(false)}>
          <button className="absolute top-4 right-4 p-2 rounded-full bg-white/20 text-white hover:bg-white/30 transition-colors">
            <X className="h-5 w-5" />
          </button>
          <img src={comprobanteUrl} alt="Comprobante" className="max-w-full max-h-full object-contain rounded-lg" onClick={(e) => e.stopPropagation()} />
        </div>
      )}
    </>
  );
}

function DetailRow({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2 text-xs min-h-[1.5rem]">
      <span className="text-muted-foreground shrink-0 mt-0.5">{icon}</span>
      <span className="text-muted-foreground w-24 shrink-0">{label}:</span>
      <span className="flex-1 min-w-0 text-foreground">{children}</span>
    </div>
  );
}

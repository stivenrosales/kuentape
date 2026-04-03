"use client";

import * as React from "react";
import { ImageIcon, SearchIcon } from "lucide-react";

import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency, formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";

interface ComprobanteItem {
  id: string;
  comprobanteUrl: string;
  monto: number;
  fecha: Date;
  concepto: string;
  tipo: "INGRESO" | "EGRESO";
  cuenta: { id: string; nombre: string };
}

interface CuentaBancaria {
  id: string;
  nombre: string;
}

interface ComprobanteGalleryProps {
  items: ComprobanteItem[];
  cuentas: CuentaBancaria[];
}

export function ComprobanteGallery({ items, cuentas }: ComprobanteGalleryProps) {
  const [search, setSearch] = React.useState("");
  const [cuentaId, setCuentaId] = React.useState<string>("all");
  const [lightboxUrl, setLightboxUrl] = React.useState<string | null>(null);
  const [lightboxItem, setLightboxItem] = React.useState<ComprobanteItem | null>(null);
  const [imagesLoaded, setImagesLoaded] = React.useState<Set<string>>(new Set());

  const filtered = React.useMemo(() => {
    return items.filter((item) => {
      if (cuentaId !== "all" && item.cuenta.id !== cuentaId) return false;
      if (search && !item.concepto.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [items, cuentaId, search]);

  function handleImageLoad(id: string) {
    setImagesLoaded((prev) => new Set(prev).add(id));
  }

  function openLightbox(item: ComprobanteItem) {
    setLightboxUrl(item.comprobanteUrl);
    setLightboxItem(item);
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Filtros */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <SearchIcon className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por concepto..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
          />
        </div>
        <Select value={cuentaId} onValueChange={(v) => setCuentaId(v ?? "all")}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Todas las cuentas" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las cuentas</SelectItem>
            {cuentas.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.nombre}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-[1.25rem] bg-muted/30 py-16 text-center">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
            <ImageIcon className="size-7" />
          </div>
          <p className="text-sm text-muted-foreground">No hay comprobantes que coincidan con los filtros</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {filtered.map((item) => (
            <button
              key={item.id}
              onClick={() => openLightbox(item)}
              className={cn(
                "group flex flex-col overflow-hidden rounded-xl border border-border/60 bg-card text-left transition-all",
                "hover:border-primary/40 hover:shadow-[0_4px_16px_-4px_rgba(0,0,0,0.12)]",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              )}
              aria-label={`Ver comprobante: ${item.concepto}`}
            >
              {/* Thumbnail */}
              <div className="relative aspect-square w-full overflow-hidden bg-muted">
                {!imagesLoaded.has(item.id) && (
                  <Skeleton className="absolute inset-0 rounded-none" />
                )}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.comprobanteUrl}
                  alt={item.concepto}
                  className={cn(
                    "size-full object-cover transition-transform duration-200 group-hover:scale-105",
                    imagesLoaded.has(item.id) ? "opacity-100" : "opacity-0"
                  )}
                  onLoad={() => handleImageLoad(item.id)}
                />
              </div>

              {/* Info */}
              <div className="flex flex-col gap-0.5 p-2">
                <span
                  className={cn(
                    "font-mono text-xs font-semibold",
                    item.tipo === "INGRESO"
                      ? "text-emerald-700 dark:text-emerald-400"
                      : "text-red-700 dark:text-red-400"
                  )}
                >
                  {item.tipo === "EGRESO" ? "-" : ""}
                  {formatCurrency(item.monto)}
                </span>
                <span className="truncate text-xs font-medium text-foreground">
                  {item.concepto}
                </span>
                <span className="font-mono text-xs text-muted-foreground">
                  {formatDate(item.fecha)}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Lightbox */}
      <Dialog
        open={!!lightboxUrl}
        onOpenChange={(open) => {
          if (!open) {
            setLightboxUrl(null);
            setLightboxItem(null);
          }
        }}
      >
        <DialogContent className="max-w-3xl">
          {lightboxItem && (
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <p className="font-semibold text-foreground">{lightboxItem.concepto}</p>
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <span
                    className={cn(
                      "font-mono font-semibold",
                      lightboxItem.tipo === "INGRESO"
                        ? "text-emerald-700 dark:text-emerald-400"
                        : "text-red-700 dark:text-red-400"
                    )}
                  >
                    {lightboxItem.tipo === "EGRESO" ? "-" : ""}
                    {formatCurrency(lightboxItem.monto)}
                  </span>
                  <span>·</span>
                  <span className="font-mono">{formatDate(lightboxItem.fecha)}</span>
                  <span>·</span>
                  <span>{lightboxItem.cuenta.nombre}</span>
                </div>
              </div>

              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={lightboxUrl!}
                alt={lightboxItem.concepto}
                className="max-h-[70vh] w-full rounded-xl object-contain"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

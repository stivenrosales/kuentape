"use client";

import * as React from "react";
import { X, Loader2Icon } from "lucide-react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { getClienteDetailAction } from "../actions";
import { ClienteDetailClient } from "./cliente-detail-client";

const TIPO_LABEL: Record<string, string> = {
  JURIDICA: "Jurídica",
  NATURAL: "Natural",
  IMMUNOTEC: "Immunotec",
  FOUR_LIFE: "4Life",
  RXH: "RxH",
};

const ESTADO_STYLE: Record<string, string> = {
  ACTIVO: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 border-transparent",
  INACTIVO: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 border-transparent",
  ARCHIVADO: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 border-transparent",
};

interface ClienteDetailDialogProps {
  clienteId: string;
  onClose: () => void;
}

export function ClienteDetailDialog({ clienteId, onClose }: ClienteDetailDialogProps) {
  const router = useRouter();
  const [data, setData] = React.useState<Awaited<ReturnType<typeof getClienteDetailAction>> | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    setLoading(true);
    getClienteDetailAction(clienteId)
      .then(setData)
      .finally(() => setLoading(false));
  }, [clienteId]);

  React.useEffect(() => {
    function handleEsc(e: KeyboardEvent) { if (e.key === "Escape") { e.stopImmediatePropagation(); handleClose(); } }
    document.addEventListener("keydown", handleEsc, true);
    return () => document.removeEventListener("keydown", handleEsc, true);
  }, []);

  function handleClose() {
    router.refresh();
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={handleClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />
      <div
        className="relative w-full max-w-2xl bg-card rounded-lg shadow-2xl overflow-hidden animate-in zoom-in-95 fade-in duration-150 flex flex-col max-h-[85vh] my-4"
        onClick={(e) => e.stopPropagation()}
      >
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2Icon className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : !data ? (
          <div className="flex items-center justify-center py-24">
            <p className="text-sm text-muted-foreground">Cliente no encontrado</p>
          </div>
        ) : (
          <>
            {/* Header — nombre + X, como prospectos */}
            <div className="flex items-start justify-between px-5 pt-4 pb-3 border-b border-border flex-shrink-0">
              <div className="space-y-1 min-w-0">
                <h2 className="text-base font-bold text-foreground">{data.persona.razonSocial}</h2>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <Badge className="text-[10px] bg-primary/10 text-primary border-transparent">
                    {TIPO_LABEL[data.persona.tipoPersona] ?? data.persona.tipoPersona}
                  </Badge>
                  <Badge className={`text-[10px] ${ESTADO_STYLE[data.persona.estado]}`}>
                    {data.persona.estado}
                  </Badge>
                </div>
              </div>
              <button onClick={handleClose} className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted shrink-0 ml-3">
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Body — scroll */}
            <div className="overflow-y-auto flex-1">
              <div className="px-5 py-4">
                <ClienteDetailClient
                  persona={data.persona}
                  servicios={data.servicios}
                  incidencias={data.incidencias}
                  libros={data.libros}
                  canManage={data.canManage}
                  hideHeader
                  showIdentityRows
                />
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

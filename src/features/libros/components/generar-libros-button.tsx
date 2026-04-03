"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { BookOpen } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";

const MESES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];

export function GenerarLibrosButton() {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [mes, setMes] = React.useState(String(new Date().getMonth() + 1));
  const [anio, setAnio] = React.useState(String(new Date().getFullYear()));
  const [loading, setLoading] = React.useState(false);

  async function handleGenerar() {
    setLoading(true);
    try {
      const res = await fetch(`/api/cron/generar-libros?mes=${mes}&anio=${anio}`, {
        method: "POST",
      });
      const data = await res.json();
      if (res.ok) {
        if (data.created > 0) {
          toast.success(`${data.created} libros generados para ${MESES[parseInt(mes) - 1]} ${anio}`);
        } else {
          toast.info(data.message || "No se crearon libros nuevos");
        }
        setOpen(false);
        router.refresh();
      } else {
        toast.error(data.error || "Error al generar");
      }
    } catch {
      toast.error("Error al generar libros");
    }
    setLoading(false);
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors"
      >
        <BookOpen className="h-4 w-4" />
        Generar Libros
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Select value={mes} onValueChange={setMes}>
        <SelectTrigger className="h-8 w-[120px] text-xs">{MESES[parseInt(mes) - 1]}</SelectTrigger>
        <SelectContent>
          {MESES.map((m, i) => <SelectItem key={i} value={String(i + 1)}>{m}</SelectItem>)}
        </SelectContent>
      </Select>
      <Select value={anio} onValueChange={setAnio}>
        <SelectTrigger className="h-8 w-[80px] text-xs">{anio}</SelectTrigger>
        <SelectContent>
          {["2025", "2026", "2027"].map((y) => <SelectItem key={y} value={y}>{y}</SelectItem>)}
        </SelectContent>
      </Select>
      <button
        onClick={handleGenerar}
        disabled={loading}
        className="rounded-lg bg-primary px-4 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
      >
        {loading ? "Generando..." : "Generar"}
      </button>
      <button
        onClick={() => setOpen(false)}
        className="text-xs text-muted-foreground hover:text-foreground px-2 py-1"
      >
        Cancelar
      </button>
    </div>
  );
}

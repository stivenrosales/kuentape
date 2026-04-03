"use client";

import * as React from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";

interface StaffOption {
  id: string;
  nombre: string;
  apellido: string;
}

interface IncidenciaFiltersProps {
  contadores?: StaffOption[];
  isAdmin?: boolean;
}

const EMPTY = "__all__";

const MESES = [
  { value: "01", label: "Enero" },
  { value: "02", label: "Febrero" },
  { value: "03", label: "Marzo" },
  { value: "04", label: "Abril" },
  { value: "05", label: "Mayo" },
  { value: "06", label: "Junio" },
  { value: "07", label: "Julio" },
  { value: "08", label: "Agosto" },
  { value: "09", label: "Septiembre" },
  { value: "10", label: "Octubre" },
  { value: "11", label: "Noviembre" },
  { value: "12", label: "Diciembre" },
];

const PRIORIDAD_OPTIONS = [
  { value: EMPTY, label: "Prioridad" },
  { value: "ALTA", label: "Alta" },
  { value: "MEDIA", label: "Media" },
  { value: "BAJA", label: "Baja" },
];

const ESTADO_OPTIONS = [
  { value: EMPTY, label: "Estado" },
  { value: "ABIERTA", label: "Abierta" },
  { value: "EN_PROGRESO", label: "En Progreso" },
  { value: "RESUELTA", label: "Resuelta" },
  { value: "CERRADA", label: "Cerrada" },
];

export function IncidenciaFilters({
  contadores = [],
  isAdmin = false,
}: IncidenciaFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();

  const [searchInput, setSearchInput] = React.useState(sp.get("search") ?? "");
  const searchTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const prioridad = sp.get("prioridad") ?? EMPTY;
  const estado = sp.get("estado") ?? EMPTY;
  const contadorId = sp.get("contadorId") ?? EMPTY;

  // Periodo
  const periodoRaw = sp.get("periodo") ?? "";
  const periodoParts = periodoRaw ? periodoRaw.split("-") : ["", ""];
  const anio = periodoParts[0] ?? "";
  const mesVal = periodoParts[1] ?? "";

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

  function updateParam(key: string, value: string | null) {
    const params = new URLSearchParams(sp.toString());
    params.delete("page");
    if (value && value !== EMPTY) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`${pathname}?${params.toString()}`);
  }

  function handleSearch(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    setSearchInput(val);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      updateParam("search", val || null);
    }, 350);
  }

  function handlePeriodoChange(newAnio: string | null, newMes: string | null) {
    const a = !newAnio || newAnio === EMPTY ? "" : newAnio;
    const m = !newMes || newMes === EMPTY ? "" : newMes;
    const periodo = a && m ? `${a}-${m}` : null;
    updateParam("periodo", periodo);
  }

  const prioridadLabel =
    PRIORIDAD_OPTIONS.find((o) => o.value === prioridad)?.label ?? "Prioridad";
  const estadoLabel =
    ESTADO_OPTIONS.find((o) => o.value === estado)?.label ?? "Estado";
  const contadorLabel =
    contadorId !== EMPTY
      ? (() => {
          const c = contadores.find((c) => c.id === contadorId);
          return c ? `${c.nombre} ${c.apellido}` : "Contador";
        })()
      : "Todos los contadores";
  const mesLabel =
    MESES.find((m) => m.value === mesVal)?.label ?? "Mes";
  const anioLabel = anio || "Año";

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Búsqueda */}
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/60 pointer-events-none" />
        <input
          type="text"
          value={searchInput}
          onChange={handleSearch}
          placeholder="Buscar incidencia..."
          className="h-8 w-[220px] rounded-md border border-input bg-background pl-8 pr-3 text-sm outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground"
        />
      </div>

      {/* Prioridad */}
      <Select value={prioridad} onValueChange={(v) => updateParam("prioridad", v)}>
        <SelectTrigger className="w-[110px]">{prioridadLabel}</SelectTrigger>
        <SelectContent>
          {PRIORIDAD_OPTIONS.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Estado */}
      <Select value={estado} onValueChange={(v) => updateParam("estado", v)}>
        <SelectTrigger className="w-[120px]">{estadoLabel}</SelectTrigger>
        <SelectContent>
          {ESTADO_OPTIONS.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Año */}
      <Select
        value={anio || EMPTY}
        onValueChange={(v) => handlePeriodoChange(v, mesVal || EMPTY)}
      >
        <SelectTrigger className="w-[80px]">{anioLabel}</SelectTrigger>
        <SelectContent>
          <SelectItem value={EMPTY}>Año</SelectItem>
          {years.map((y) => (
            <SelectItem key={y} value={String(y)}>
              {y}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Mes */}
      <Select
        value={mesVal || EMPTY}
        onValueChange={(v) => handlePeriodoChange(anio || EMPTY, v)}
      >
        <SelectTrigger className="w-[110px]">{mesLabel}</SelectTrigger>
        <SelectContent>
          <SelectItem value={EMPTY}>Mes</SelectItem>
          {MESES.map((m) => (
            <SelectItem key={m.value} value={m.value}>
              {m.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Contador (solo admin) */}
      {isAdmin && contadores.length > 0 && (
        <Select value={contadorId} onValueChange={(v) => updateParam("contadorId", v)}>
          <SelectTrigger className="w-[170px]">{contadorLabel}</SelectTrigger>
          <SelectContent>
            <SelectItem value={EMPTY}>Todos los contadores</SelectItem>
            {contadores.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.nombre} {c.apellido}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </div>
  );
}

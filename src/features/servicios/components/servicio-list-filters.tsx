"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MESES_ESPANOL } from "@/lib/constants";

interface TipoServicioOption {
  id: string;
  nombre: string;
}

interface ContadorOption {
  id: string;
  nombre: string;
  apellido: string;
}

interface ServicioListFiltersProps {
  tiposServicio: TipoServicioOption[];
  contadores?: ContadorOption[];
  isAdmin: boolean;
  periodoDefault: string;
}

const ANIOS = ["2024", "2025", "2026", "2027"];
const EMPTY = "__all__";

export function ServicioListFilters({
  tiposServicio,
  contadores,
  isAdmin,
  periodoDefault,
}: ServicioListFiltersProps) {
  const router = useRouter();
  const sp = useSearchParams();

  const periodoActual = sp.get("periodo") ?? periodoDefault;
  const parts = periodoActual.split("-");
  const anio = parts[0] ?? "2026";
  const mes = parts[1] ?? "03";
  const mesIndex = parseInt(mes, 10) - 1; // 0-based for array

  const tipoServicioId = sp.get("tipoServicioId") ?? "";
  const contadorId = sp.get("contadorId") ?? "";
  const search = sp.get("search") ?? "";

  const [searchInput, setSearchInput] = React.useState(search);
  const searchTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  function updateParam(key: string, value: string | null) {
    const params = new URLSearchParams(sp.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`?${params.toString()}`);
  }

  function handleMesChange(newMes: string) {
    updateParam("periodo", `${anio}-${newMes}`);
  }

  function handleAnioChange(newAnio: string) {
    updateParam("periodo", `${newAnio}-${mes}`);
  }

  function handleSearchChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    setSearchInput(val);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      updateParam("search", val || null);
    }, 350);
  }

  // Mes options: "01" -> "Enero", etc.
  const monthOptions = MESES_ESPANOL.map((nombre, i) => ({
    value: String(i + 1).padStart(2, "0"),
    label: nombre,
  }));

  // Find current labels for display
  const currentMesLabel = MESES_ESPANOL[mesIndex] ?? "Mes";
  const currentTipoLabel = tipoServicioId
    ? tiposServicio.find((t) => t.id === tipoServicioId)?.nombre ?? "Tipo"
    : "Todos los tipos";
  const currentContadorLabel = contadorId
    ? (() => {
        const c = contadores?.find((c) => c.id === contadorId);
        return c ? `${c.nombre} ${c.apellido}` : "Contador";
      })()
    : "Todos los contadores";

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Mes */}
      <Select defaultValue={mes} value={mes} onValueChange={handleMesChange}>
        <SelectTrigger className="w-[140px]">
          {currentMesLabel}
        </SelectTrigger>
        <SelectContent>
          {monthOptions.map((m) => (
            <SelectItem key={m.value} value={m.value}>
              {m.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Año */}
      <Select defaultValue={anio} value={anio} onValueChange={handleAnioChange}>
        <SelectTrigger className="w-[90px]">
          {anio}
        </SelectTrigger>
        <SelectContent>
          {ANIOS.map((y) => (
            <SelectItem key={y} value={y}>
              {y}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Tipo de servicio */}
      <Select
        defaultValue={tipoServicioId || EMPTY}
        value={tipoServicioId || EMPTY}
        onValueChange={(v) => updateParam("tipoServicioId", v === EMPTY ? null : v)}
      >
        <SelectTrigger className="w-[180px]">
          {currentTipoLabel}
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={EMPTY}>Todos los tipos</SelectItem>
          {tiposServicio.map((t) => (
            <SelectItem key={t.id} value={t.id}>
              {t.nombre}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Contador (solo admin) */}
      {isAdmin && contadores && contadores.length > 0 && (
        <Select
          defaultValue={contadorId || EMPTY}
          value={contadorId || EMPTY}
          onValueChange={(v) => updateParam("contadorId", v === EMPTY ? null : v)}
        >
          <SelectTrigger className="w-[180px]">
            {currentContadorLabel}
          </SelectTrigger>
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

      {/* Búsqueda */}
      <div className="relative ml-auto">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/60 pointer-events-none" />
        <input
          type="text"
          value={searchInput}
          onChange={handleSearchChange}
          placeholder="Buscar empresa..."
          className="h-9 w-[200px] rounded-md border border-input bg-background pl-8 pr-3 text-sm outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground"
        />
      </div>
    </div>
  );
}

"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, DownloadIcon } from "lucide-react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { MultiSelect } from "@/components/ui/multi-select";
import { Button } from "@/components/ui/button";
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
  onPdfClick?: () => void;
}

const ANIOS = ["2024", "2025", "2026", "2027"];

export function ServicioListFilters({
  tiposServicio,
  contadores,
  isAdmin,
  periodoDefault,
  onPdfClick,
}: ServicioListFiltersProps) {
  const router = useRouter();
  const sp = useSearchParams();

  const periodoRaw = sp.get("periodo") ?? periodoDefault;
  // Support multiple periodos
  const periodos = periodoRaw.split(",").filter(Boolean);
  const firstPeriodo = periodos[0] ?? periodoDefault;
  const parts = firstPeriodo.split("-");
  const anio = parts[0] ?? "2026";

  // Selected meses (can be multiple)
  const selectedMeses = periodos.map((p) => p.split("-")[1] ?? "03");

  // Si no hay filtro en URL = todos seleccionados visualmente
  const tipoServicioRaw = (sp.get("tipoServicioId") ?? "").split(",").filter(Boolean);
  const tipoServicioIds = tipoServicioRaw.length > 0 ? tipoServicioRaw : tiposServicio.map((t) => t.id);

  const contadorRaw = (sp.get("contadorId") ?? "").split(",").filter(Boolean);
  const contadorIds = contadorRaw.length > 0 ? contadorRaw : (contadores ?? []).map((c) => c.id);
  const search = sp.get("search") ?? "";

  const [searchInput, setSearchInput] = React.useState(search);
  const searchTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  function updateParam(key: string, value: string | null) {
    const params = new URLSearchParams(sp.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    router.push(`?${params.toString()}`);
  }

  function handleMesesChange(meses: string[]) {
    // Si no selecciona nada, volver al mes default
    if (meses.length === 0) {
      const defaultMes = periodoDefault.split("-")[1] ?? "03";
      updateParam("periodo", `${anio}-${defaultMes}`);
      return;
    }
    const periodoStr = meses.map((m) => `${anio}-${m}`).join(",");
    updateParam("periodo", periodoStr);
  }

  function handleAnioChange(newAnio: string) {
    const periodoStr = selectedMeses.map((m) => `${newAnio}-${m}`).join(",");
    updateParam("periodo", periodoStr);
  }

  function handleTiposChange(ids: string[]) {
    // Si todos seleccionados o ninguno → limpiar filtro (= todos)
    const allSelected = ids.length === tiposServicio.length || ids.length === 0;
    updateParam("tipoServicioId", allSelected ? null : ids.join(","));
  }

  function handleContadoresChange(ids: string[]) {
    const allSelected = ids.length === (contadores ?? []).length || ids.length === 0;
    updateParam("contadorId", allSelected ? null : ids.join(","));
  }

  function handleSearchChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    setSearchInput(val);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      updateParam("search", val || null);
    }, 350);
  }

  const monthOptions = MESES_ESPANOL.map((nombre, i) => ({
    value: String(i + 1).padStart(2, "0"),
    label: nombre,
  }));

  const tipoOptions = tiposServicio.map((t) => ({
    value: t.id,
    label: t.nombre,
  }));

  const contadorOptions = (contadores ?? []).map((c) => ({
    value: c.id,
    label: `${c.nombre} ${c.apellido}`,
  }));

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Mes (multi-select) */}
      <MultiSelect
        options={monthOptions}
        selected={selectedMeses}
        onChange={handleMesesChange}
        placeholder="Mes"
        className="w-[150px]"
      />

      {/* Año (single) */}
      <Select value={anio} onValueChange={(v) => v && handleAnioChange(v)}>
        <SelectTrigger className="w-[90px] bg-card text-xs h-9">{anio}</SelectTrigger>
        <SelectContent>
          {ANIOS.map((y) => (
            <SelectItem key={y} value={y}>{y}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Tipo de servicio (multi-select) */}
      <MultiSelect
        options={tipoOptions}
        selected={tipoServicioIds}
        onChange={handleTiposChange}
        placeholder="Tipo servicio"
        className="w-[170px]"
      />

      {/* Contador (multi-select, solo admin) */}
      {isAdmin && contadorOptions.length > 0 && (
        <MultiSelect
          options={contadorOptions}
          selected={contadorIds}
          onChange={handleContadoresChange}
          placeholder="Contador"
          className="w-[170px]"
        />
      )}

      {/* Búsqueda */}
      <div className="relative ml-auto">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/60 pointer-events-none" />
        <input
          type="text"
          value={searchInput}
          onChange={handleSearchChange}
          placeholder="Buscar empresa..."
          className="h-9 w-[180px] rounded-lg border border-input bg-card pl-8 pr-3 text-xs outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground"
        />
      </div>

      {/* PDF button (solo admin) */}
      {isAdmin && onPdfClick && (
        <Button onClick={onPdfClick} size="sm" variant="outline">
          <DownloadIcon className="mr-1.5 size-3.5" />
          PDF
        </Button>
      )}
    </div>
  );
}

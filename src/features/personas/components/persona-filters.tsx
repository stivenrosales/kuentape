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

interface PersonaFiltersProps {
  isAdmin?: boolean;
  contadores?: StaffOption[];
}

const EMPTY = "__all__";

const TIPO_OPTIONS = [
  { value: EMPTY, label: "Todos los tipos" },
  { value: "JURIDICA", label: "Jurídica" },
  { value: "NATURAL", label: "Natural" },
  { value: "IMMUNOTEC", label: "Immunotec" },
  { value: "FOUR_LIFE", label: "4Life" },
  { value: "RXH", label: "RXH" },
];

const REGIMEN_OPTIONS = [
  { value: EMPTY, label: "Todos" },
  { value: "MYPE", label: "MYPE" },
  { value: "RER", label: "RER" },
  { value: "REG", label: "General" },
];

const ESTADO_OPTIONS = [
  { value: EMPTY, label: "Todos" },
  { value: "ACTIVO", label: "Activo" },
  { value: "INACTIVO", label: "Inactivo" },
  { value: "ARCHIVADO", label: "Archivado" },
];

export function PersonaFilters({ isAdmin = false, contadores = [] }: PersonaFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();

  const [searchInput, setSearchInput] = React.useState(sp.get("search") ?? "");
  const searchTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const tipoPersona = sp.get("tipoPersona") ?? EMPTY;
  const regimen = sp.get("regimen") ?? EMPTY;
  const estado = sp.get("estado") ?? "ACTIVO";
  const contadorId = sp.get("contadorAsignadoId") ?? EMPTY;

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

  const tipoLabel = TIPO_OPTIONS.find((o) => o.value === tipoPersona)?.label ?? "Tipo";
  const regimenLabel = REGIMEN_OPTIONS.find((o) => o.value === regimen)?.label ?? "Régimen";
  const estadoLabel = ESTADO_OPTIONS.find((o) => o.value === estado)?.label ?? "Estado";
  const contadorLabel = contadorId !== EMPTY
    ? (() => { const c = contadores.find((c) => c.id === contadorId); return c ? `${c.nombre} ${c.apellido}` : "Contador"; })()
    : "Todos los contadores";

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Búsqueda */}
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/60 pointer-events-none" />
        <input
          type="text"
          value={searchInput}
          onChange={handleSearch}
          placeholder="Buscar empresa o RUC..."
          className="h-8 w-[220px] rounded-md border border-input bg-background pl-8 pr-3 text-sm outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground"
        />
      </div>

      {/* Tipo */}
      <Select value={tipoPersona} onValueChange={(v) => updateParam("tipoPersona", v)}>
        <SelectTrigger className="w-[140px]">{tipoLabel}</SelectTrigger>
        <SelectContent>
          {TIPO_OPTIONS.map((o) => (
            <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Régimen */}
      <Select value={regimen} onValueChange={(v) => updateParam("regimen", v)}>
        <SelectTrigger className="w-[100px]">{regimenLabel}</SelectTrigger>
        <SelectContent>
          {REGIMEN_OPTIONS.map((o) => (
            <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Estado */}
      <Select value={estado} onValueChange={(v) => updateParam("estado", v)}>
        <SelectTrigger className="w-[100px]">{estadoLabel}</SelectTrigger>
        <SelectContent>
          {ESTADO_OPTIONS.map((o) => (
            <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Contador (admin) */}
      {isAdmin && contadores.length > 0 && (
        <Select value={contadorId} onValueChange={(v) => updateParam("contadorAsignadoId", v)}>
          <SelectTrigger className="w-[200px]">{contadorLabel}</SelectTrigger>
          <SelectContent>
            <SelectItem value={EMPTY}>Todos los contadores</SelectItem>
            {contadores.map((c) => (
              <SelectItem key={c.id} value={c.id}>{c.nombre} {c.apellido}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </div>
  );
}

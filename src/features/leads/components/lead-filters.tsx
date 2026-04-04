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

interface LeadFiltersProps {
  staff: StaffOption[];
  isAdmin: boolean;
}

const EMPTY = "__all__";

const ESTADO_OPTIONS = [
  { value: EMPTY, label: "Todos los estados" },
  { value: "NUEVO", label: "Nuevo" },
  { value: "CONTACTADO", label: "Contactado" },
  { value: "COTIZADO", label: "Cotizado" },
  { value: "CONVERTIDO", label: "Convertido" },
  { value: "PERDIDO", label: "Perdido" },
];

const REGIMEN_OPTIONS = [
  { value: EMPTY, label: "Todos" },
  { value: "MYPE", label: "MYPE" },
  { value: "RER", label: "RER" },
  { value: "REG", label: "General" },
];

export function LeadFilters({ staff, isAdmin }: LeadFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();

  const [searchInput, setSearchInput] = React.useState(sp.get("search") ?? "");
  const searchTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const estado = sp.get("estado") ?? EMPTY;
  const regimen = sp.get("regimen") ?? EMPTY;
  const asignadoAId = sp.get("asignadoAId") ?? EMPTY;

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

  const estadoLabel = ESTADO_OPTIONS.find((o) => o.value === estado)?.label ?? "Estado";
  const regimenLabel = REGIMEN_OPTIONS.find((o) => o.value === regimen)?.label ?? "Régimen";
  const asignadoLabel = asignadoAId !== EMPTY
    ? (() => { const s = staff.find((s) => s.id === asignadoAId); return s ? `${s.nombre} ${s.apellido}` : "Asignado"; })()
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
          placeholder="Buscar nombre, celular..."
          className="h-9 w-[220px] rounded-lg border border-input bg-card pl-8 pr-3 text-xs outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground"
        />
      </div>

      {/* Estado */}
      <Select value={estado} onValueChange={(v) => v && updateParam("estado", v)}>
        <SelectTrigger className="w-[140px] bg-card text-xs h-9">{estadoLabel}</SelectTrigger>
        <SelectContent>
          {ESTADO_OPTIONS.map((o) => (
            <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Régimen */}
      <Select value={regimen} onValueChange={(v) => v && updateParam("regimen", v)}>
        <SelectTrigger className="w-[110px] bg-card text-xs h-9">{regimenLabel}</SelectTrigger>
        <SelectContent>
          {REGIMEN_OPTIONS.map((o) => (
            <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Asignado (admin) */}
      {isAdmin && (
        <Select value={asignadoAId} onValueChange={(v) => v && updateParam("asignadoAId", v)}>
          <SelectTrigger className="w-[200px] bg-card text-xs h-9">{asignadoLabel}</SelectTrigger>
          <SelectContent>
            <SelectItem value={EMPTY}>Todos los contadores</SelectItem>
            {staff.map((s) => (
              <SelectItem key={s.id} value={s.id}>{s.nombre} {s.apellido}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </div>
  );
}

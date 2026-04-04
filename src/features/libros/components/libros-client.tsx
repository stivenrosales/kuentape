"use client";

import * as React from "react";
import { useRouter, usePathname } from "next/navigation";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { LibrosTable } from "./libros-table";
import type { LibroRow } from "./libros-table";

const MESES_OPTIONS = [
  { value: "all", label: "Todos los meses" },
  { value: "1", label: "Enero" },
  { value: "2", label: "Febrero" },
  { value: "3", label: "Marzo" },
  { value: "4", label: "Abril" },
  { value: "5", label: "Mayo" },
  { value: "6", label: "Junio" },
  { value: "7", label: "Julio" },
  { value: "8", label: "Agosto" },
  { value: "9", label: "Septiembre" },
  { value: "10", label: "Octubre" },
  { value: "11", label: "Noviembre" },
  { value: "12", label: "Diciembre" },
];

const TIPOS_LIBRO = [
  "Libro Diario Formato Simplificado",
  "Libro Mayor",
  "Registro de Compras",
  "Registro de Ventas",
  "Libro de Inventarios y Balances",
  "Libro Caja y Bancos",
];

const CURRENT_YEAR = new Date().getFullYear();
const YEARS_OPTIONS = Array.from({ length: 6 }, (_, i) => CURRENT_YEAR - 2 + i);

const ESTADO_LABELS: Record<string, string> = {
  all: "Todos",
  true: "Completados",
  false: "Pendientes",
};

interface LibrosClientProps {
  data: LibroRow[];
  total: number;
  completados: number;
  pendientes: number;
  searchParams: {
    completado?: string;
    tipoLibro?: string;
    mes?: string;
    anio?: string;
    personaId?: string;
  };
}

export function LibrosClient({
  data,
  total,
  completados,
  pendientes,
  searchParams,
}: LibrosClientProps) {
  const router = useRouter();
  const pathname = usePathname();

  function updateParam(key: string, value: string | null) {
    const params = new URLSearchParams();
    Object.entries(searchParams).forEach(([k, v]) => {
      if (v && k !== key) params.set(k, v);
    });
    if (value && value !== "all") params.set(key, value);
    router.push(`${pathname}?${params.toString()}`);
  }

  const estadoVal = searchParams.completado ?? "all";
  const tipoVal = searchParams.tipoLibro ?? "all";
  const mesVal = searchParams.mes ?? "all";
  const anioVal = searchParams.anio ?? String(CURRENT_YEAR);

  return (
    <div className="space-y-4">
      {/* KPIs */}
      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-lg border border-border bg-card px-4 py-3 shadow-sm">
          <span className="text-xs text-muted-foreground">Total Libros</span>
          <p className="text-lg font-bold mt-0.5">{total}</p>
        </div>
        <div className="rounded-lg border border-border bg-card px-4 py-3 shadow-sm">
          <span className="text-xs text-muted-foreground">Completados</span>
          <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">{completados}</p>
        </div>
        <div className="rounded-lg border border-border bg-card px-4 py-3 shadow-sm">
          <span className="text-xs text-muted-foreground">Pendientes</span>
          <p className="text-lg font-bold text-destructive mt-0.5">{pendientes}</p>
        </div>
      </div>

      {/* Filtros — inline como servicios */}
      <div className="flex flex-wrap items-center gap-2">
        <Select value={estadoVal} onValueChange={(v) => v && updateParam("completado", v === "all" ? null : v)}>
          <SelectTrigger className="w-[140px] bg-card text-xs h-9">
            {ESTADO_LABELS[estadoVal] ?? "Todos"}
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="true">Completados</SelectItem>
            <SelectItem value="false">Pendientes</SelectItem>
          </SelectContent>
        </Select>

        <Select value={tipoVal} onValueChange={(v) => v && updateParam("tipoLibro", v === "all" ? null : v)}>
          <SelectTrigger className="w-[220px] bg-card text-xs h-9">
            {tipoVal === "all" ? "Todos los tipos" : tipoVal}
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los tipos</SelectItem>
            {TIPOS_LIBRO.map((t) => (
              <SelectItem key={t} value={t}>{t}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={mesVal} onValueChange={(v) => v && updateParam("mes", v === "all" ? null : v)}>
          <SelectTrigger className="w-[150px] bg-card text-xs h-9">
            {MESES_OPTIONS.find((m) => m.value === mesVal)?.label ?? "Todos los meses"}
          </SelectTrigger>
          <SelectContent>
            {MESES_OPTIONS.map((m) => (
              <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={anioVal} onValueChange={(v) => v && updateParam("anio", v)}>
          <SelectTrigger className="w-[90px] bg-card text-xs h-9">
            {anioVal}
          </SelectTrigger>
          <SelectContent>
            {YEARS_OPTIONS.map((y) => (
              <SelectItem key={y} value={String(y)}>{y}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Tabla */}
      <LibrosTable data={data} />
    </div>
  );
}

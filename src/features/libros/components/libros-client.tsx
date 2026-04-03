"use client";

import * as React from "react";
import { useRouter, usePathname } from "next/navigation";

import { KPICard } from "@/components/kpi-card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
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
    // Preserve existing params
    Object.entries(searchParams).forEach(([k, v]) => {
      if (v && k !== key) params.set(k, v);
    });
    if (value && value !== "all") params.set(key, value);
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-3">
        <KPICard label="Total Libros" value={String(total)} />
        <KPICard
          label="Completados"
          value={String(completados)}
          className="border-emerald-200 dark:border-emerald-800"
        />
        <KPICard
          label="Pendientes"
          value={String(pendientes)}
          className="border-amber-200 dark:border-amber-800"
        />
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-4 rounded-[1.25rem] bg-card p-4 shadow-sm ring-1 ring-foreground/10">
        <div className="flex flex-col gap-1">
          <Label className="text-xs text-muted-foreground">Estado</Label>
          <Select
            value={searchParams.completado ?? "all"}
            onValueChange={(v) =>
              updateParam(
                "completado",
                v === "all" ? null : v,
              )
            }
          >
            <SelectTrigger className="h-8 w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="true">Completados</SelectItem>
              <SelectItem value="false">Pendientes</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1">
          <Label className="text-xs text-muted-foreground">Tipo de Libro</Label>
          <Select
            value={searchParams.tipoLibro ?? "all"}
            onValueChange={(v) => updateParam("tipoLibro", v === "all" ? null : v)}
          >
            <SelectTrigger className="h-8 w-[240px]">
              <SelectValue placeholder="Todos los tipos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los tipos</SelectItem>
              {TIPOS_LIBRO.map((t) => (
                <SelectItem key={t} value={t}>
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1">
          <Label className="text-xs text-muted-foreground">Mes</Label>
          <Select
            value={searchParams.mes ?? "all"}
            onValueChange={(v) => updateParam("mes", v === "all" ? null : v)}
          >
            <SelectTrigger className="h-8 w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MESES_OPTIONS.map((m) => (
                <SelectItem key={m.value} value={m.value}>
                  {m.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1">
          <Label className="text-xs text-muted-foreground">Año</Label>
          <Select
            value={searchParams.anio ?? String(CURRENT_YEAR)}
            onValueChange={(v) => updateParam("anio", v)}
          >
            <SelectTrigger className="h-8 w-[100px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {YEARS_OPTIONS.map((y) => (
                <SelectItem key={y} value={String(y)}>
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Tabla */}
      <LibrosTable data={data} />
    </div>
  );
}

"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { ChartCard } from "@/components/chart-card";
import { BarChart } from "@/components/charts/bar-chart";
import { HorizontalBarChart } from "@/components/charts/horizontal-bar-chart";
import { formatCurrency } from "@/lib/format";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// ─── Types ────────────────────────────────────────────────────────────────────

interface CobranzaPorContador {
  contadorId: string;
  contador: string;
  honorarios: number;
  cobrado: number;
  deuda: number;
  porcentaje: number;
}

interface CobranzasDiariasData {
  data: Record<string, unknown>[];
  contadores: string[];
}

interface MontosPorCobrar {
  contador: string;
  porcentaje: number;
  monto: number;
}

interface DeudaMes {
  contador: string;
  deuda: number;
}

interface MontoRestante {
  contador: string;
  monto: number;
}

interface TipoServicioOption {
  id: string;
  nombre: string;
}

interface CobranzasClientProps {
  cobranzasPorContador: CobranzaPorContador[];
  cobranzasDiarias: CobranzasDiariasData;
  montosPorCobrar: MontosPorCobrar[];
  deudaMes: DeudaMes[];
  montoRestante: MontoRestante[];
  tiposServicio: TipoServicioOption[];
  anio: number;
  mes: number;
}

// ─── Colors ───────────────────────────────────────────────────────────────────

const CHART_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];

const MESES_LABELS = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Setiembre", "Octubre", "Noviembre", "Diciembre",
];

// ─── Period Selector ──────────────────────────────────────────────────────────

function PeriodSelector({ anio, mes }: { anio: number; mes: number }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function navigate(newAnio: number, newMes: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("anio", String(newAnio));
    params.set("mes", String(newMes));
    router.push(`?${params.toString()}`);
  }

  const currentYear = new Date().getFullYear();
  const years = [currentYear - 1, currentYear, currentYear + 1];

  return (
    <div className="flex items-center gap-2">
      <Select
        value={String(mes)}
        onValueChange={(v) => navigate(anio, Number(v))}
      >
        <SelectTrigger className="w-36">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {MESES_LABELS.map((label, i) => (
            <SelectItem key={i + 1} value={String(i + 1)}>
              {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={String(anio)}
        onValueChange={(v) => navigate(Number(v), mes)}
      >
        <SelectTrigger className="w-24">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {years.map((y) => (
            <SelectItem key={y} value={String(y)}>
              {y}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

// ─── Filters for Monto Restante ───────────────────────────────────────────────

const TIPOS_PERSONA = [
  { value: "JURIDICA", label: "Jurídica" },
  { value: "NATURAL", label: "Natural" },
  { value: "IMMUNOTEC", label: "Immunotec" },
  { value: "FOUR_LIFE", label: "Four Life" },
  { value: "RXH", label: "RXH" },
];

function MontoRestanteFilters({
  tiposServicio,
  anio,
  mes,
}: {
  tiposServicio: TipoServicioOption[];
  anio: number;
  mes: number;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const tipoServicioId = searchParams.get("tipoServicioId") ?? "";
  const tipoPersona = searchParams.get("tipoPersona") ?? "";
  const filterMes = searchParams.get("filterMes") ?? "";

  function update(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`?${params.toString()}`);
  }

  function clearAll() {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("tipoServicioId");
    params.delete("tipoPersona");
    params.delete("filterMes");
    router.push(`?${params.toString()}`);
  }

  const currentYear = new Date().getFullYear();
  const year = anio ?? currentYear;
  const monthOptions = Array.from({ length: 12 }, (_, i) => ({
    value: String(i + 1),
    label: MESES_LABELS[i],
  }));

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Select
        value={tipoServicioId}
        onValueChange={(v) => v && update("tipoServicioId", v === "_all" ? "" : v)}
      >
        <SelectTrigger className="w-44">
          <SelectValue placeholder="Tipo de Servicio" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="_all">Todos los servicios</SelectItem>
          {tiposServicio.map((t) => (
            <SelectItem key={t.id} value={t.id}>
              {t.nombre}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={tipoPersona}
        onValueChange={(v) => v && update("tipoPersona", v === "_all" ? "" : v)}
      >
        <SelectTrigger className="w-36">
          <SelectValue placeholder="Tipo de Persona" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="_all">Todos</SelectItem>
          {TIPOS_PERSONA.map((t) => (
            <SelectItem key={t.value} value={t.value}>
              {t.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={filterMes}
        onValueChange={(v) => v && update("filterMes", v === "_all" ? "" : v)}
      >
        <SelectTrigger className="w-36">
          <SelectValue placeholder="Mes" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="_all">Todos los meses</SelectItem>
          {monthOptions.map((m) => (
            <SelectItem key={m.value} value={m.value}>
              {m.label} {year}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {(tipoServicioId || tipoPersona || filterMes) && (
        <Button variant="ghost" size="sm" onClick={clearAll}>
          Limpiar filtros
        </Button>
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function CobranzasClient({
  cobranzasPorContador,
  cobranzasDiarias,
  montosPorCobrar,
  deudaMes,
  montoRestante,
  tiposServicio,
  anio,
  mes,
}: CobranzasClientProps) {
  // Bars for cobranzas diarias chart (one bar per contador)
  const diariaBars = cobranzasDiarias.contadores.map((c, i) => ({
    key: c,
    label: c,
    color: CHART_COLORS[i % CHART_COLORS.length],
  }));

  // Porcentaje cobro data
  const porcentajeData = montosPorCobrar.map((m) => ({
    contador: m.contador,
    porcentaje: m.porcentaje,
  }));

  // Monto cobrado data
  const montoCobradoData = montosPorCobrar.map((m) => ({
    contador: m.contador,
    monto: m.monto,
  }));

  // Deuda data for horizontal chart
  const deudaHData = deudaMes.map((d) => ({
    contador: d.contador,
    deuda: d.deuda,
  }));

  // Monto restante data for horizontal chart
  const montoRestanteHData = montoRestante.map((m) => ({
    contador: m.contador,
    monto: m.monto,
  }));

  return (
    <div className="space-y-8">
      {/* Period selector */}
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground">
          Período:{" "}
          <span className="font-medium text-foreground">
            {MESES_LABELS[mes - 1]} {anio}
          </span>
        </p>
        <PeriodSelector anio={anio} mes={mes} />
      </div>

      {/* ── Section 1: Cobranzas por día/contador ── */}
      <div className="space-y-2">
        <h2 className="text-lg font-semibold">Cobranzas por día / contador</h2>
        <ChartCard
          title="Cobros diarios"
          description={`Ingresos por día agrupados por contador — ${MESES_LABELS[mes - 1]} ${anio}`}
        >
          <BarChart
            data={cobranzasDiarias.data}
            xKey="dia"
            bars={diariaBars.length > 0 ? diariaBars : [{ key: "monto", label: "Monto", color: "var(--chart-1)" }]}
            height={280}
            formatValue={(v) => formatCurrency(v)}
          />
        </ChartCard>
      </div>

      {/* ── Section 2: Montos por cobrar este mes ── */}
      <div className="space-y-2">
        <h2 className="text-lg font-semibold">Montos por cobrar este mes</h2>
        <div className="grid gap-4 lg:grid-cols-2">
          <ChartCard
            title="Porcentaje de cobro por contador"
            description="% cobrado sobre el total de honorarios del período"
          >
            <BarChart
              data={porcentajeData}
              xKey="contador"
              bars={[{ key: "porcentaje", label: "% Cobrado", color: "var(--chart-2)" }]}
              height={260}
              formatValue={(v) => `${v}%`}
            />
          </ChartCard>

          <ChartCard
            title="Monto cobrado por contador"
            description="Total cobrado en el período"
          >
            <BarChart
              data={montoCobradoData}
              xKey="contador"
              bars={[{ key: "monto", label: "Cobrado", color: "var(--chart-1)" }]}
              height={260}
              formatValue={(v) => formatCurrency(v)}
            />
          </ChartCard>
        </div>

        <ChartCard
          title="Deuda del mes por contador"
          description="Monto restante (honorarios - cobrado) del período"
        >
          <HorizontalBarChart
            data={deudaHData}
            nameKey="contador"
            valueKey="deuda"
            formatValue={(v) => formatCurrency(v)}
            color="var(--chart-4)"
            height={Math.max(260, deudaHData.length * 44 + 24)}
          />
        </ChartCard>
      </div>

      {/* ── Section 3: Monto Restante por cobrar/contador ── */}
      <div className="space-y-2">
        <h2 className="text-lg font-semibold">
          Monto restante por cobrar / contador
        </h2>
        <ChartCard
          title="Deuda pendiente por contador"
          description="Filtrá por tipo de servicio, tipo de persona o mes"
          actions={
            <MontoRestanteFilters
              tiposServicio={tiposServicio}
              anio={anio}
              mes={mes}
            />
          }
        >
          <HorizontalBarChart
            data={montoRestanteHData}
            nameKey="contador"
            valueKey="monto"
            formatValue={(v) => formatCurrency(v)}
            color="var(--chart-5)"
            height={Math.max(260, montoRestanteHData.length * 44 + 24)}
          />
        </ChartCard>
      </div>
    </div>
  );
}

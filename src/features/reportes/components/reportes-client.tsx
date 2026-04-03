"use client";

import * as React from "react";
import {
  FileText,
  Download,
  Loader2,
  CheckSquare,
  Square,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const MESES = [
  { value: 1, label: "Enero" },
  { value: 2, label: "Febrero" },
  { value: 3, label: "Marzo" },
  { value: 4, label: "Abril" },
  { value: 5, label: "Mayo" },
  { value: 6, label: "Junio" },
  { value: 7, label: "Julio" },
  { value: 8, label: "Agosto" },
  { value: 9, label: "Septiembre" },
  { value: 10, label: "Octubre" },
  { value: 11, label: "Noviembre" },
  { value: 12, label: "Diciembre" },
];

const ANIO_ACTUAL = new Date().getFullYear();
const ANIOS = Array.from({ length: 5 }, (_, i) => ANIO_ACTUAL - i);

interface Contador {
  id: string;
  nombre: string;
  apellido: string;
}

interface ReportesClientProps {
  contadores: Contador[];
}

// ----- helpers -----

async function triggerDownload(res: Response, defaultFilename: string) {
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  const cd = res.headers.get("Content-Disposition") ?? "";
  const match = cd.match(/filename="([^"]+)"/);
  a.download = match?.[1]
    ? decodeURIComponent(match[1])
    : defaultFilename;
  a.click();
  URL.revokeObjectURL(url);
}

// ----- Chip selector -----

interface ChipSelectorProps {
  contadores: Contador[];
  selected: string[];
  onChange: (ids: string[]) => void;
}

function ChipSelector({ contadores, selected, onChange }: ChipSelectorProps) {
  const allSelected = selected.length === contadores.length;

  function toggle(id: string) {
    onChange(
      selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id]
    );
  }

  function toggleAll() {
    onChange(allSelected ? [] : contadores.map((c) => c.id));
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={toggleAll}
        className="flex w-fit items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        {allSelected ? (
          <CheckSquare className="h-4 w-4 text-primary" />
        ) : (
          <Square className="h-4 w-4" />
        )}
        Seleccionar todos
      </button>
      <div className="flex flex-wrap gap-2">
        {contadores.map((c) => {
          const isSelected = selected.includes(c.id);
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => toggle(c.id)}
              className={[
                "rounded-full border px-3 py-1 text-sm font-medium transition-colors",
                isSelected
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-background text-foreground hover:border-primary/60",
              ].join(" ")}
            >
              {c.nombre} {c.apellido}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ----- Section card -----

function SectionCard({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-6">
      <div className="mb-5 space-y-0.5">
        <h2 className="text-base font-semibold text-foreground">{title}</h2>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {children}
    </div>
  );
}

// ----- Select helper -----

function Select({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  options: { value: number; label: string }[];
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
        {label}
      </label>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full appearance-none rounded-md border border-border bg-background px-3 py-2 pr-8 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
        >
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
      </div>
    </div>
  );
}

// ----- Error/success banner -----

function StatusBanner({
  type,
  message,
}: {
  type: "error" | "success";
  message: string;
}) {
  return (
    <div
      className={[
        "mt-4 rounded-md px-4 py-3 text-sm",
        type === "error"
          ? "bg-destructive/10 text-destructive"
          : "bg-green-50 text-green-800",
      ].join(" ")}
    >
      {message}
    </div>
  );
}

// ----- Main component -----

export function ReportesClient({ contadores }: ReportesClientProps) {
  const mesSugerido = new Date().getMonth() === 0 ? 12 : new Date().getMonth();
  const anioSugerido =
    new Date().getMonth() === 0 ? ANIO_ACTUAL - 1 : ANIO_ACTUAL;

  // === Monthly report state ===
  const [selContadores, setSelContadores] = React.useState<string[]>([]);
  const [mesM, setMesM] = React.useState(mesSugerido);
  const [anioM, setAnioM] = React.useState(anioSugerido);
  const [loadingM, setLoadingM] = React.useState(false);
  const [errorM, setErrorM] = React.useState<string | null>(null);
  const [successM, setSuccessM] = React.useState<string | null>(null);

  // === Caja Chica state ===
  const [mesCaja, setMesCaja] = React.useState(mesSugerido);
  const [anioCaja, setAnioCaja] = React.useState(anioSugerido);
  const [loadingCaja, setLoadingCaja] = React.useState(false);
  const [errorCaja, setErrorCaja] = React.useState<string | null>(null);
  const [successCaja, setSuccessM_caja] = React.useState<string | null>(null);

  // --- Generate monthly report(s) ---
  async function handleGenerarMensual() {
    if (selContadores.length === 0) {
      setErrorM("Seleccioná al menos un contador.");
      return;
    }
    setErrorM(null);
    setSuccessM(null);
    setLoadingM(true);

    try {
      // Generate one PDF per contador, download sequentially
      for (const contadorId of selContadores) {
        const res = await fetch("/api/reportes/mensual", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ contadorIds: [contadorId], anio: anioM, mes: mesM }),
        });

        if (!res.ok) {
          const text = await res.text();
          throw new Error(text || `Error ${res.status}`);
        }

        const mesLabel = MESES.find((m) => m.value === mesM)?.label ?? String(mesM);
        await triggerDownload(
          res,
          `Reporte (${mesLabel} - ${anioM}).pdf`
        );
      }

      setSuccessM(
        `${selContadores.length === 1 ? "Reporte generado" : `${selContadores.length} reportes generados`} correctamente.`
      );
    } catch (e) {
      setErrorM(e instanceof Error ? e.message : "Error al generar el reporte.");
    } finally {
      setLoadingM(false);
    }
  }

  // --- Generate caja chica report ---
  async function handleGenerarCaja() {
    setErrorCaja(null);
    setSuccessM_caja(null);
    setLoadingCaja(true);

    try {
      const res = await fetch("/api/reportes/caja-chica", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ anio: anioCaja, mes: mesCaja }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Error ${res.status}`);
      }

      const mesLabel = MESES.find((m) => m.value === mesCaja)?.label ?? String(mesCaja);
      await triggerDownload(res, `Caja Chica (${mesLabel} - ${anioCaja}).pdf`);
      setSuccessM_caja("Reporte de caja chica generado correctamente.");
    } catch (e) {
      setErrorCaja(e instanceof Error ? e.message : "Error al generar el reporte.");
    } finally {
      setLoadingCaja(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* === Reportes Mensuales === */}
      <SectionCard
        title="Reportes Mensuales por Contador"
        description="Seleccioná uno o más contadores y el período para generar los PDFs de servicios agrupados por tipo de persona."
      >
        <div className="flex flex-col gap-5">
          {/* Contador chips */}
          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Contadores
            </p>
            <ChipSelector
              contadores={contadores}
              selected={selContadores}
              onChange={setSelContadores}
            />
          </div>

          {/* Period selectors */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Select
              label="Mes"
              value={mesM}
              onChange={setMesM}
              options={MESES}
            />
            <Select
              label="Año"
              value={anioM}
              onChange={setAnioM}
              options={ANIOS.map((a) => ({ value: a, label: String(a) }))}
            />
          </div>

          {/* Action */}
          <div>
            <Button
              onClick={handleGenerarMensual}
              disabled={loadingM || selContadores.length === 0}
              className="gap-2"
            >
              {loadingM ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              {loadingM
                ? "Generando..."
                : selContadores.length > 1
                ? `Generar ${selContadores.length} Reportes PDF`
                : "Generar Reporte PDF"}
            </Button>

            {errorM && <StatusBanner type="error" message={errorM} />}
            {successM && <StatusBanner type="success" message={successM} />}
          </div>
        </div>
      </SectionCard>

      {/* === Caja Chica === */}
      <SectionCard
        title="Reporte de Caja Chica"
        description="Generá el reporte mensual de movimientos de caja chica con saldos y totales."
      >
        <div className="flex flex-col gap-5">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Select
              label="Mes"
              value={mesCaja}
              onChange={setMesCaja}
              options={MESES}
            />
            <Select
              label="Año"
              value={anioCaja}
              onChange={setAnioCaja}
              options={ANIOS.map((a) => ({ value: a, label: String(a) }))}
            />
          </div>

          <div>
            <Button
              onClick={handleGenerarCaja}
              disabled={loadingCaja}
              className="gap-2"
            >
              {loadingCaja ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              {loadingCaja ? "Generando..." : "Generar Reporte PDF"}
            </Button>

            {errorCaja && <StatusBanner type="error" message={errorCaja} />}
            {successCaja && <StatusBanner type="success" message={successCaja} />}
          </div>
        </div>
      </SectionCard>

      {/* === Cotizaciones === */}
      <SectionCard
        title="Cotizaciones"
        description="Los PDFs de cotización se generan desde la ficha de cada prospecto."
      >
        <div className="flex items-center gap-3 rounded-md border border-border bg-muted/30 px-4 py-3">
          <FileText className="h-5 w-5 shrink-0 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Andá a{" "}
            <a
              href="/prospectos"
              className="font-medium text-primary underline-offset-2 hover:underline"
            >
              Prospectos
            </a>{" "}
            y desde la ficha de cada prospecto podés generar y descargar la
            cotización en PDF.
          </p>
        </div>
      </SectionCard>
    </div>
  );
}

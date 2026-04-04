"use client";

import * as React from "react";
import { DownloadIcon, Loader2Icon, XIcon } from "lucide-react";

import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { formatCurrency, formatDate } from "@/lib/format";
import { getCajaChicaResumenAction } from "@/features/caja-chica/actions";
import type { FinanzaRow } from "./finanza-table";

/* ------------------------------------------------------------------ */
/* Types                                                                */
/* ------------------------------------------------------------------ */

interface KPIs {
  totalIngresos: number;
  totalEgresos: number;
  utilidad: number;
  deudaTotal: number;
}

interface CobradoPorCuenta {
  id: string;
  nombre: string;
  banco: string;
  tipo: string;
  montoCobrado: number;
}

interface FinanzaPdfDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: FinanzaRow[];
  kpis: KPIs;
  cobradoPorCuenta: CobradoPorCuenta[];
  anio: number;
  mes: number;
}

/* ------------------------------------------------------------------ */
/* Constants                                                            */
/* ------------------------------------------------------------------ */

const MESES_FULL = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];
const MESES_SHORT = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Set", "Oct", "Nov", "Dic"];

const ACCOUNT_COLORS = ["#5B7FBE", "#7FAEDB", "#4A8BA8", "#8BC34A", "#66C6E0", "#3B6E9E", "#A8C8E8", "#5AB7C2"];

function buildMonthOptions(baseAnio: number) {
  const options: { label: string; anio: number; mes: number }[] = [];
  for (let y = baseAnio - 1; y <= baseAnio; y++) {
    for (let m = 1; m <= 12; m++) {
      options.push({ label: `${MESES_FULL[m - 1]} ${y}`, anio: y, mes: m });
    }
  }
  return options;
}

function monthKey(anio: number, mes: number) {
  return `${anio}-${String(mes).padStart(2, "0")}`;
}

/* ------------------------------------------------------------------ */
/* Main component                                                       */
/* ------------------------------------------------------------------ */

export function FinanzaPdfDialog({
  open,
  onOpenChange,
  data,
  kpis,
  cobradoPorCuenta,
  anio,
  mes,
}: FinanzaPdfDialogProps) {
  const [desdeAnio, setDesdeAnio] = React.useState(anio);
  const [desdeMes, setDesdeMes] = React.useState(mes);
  const [hastaAnio, setHastaAnio] = React.useState(anio);
  const [hastaMes, setHastaMes] = React.useState(mes);
  const [generating, setGenerating] = React.useState(false);
  const [cajaChicaResumen, setCajaChicaResumen] = React.useState<{
    totalIngresos: number; totalGastos: number; saldoFinal: number; movimientos: number;
    gastosPorCategoria: { cat: string; monto: number }[];
  } | null>(null);

  const monthOptions = React.useMemo(() => buildMonthOptions(anio), [anio]);

  /* Reset state on open */
  React.useEffect(() => {
    if (open) {
      setDesdeAnio(anio);
      setDesdeMes(mes);
      setHastaAnio(anio);
      setHastaMes(mes);
      setGenerating(false);
      setCajaChicaResumen(null);
    }
  }, [open, anio, mes]);

  /* Load caja chica data when range changes */
  React.useEffect(() => {
    if (!open) return;
    getCajaChicaResumenAction(desdeAnio, desdeMes, hastaAnio, hastaMes)
      .then(setCajaChicaResumen)
      .catch(() => setCajaChicaResumen(null));
  }, [open, desdeAnio, desdeMes, hastaAnio, hastaMes]);

  /* Escape to close */
  React.useEffect(() => {
    if (!open) return;
    function handleEsc(e: KeyboardEvent) {
      if (e.key === "Escape") { e.stopImmediatePropagation(); onOpenChange(false); }
    }
    document.addEventListener("keydown", handleEsc, true);
    return () => document.removeEventListener("keydown", handleEsc, true);
  }, [open, onOpenChange]);

  /* ---------- Filtered data ---------- */
  const filteredData = React.useMemo(() => {
    const desde = new Date(desdeAnio, desdeMes - 1, 1);
    const hasta = new Date(hastaAnio, hastaMes, 0, 23, 59, 59);
    return data.filter((row) => {
      const d = new Date(row.fecha);
      return d >= desde && d <= hasta;
    });
  }, [data, desdeAnio, desdeMes, hastaAnio, hastaMes]);

  /* ---------- Recalculated KPIs ---------- */
  const filteredKpis = React.useMemo(() => {
    const totalIngresos = filteredData.filter((r) => r.tipo === "INGRESO").reduce((s, r) => s + r.monto, 0);
    const totalEgresos = filteredData.filter((r) => r.tipo === "EGRESO").reduce((s, r) => s + r.monto, 0);
    return { totalIngresos, totalEgresos, utilidad: totalIngresos - totalEgresos, deudaTotal: kpis.deudaTotal };
  }, [filteredData, kpis.deudaTotal]);

  /* ---------- Cobrado por cuenta ---------- */
  const filteredCobrado = React.useMemo(() => {
    const map = new Map<string, { nombre: string; banco: string; total: number }>();
    filteredData.filter((r) => r.tipo === "INGRESO").forEach((r) => {
      const existing = map.get(r.cuenta.id);
      if (existing) existing.total += r.monto;
      else map.set(r.cuenta.id, { nombre: r.cuenta.nombre, banco: r.cuenta.banco, total: r.monto });
    });
    return Array.from(map.entries()).map(([id, v]) => ({ id, nombre: v.nombre, banco: v.banco, montoCobrado: v.total }));
  }, [filteredData]);

  const totalCobrado = filteredCobrado.reduce((s, c) => s + c.montoCobrado, 0);

  /* ---------- Egresos por categoria ---------- */
  const egresosPorCategoria = React.useMemo(() => {
    const map = new Map<string, number>();
    filteredData.filter((r) => r.tipo === "EGRESO" && r.categoriaGasto).forEach((r) => {
      map.set(r.categoriaGasto!, (map.get(r.categoriaGasto!) ?? 0) + r.monto);
    });
    return Array.from(map.entries()).map(([cat, monto]) => ({ cat, monto })).sort((a, b) => b.monto - a.monto);
  }, [filteredData]);

  /* ---------- Ingresos por tipo servicio ---------- */
  const ingresosPorServicio = React.useMemo(() => {
    const map = new Map<string, number>();
    filteredData.filter((r) => r.tipo === "INGRESO" && r.servicio).forEach((r) => {
      const tipo = r.servicio!.tipoServicio.nombre;
      map.set(tipo, (map.get(tipo) ?? 0) + r.monto);
    });
    return Array.from(map.entries()).map(([tipo, monto]) => ({ tipo, monto })).sort((a, b) => b.monto - a.monto);
  }, [filteredData]);

  /* ---------- Pivot: ingresos por contador por mes ---------- */
  const pivotContador = React.useMemo(() => {
    const monthSet = new Set<string>();
    const map = new Map<string, Map<string, number>>();
    filteredData.filter((r) => r.tipo === "INGRESO" && r.servicio?.contador).forEach((r) => {
      const d = new Date(r.fecha);
      const mLabel = `${MESES_SHORT[d.getMonth()]} ${String(d.getFullYear()).slice(2)}`;
      monthSet.add(mLabel);
      const contadorName = `${r.servicio!.contador.nombre} ${r.servicio!.contador.apellido}`;
      if (!map.has(contadorName)) map.set(contadorName, new Map());
      const entry = map.get(contadorName)!;
      entry.set(mLabel, (entry.get(mLabel) ?? 0) + r.monto);
    });
    const monthLabels = Array.from(monthSet);
    const rows = Array.from(map.entries()).map(([name, meses]) => {
      const total = Array.from(meses.values()).reduce((a, b) => a + b, 0);
      return { name, meses, total };
    }).sort((a, b) => b.total - a.total);
    return { monthLabels, rows };
  }, [filteredData]);

  /* ---------- Pivot: ingresos por tipo servicio por mes ---------- */
  const pivotServicio = React.useMemo(() => {
    const months = new Set<string>();
    const map = new Map<string, Map<string, number>>();
    filteredData.filter((r) => r.tipo === "INGRESO" && r.servicio).forEach((r) => {
      const d = new Date(r.fecha);
      const mLabel = `${MESES_SHORT[d.getMonth()]} ${String(d.getFullYear()).slice(2)}`;
      months.add(mLabel);
      const tipo = r.servicio!.tipoServicio.nombre;
      if (!map.has(tipo)) map.set(tipo, new Map());
      const entry = map.get(tipo)!;
      entry.set(mLabel, (entry.get(mLabel) ?? 0) + r.monto);
    });
    const monthLabels = Array.from(months);
    const rows = Array.from(map.entries()).map(([name, meses]) => {
      const total = Array.from(meses.values()).reduce((a, b) => a + b, 0);
      return { name, meses, total };
    }).sort((a, b) => b.total - a.total);
    return { monthLabels, rows };
  }, [filteredData]);

  /* ---------- Monthly flow summary ---------- */
  const monthlyFlow = React.useMemo(() => {
    const map = new Map<string, { label: string; ingresos: number; egresos: number }>();
    filteredData.forEach((r) => {
      const d = new Date(r.fecha);
      const key = monthKey(d.getFullYear(), d.getMonth() + 1);
      const existing = map.get(key);
      if (!existing) {
        map.set(key, {
          label: `${MESES_SHORT[d.getMonth()]} ${d.getFullYear()}`,
          ingresos: r.tipo === "INGRESO" ? r.monto : 0,
          egresos: r.tipo === "EGRESO" ? r.monto : 0,
        });
      } else {
        if (r.tipo === "INGRESO") existing.ingresos += r.monto;
        else existing.egresos += r.monto;
      }
    });
    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([, v]) => v);
  }, [filteredData]);

  /* ---------- Range label ---------- */
  const rangeLabel = React.useMemo(() => {
    if (desdeAnio === hastaAnio && desdeMes === hastaMes) return `${MESES_FULL[desdeMes - 1]} ${desdeAnio}`;
    return `${MESES_FULL[desdeMes - 1]} ${desdeAnio} — ${MESES_FULL[hastaMes - 1]} ${hastaAnio}`;
  }, [desdeAnio, desdeMes, hastaAnio, hastaMes]);

  /* ---------- Chart data for inline SVG ---------- */
  const chartData = React.useMemo(() => {
    if (monthlyFlow.length === 0) return null;
    const maxVal = Math.max(...monthlyFlow.map((m) => Math.max(m.ingresos, m.egresos)), 1);
    return { months: monthlyFlow, maxVal };
  }, [monthlyFlow]);

  /* ---------- PDF generation (html2canvas — exact web look) ---------- */
  const handleDownload = React.useCallback(async () => {
    setGenerating(true);
    await new Promise((r) => setTimeout(r, 500));

    try {
      const { default: html2canvas } = await import("html2canvas-pro");
      const { jsPDF } = await import("jspdf");

      const el = document.getElementById("pdf-report");
      if (!el) throw new Error("Elemento no encontrado");

      // Capture the full report at 2x scale
      const canvas = await html2canvas(el, { scale: 2, useCORS: true, backgroundColor: "#ffffff" });

      const pdf = new jsPDF("p", "mm", "a4");
      const pw = pdf.internal.pageSize.getWidth();
      const ph = pdf.internal.pageSize.getHeight();
      const m = 8;
      const footerH = 7;
      const usableW = pw - m * 2;
      const usableH = ph - m * 2 - footerH;

      // Pixels per mm at the PDF scale
      const pxPerMm = canvas.width / usableW;
      const pageHeightPx = Math.floor(usableH * pxPerMm);

      // Find safe cut points: collect Y positions of all <tr> and section <div> boundaries
      const reportRect = el.getBoundingClientRect();
      const rows = el.querySelectorAll("tr, [data-pdf-section]");
      const cutPoints: number[] = [0];
      rows.forEach((row) => {
        const rect = row.getBoundingClientRect();
        const yPx = Math.round((rect.top - reportRect.top) * 2); // ×2 for scale
        if (yPx > 0) cutPoints.push(yPx);
      });
      cutPoints.push(canvas.height);

      // Build pages: find the best cut point near each page boundary
      const pages: { srcY: number; srcH: number }[] = [];
      let currentY = 0;

      while (currentY < canvas.height) {
        const idealEnd = currentY + pageHeightPx;

        if (idealEnd >= canvas.height) {
          // Last page — take the rest
          pages.push({ srcY: currentY, srcH: canvas.height - currentY });
          break;
        }

        // Find the nearest cut point that doesn't exceed idealEnd
        let bestCut = currentY + pageHeightPx;
        for (let i = cutPoints.length - 1; i >= 0; i--) {
          if (cutPoints[i] <= idealEnd && cutPoints[i] > currentY + pageHeightPx * 0.5) {
            bestCut = cutPoints[i];
            break;
          }
        }

        pages.push({ srcY: currentY, srcH: bestCut - currentY });
        currentY = bestCut;
      }

      // Render each page
      for (let i = 0; i < pages.length; i++) {
        if (i > 0) pdf.addPage();
        const { srcY, srcH } = pages[i];

        const pageCanvas = document.createElement("canvas");
        pageCanvas.width = canvas.width;
        pageCanvas.height = srcH;
        const ctx = pageCanvas.getContext("2d")!;
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);
        ctx.drawImage(canvas, 0, srcY, canvas.width, srcH, 0, 0, canvas.width, srcH);

        const pageImg = pageCanvas.toDataURL("image/png");
        const sliceH = srcH / pxPerMm;
        pdf.addImage(pageImg, "PNG", m, m, usableW, sliceH);
      }

      // Footer on every page
      const totalPages = pdf.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        pdf.setPage(i);
        pdf.setFontSize(7);
        pdf.setFont("helvetica", "normal");
        pdf.setTextColor(148, 163, 184);
        pdf.text("Generado por C&A — Contadores y Asociados", m, ph - 4);
        pdf.text(`Pagina ${i} de ${totalPages}`, pw - m, ph - 4, { align: "right" });
      }

      pdf.save(`finanzas-${monthKey(desdeAnio, desdeMes)}_${monthKey(hastaAnio, hastaMes)}.pdf`);
    } catch (err) {
      console.error("Error generando PDF:", err);
    } finally {
      setGenerating(false);
    }
  }, [desdeAnio, desdeMes, hastaAnio, hastaMes]);

  if (!open) return null;

  const sorted = [...filteredData].sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());
  const now = new Date();
  const genAt = now.toLocaleDateString("es-PE", { day: "2-digit", month: "long", year: "numeric", timeZone: "America/Lima" });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => onOpenChange(false)}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />
      <div
        className="relative w-full max-w-4xl bg-card rounded-lg shadow-2xl overflow-hidden animate-in zoom-in-95 fade-in duration-150 flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ---- Header ---- */}
        <div className="shrink-0 px-5 pt-4 pb-3 border-b border-border flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <h2 className="text-sm font-bold whitespace-nowrap">Reporte Financiero</h2>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Desde</span>
                <Select
                  value={monthKey(desdeAnio, desdeMes)}
                  onValueChange={(v) => { if (!v) return; const [y, m] = v.split("-").map(Number); setDesdeAnio(y!); setDesdeMes(m!); }}
                >
                  <SelectTrigger size="sm" className="w-auto text-xs">
                    {MESES_SHORT[desdeMes - 1]} {desdeAnio}
                  </SelectTrigger>
                  <SelectContent>
                    {monthOptions.map((o) => (
                      <SelectItem key={monthKey(o.anio, o.mes)} value={monthKey(o.anio, o.mes)}>{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Hasta</span>
                <Select
                  value={monthKey(hastaAnio, hastaMes)}
                  onValueChange={(v) => { if (!v) return; const [y, m] = v.split("-").map(Number); setHastaAnio(y!); setHastaMes(m!); }}
                >
                  <SelectTrigger size="sm" className="w-auto text-xs">
                    {MESES_SHORT[hastaMes - 1]} {hastaAnio}
                  </SelectTrigger>
                  <SelectContent>
                    {monthOptions.map((o) => (
                      <SelectItem key={monthKey(o.anio, o.mes)} value={monthKey(o.anio, o.mes)}>{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs text-muted-foreground">{filteredData.length} transacciones</span>
            <button
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
              onClick={handleDownload}
              disabled={generating || filteredData.length === 0}
            >
              {generating ? (
                <><Loader2Icon className="size-3.5 animate-spin" />Generando...</>
              ) : (
                <><DownloadIcon className="size-3.5" />Descargar</>
              )}
            </button>
            <button onClick={() => onOpenChange(false)} className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted">
              <XIcon className="size-4" />
            </button>
          </div>
        </div>

        {/* ---- Scrollable preview ---- */}
        <div className="overflow-y-auto flex-1 p-4 bg-muted/30">
          <div
            id="pdf-report"
            style={{
              width: "794px",
              margin: "0 auto",
              fontFamily: "system-ui, -apple-system, sans-serif",
              backgroundColor: "#ffffff",
              color: "#1a1a2e",
              padding: "36px 40px",
              boxSizing: "border-box",
            }}
          >
            {/* ===== 1. Header ===== */}
            <div style={{ borderBottom: "2.5px solid #5B7FBE", paddingBottom: "12px", marginBottom: "20px", display: "flex", alignItems: "center", gap: "14px" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo.svg" alt="C&A" style={{ width: "60px", height: "60px", objectFit: "contain" }} crossOrigin="anonymous" />
              <div style={{ flex: 1 }}>
                <h1 style={{ fontSize: "20px", fontWeight: 700, color: "#5B7FBE", margin: 0, letterSpacing: "-0.02em" }}>
                  C&amp;A — Contadores y Asociados
                </h1>
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: "4px" }}>
                  <p style={{ fontSize: "12px", color: "#64748b", margin: 0 }}>
                    Reporte Financiero: <strong style={{ color: "#1a1a2e" }}>{rangeLabel}</strong>
                  </p>
                  <p style={{ fontSize: "11px", color: "#94a3b8", margin: 0 }}>Generado el {genAt}</p>
                </div>
              </div>
            </div>

            {/* ===== 2. KPI row ===== */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "10px", marginBottom: "20px" }}>
              <KpiBox label="Ingresos" value={filteredKpis.totalIngresos} color="#10b981" />
              <KpiBox label="Egresos" value={filteredKpis.totalEgresos} color="#ef4444" />
              <KpiBox label="Utilidad" value={filteredKpis.utilidad} color={filteredKpis.utilidad >= 0 ? "#10b981" : "#ef4444"} />
              <KpiBox label="Deuda Total" value={filteredKpis.deudaTotal} color="#ef4444" />
            </div>

            {/* ===== 3. Resumen side-by-side ===== */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "20px" }}>
              {/* Ingresos por tipo servicio */}
              <div>
                <SectionTitle>Ingresos por tipo de servicio</SectionTitle>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <tbody>
                    {ingresosPorServicio.map((r, i) => {
                      const pct = filteredKpis.totalIngresos > 0 ? Math.round((r.monto / filteredKpis.totalIngresos) * 100) : 0;
                      return (
                        <tr key={r.tipo} style={{ backgroundColor: i % 2 === 0 ? "#ffffff" : "#f8fafc", borderBottom: "1px solid #f1f5f9" }}>
                          <td style={{ ...S.td, fontWeight: 500 }}>{r.tipo}</td>
                          <td style={{ ...S.td, width: "35%" }}>
                            <div style={{ height: "10px", backgroundColor: "#e2e8f0", borderRadius: "3px", overflow: "hidden" }}>
                              <div style={{ height: "100%", width: `${pct}%`, backgroundColor: "#10b981", borderRadius: "3px" }} />
                            </div>
                          </td>
                          <td style={{ ...S.td, textAlign: "right", ...S.mono, fontWeight: 600, color: "#10b981" }}>
                            {formatCurrency(r.monto)}
                          </td>
                        </tr>
                      );
                    })}
                    {ingresosPorServicio.length === 0 && (
                      <tr><td colSpan={3} style={{ ...S.td, color: "#94a3b8", textAlign: "center" }}>Sin datos</td></tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Egresos por categoria */}
              <div>
                <SectionTitle>Egresos por categoria</SectionTitle>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <tbody>
                    {egresosPorCategoria.map((r, i) => {
                      const pct = filteredKpis.totalEgresos > 0 ? Math.round((r.monto / filteredKpis.totalEgresos) * 100) : 0;
                      return (
                        <tr key={r.cat} style={{ backgroundColor: i % 2 === 0 ? "#ffffff" : "#f8fafc", borderBottom: "1px solid #f1f5f9" }}>
                          <td style={{ ...S.td, fontWeight: 500 }}>{r.cat}</td>
                          <td style={{ ...S.td, width: "35%" }}>
                            <div style={{ height: "10px", backgroundColor: "#e2e8f0", borderRadius: "3px", overflow: "hidden" }}>
                              <div style={{ height: "100%", width: `${pct}%`, backgroundColor: "#ef4444", borderRadius: "3px" }} />
                            </div>
                          </td>
                          <td style={{ ...S.td, textAlign: "right", ...S.mono, fontWeight: 600, color: "#ef4444" }}>
                            {formatCurrency(r.monto)}
                          </td>
                        </tr>
                      );
                    })}
                    {egresosPorCategoria.length === 0 && (
                      <tr><td colSpan={3} style={{ ...S.td, color: "#94a3b8", textAlign: "center" }}>Sin datos</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* ===== 4. Cobrado por cuenta ===== */}
            {filteredCobrado.length > 0 && (
              <div style={{ marginBottom: "20px" }}>
                <SectionTitle>Cobrado por cuenta bancaria</SectionTitle>
                <div style={{ display: "flex", height: "22px", borderRadius: "4px", overflow: "hidden", border: "1px solid #e2e8f0" }}>
                  {filteredCobrado.map((c, i) => {
                    const pct = totalCobrado > 0 ? (c.montoCobrado / totalCobrado) * 100 : 0;
                    return (
                      <div
                        key={c.id}
                        style={{
                          width: `${pct}%`,
                          minWidth: pct > 0 ? "30px" : 0,
                          backgroundColor: ACCOUNT_COLORS[i % ACCOUNT_COLORS.length],
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        {pct > 12 && <span style={{ fontSize: "8px", color: "#ffffff", fontWeight: 600 }}>{c.nombre}</span>}
                      </div>
                    );
                  })}
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", marginTop: "6px" }}>
                  {filteredCobrado.map((c, i) => (
                    <div key={c.id} style={{ display: "flex", alignItems: "center", gap: "3px" }}>
                      <div style={{ width: "8px", height: "8px", borderRadius: "2px", backgroundColor: ACCOUNT_COLORS[i % ACCOUNT_COLORS.length] }} />
                      <span style={{ fontSize: "9px", color: "#64748b" }}>
                        {c.nombre} ({c.banco}): <strong>{formatCurrency(c.montoCobrado)}</strong>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ===== 5. Income/Expense composed chart (SVG) ===== */}
            {chartData && chartData.months.length > 1 && (
              <div style={{ marginBottom: "20px" }}>
                <SectionTitle>Flujo financiero — Grafico</SectionTitle>
                <BarLineChart months={chartData.months} maxVal={chartData.maxVal} />
              </div>
            )}

            {/* ===== 6. Flujo financiero table ===== */}
            {monthlyFlow.length > 0 && (
              <div style={{ marginBottom: "20px" }}>
                <SectionTitle>Flujo financiero — Resumen mensual</SectionTitle>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ backgroundColor: "#f8fafc", borderBottom: "2px solid #e2e8f0" }}>
                      <th style={{ ...S.th, width: "30%" }}>Mes</th>
                      <th style={{ ...S.th, width: "23%", textAlign: "right" }}>Ingresos</th>
                      <th style={{ ...S.th, width: "23%", textAlign: "right" }}>Egresos</th>
                      <th style={{ ...S.th, width: "24%", textAlign: "right" }}>Utilidad</th>
                    </tr>
                  </thead>
                  <tbody>
                    {monthlyFlow.map((m, i) => {
                      const utilidad = m.ingresos - m.egresos;
                      return (
                        <tr key={m.label} style={{ backgroundColor: i % 2 === 0 ? "#ffffff" : "#f8fafc", borderBottom: "1px solid #f1f5f9" }}>
                          <td style={{ ...S.td, fontWeight: 500 }}>{m.label}</td>
                          <td style={{ ...S.td, textAlign: "right", ...S.mono, color: "#10b981", fontWeight: 600 }}>{formatCurrency(m.ingresos)}</td>
                          <td style={{ ...S.td, textAlign: "right", ...S.mono, color: "#ef4444", fontWeight: 600 }}>{formatCurrency(m.egresos)}</td>
                          <td style={{ ...S.td, textAlign: "right", ...S.mono, color: utilidad >= 0 ? "#10b981" : "#ef4444", fontWeight: 700 }}>
                            {formatCurrency(utilidad)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr style={{ borderTop: "2px solid #e2e8f0", backgroundColor: "#f1f5f9" }}>
                      <td style={{ ...S.td, fontWeight: 700 }}>Totales</td>
                      <td style={{ ...S.td, textAlign: "right", ...S.mono, color: "#10b981", fontWeight: 700 }}>
                        {formatCurrency(filteredKpis.totalIngresos)}
                      </td>
                      <td style={{ ...S.td, textAlign: "right", ...S.mono, color: "#ef4444", fontWeight: 700 }}>
                        {formatCurrency(filteredKpis.totalEgresos)}
                      </td>
                      <td style={{ ...S.td, textAlign: "right", ...S.mono, color: filteredKpis.utilidad >= 0 ? "#10b981" : "#ef4444", fontWeight: 700 }}>
                        {formatCurrency(filteredKpis.utilidad)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}

            {/* ===== 7. Transaction table ===== */}
            <div style={{ marginBottom: "20px" }}>
              <SectionTitle>Detalle de transacciones ({sorted.length})</SectionTitle>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ backgroundColor: "#f8fafc", borderBottom: "2px solid #e2e8f0" }}>
                    <th style={{ ...S.th, width: "11%" }}>Fecha</th>
                    <th style={{ ...S.th, width: "7%" }}>Tipo</th>
                    <th style={{ ...S.th, width: "27%" }}>Concepto</th>
                    <th style={{ ...S.th, width: "14%", textAlign: "right" }}>Monto</th>
                    <th style={{ ...S.th, width: "14%" }}>Cuenta</th>
                    <th style={{ ...S.th, width: "18%" }}>Cliente</th>
                    <th style={{ ...S.th, width: "5%", textAlign: "center" }}>Val.</th>
                  </tr>
                </thead>
                <tbody>
                  {sorted.map((row, i) => (
                    <tr key={row.id} style={{ backgroundColor: i % 2 === 0 ? "#ffffff" : "#f8fafc", borderBottom: "1px solid #f1f5f9" }}>
                      <td style={S.td}>{formatDate(row.fecha)}</td>
                      <td style={S.td}>
                        <span style={{
                          display: "inline-block",
                          padding: "1px 5px",
                          borderRadius: "3px",
                          fontSize: "8px",
                          fontWeight: 600,
                          backgroundColor: row.tipo === "INGRESO" ? "#dcfce7" : "#fee2e2",
                          color: row.tipo === "INGRESO" ? "#166534" : "#991b1b",
                        }}>
                          {row.tipo === "INGRESO" ? "Ingreso" : "Egreso"}
                        </span>
                      </td>
                      <td style={{ ...S.td, maxWidth: "180px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {row.concepto}
                      </td>
                      <td style={{ ...S.td, textAlign: "right", ...S.mono, fontWeight: 600, color: row.tipo === "INGRESO" ? "#10b981" : "#ef4444" }}>
                        {row.tipo === "EGRESO" ? "-" : ""}{formatCurrency(row.monto)}
                      </td>
                      <td style={{ ...S.td, fontSize: "9px", color: "#64748b" }}>{row.cuenta.nombre}</td>
                      <td style={{ ...S.td, fontSize: "9px", color: "#64748b" }}>
                        {row.servicio?.persona?.razonSocial?.split(" ").slice(0, 2).join(" ") ?? "\u2014"}
                      </td>
                      <td style={{ ...S.td, textAlign: "center" }}>
                        <span style={{
                          display: "inline-block",
                          width: "8px",
                          height: "8px",
                          borderRadius: "50%",
                          backgroundColor: row.validado ? "#10b981" : "#d1d5db",
                        }} />
                      </td>
                    </tr>
                  ))}
                  {sorted.length === 0 && (
                    <tr><td colSpan={7} style={{ ...S.td, textAlign: "center", color: "#94a3b8", padding: "20px 8px" }}>Sin transacciones</td></tr>
                  )}
                </tbody>
                {sorted.length > 0 && (
                  <tfoot>
                    <tr style={{ borderTop: "2px solid #e2e8f0", backgroundColor: "#f1f5f9" }}>
                      <td colSpan={3} style={{ ...S.td, fontWeight: 700, fontSize: "10px" }}>Totales</td>
                      <td style={{ ...S.td, textAlign: "right" }}>
                        <div style={{ ...S.mono, fontWeight: 700, color: "#10b981", fontSize: "10px" }}>
                          +{formatCurrency(sorted.filter((r) => r.tipo === "INGRESO").reduce((s, r) => s + r.monto, 0))}
                        </div>
                        <div style={{ ...S.mono, fontWeight: 700, color: "#ef4444", fontSize: "10px" }}>
                          -{formatCurrency(sorted.filter((r) => r.tipo === "EGRESO").reduce((s, r) => s + r.monto, 0))}
                        </div>
                      </td>
                      <td colSpan={3} />
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>

            {/* ===== 8. Pivot: Ventas por contador ===== */}
            {pivotContador.rows.length > 0 && (
              <div style={{ marginBottom: "20px" }}>
                <SectionTitle>Ventas por contador</SectionTitle>
                <p style={{ fontSize: "9px", color: "#94a3b8", margin: "-4px 0 8px 0" }}>Desglose mensual de ingresos por asesor contable</p>
                <PivotTablePdf labels={pivotContador.monthLabels} rows={pivotContador.rows} rowLabel="Contador" />
              </div>
            )}

            {/* ===== 9. Pivot: Ventas por tipo servicio ===== */}
            {pivotServicio.rows.length > 0 && (
              <div style={{ marginBottom: "20px" }}>
                <SectionTitle>Ventas por tipo de servicio</SectionTitle>
                <p style={{ fontSize: "9px", color: "#94a3b8", margin: "-4px 0 8px 0" }}>Desglose mensual de ingresos por tipo de servicio prestado</p>
                <PivotTablePdf labels={pivotServicio.monthLabels} rows={pivotServicio.rows} rowLabel="Servicio" />
              </div>
            )}

            {/* ===== 10. Caja Chica ===== */}
            {cajaChicaResumen && cajaChicaResumen.movimientos > 0 && (
              <div data-pdf-section style={{ marginBottom: "20px" }}>
                <SectionTitle>Caja Chica — Resumen</SectionTitle>
                <p style={{ fontSize: "9px", color: "#94a3b8", margin: "-4px 0 10px 0" }}>
                  {cajaChicaResumen.movimientos} movimientos en el período
                </p>

                {/* KPIs de caja chica */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px", marginBottom: "14px" }}>
                  <div style={{ border: "1px solid #e2e8f0", borderRadius: "6px", padding: "8px 10px", backgroundColor: "#fafafa" }}>
                    <p style={{ fontSize: "8px", fontWeight: 600, textTransform: "uppercase", color: "#94a3b8", margin: "0 0 2px 0" }}>Reposiciones</p>
                    <p style={{ fontSize: "14px", fontWeight: 700, fontFamily: "'Roboto Mono', monospace", color: "#10b981", margin: 0 }}>
                      {formatCurrency(cajaChicaResumen.totalIngresos)}
                    </p>
                  </div>
                  <div style={{ border: "1px solid #e2e8f0", borderRadius: "6px", padding: "8px 10px", backgroundColor: "#fafafa" }}>
                    <p style={{ fontSize: "8px", fontWeight: 600, textTransform: "uppercase", color: "#94a3b8", margin: "0 0 2px 0" }}>Gastos</p>
                    <p style={{ fontSize: "14px", fontWeight: 700, fontFamily: "'Roboto Mono', monospace", color: "#ef4444", margin: 0 }}>
                      {formatCurrency(cajaChicaResumen.totalGastos)}
                    </p>
                  </div>
                  <div style={{ border: "1px solid #e2e8f0", borderRadius: "6px", padding: "8px 10px", backgroundColor: "#fafafa" }}>
                    <p style={{ fontSize: "8px", fontWeight: 600, textTransform: "uppercase", color: "#94a3b8", margin: "0 0 2px 0" }}>Saldo Final</p>
                    <p style={{ fontSize: "14px", fontWeight: 700, fontFamily: "'Roboto Mono', monospace", color: cajaChicaResumen.saldoFinal >= 0 ? "#10b981" : "#ef4444", margin: 0 }}>
                      {formatCurrency(cajaChicaResumen.saldoFinal)}
                    </p>
                  </div>
                </div>

                {/* Gastos por categoría */}
                {cajaChicaResumen.gastosPorCategoria.length > 0 && (
                  <div>
                    <p style={{ fontSize: "10px", fontWeight: 600, color: "#64748b", margin: "0 0 6px 0" }}>Gastos por categoría</p>
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                      <tbody>
                        {cajaChicaResumen.gastosPorCategoria.map((g, i) => {
                          const pct = cajaChicaResumen.totalGastos > 0 ? Math.round((g.monto / cajaChicaResumen.totalGastos) * 100) : 0;
                          return (
                            <tr key={g.cat} style={{ backgroundColor: i % 2 === 0 ? "#fff" : "#f8fafc", borderBottom: "1px solid #f1f5f9" }}>
                              <td style={{ ...S.td, fontWeight: 500 }}>{g.cat}</td>
                              <td style={{ ...S.td, width: "40%" }}>
                                <div style={{ height: "10px", backgroundColor: "#e2e8f0", borderRadius: "3px", overflow: "hidden" }}>
                                  <div style={{ height: "100%", width: `${pct}%`, backgroundColor: "#ef4444", borderRadius: "3px", opacity: 0.7 }} />
                                </div>
                              </td>
                              <td style={{ ...S.td, textAlign: "right", fontWeight: 600, fontFamily: "'Roboto Mono', monospace", color: "#ef4444" }}>
                                {formatCurrency(g.monto)}
                              </td>
                              <td style={{ ...S.td, textAlign: "right", color: "#94a3b8", fontSize: "9px" }}>
                                {pct}%
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* ===== 11. Footer ===== */}
            <div style={{ borderTop: "1px solid #e2e8f0", paddingTop: "10px", textAlign: "center" }}>
              <p style={{ fontSize: "9px", color: "#94a3b8", margin: 0 }}>
                Generado por C&amp;A — Contadores y Asociados &bull; {sorted.length} transacciones &bull; {rangeLabel}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Shared inline styles                                                 */
/* ------------------------------------------------------------------ */

const S = {
  th: { padding: "6px 8px", textAlign: "left" as const, fontWeight: 600, color: "#64748b", fontSize: "9px", textTransform: "uppercase" as const, letterSpacing: "0.04em" },
  td: { padding: "5px 8px", verticalAlign: "middle" as const, fontSize: "10px" },
  mono: { fontFamily: "'Roboto Mono', ui-monospace, monospace" },
};

/* ------------------------------------------------------------------ */
/* Section title (for report)                                           */
/* ------------------------------------------------------------------ */

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 style={{ fontSize: "12px", fontWeight: 600, textTransform: "uppercase", color: "#64748b", letterSpacing: "0.05em", margin: "0 0 8px 0" }}>
      {children}
    </h2>
  );
}

/* ------------------------------------------------------------------ */
/* KPI Box                                                              */
/* ------------------------------------------------------------------ */

function KpiBox({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div style={{ border: "1px solid #e2e8f0", borderRadius: "6px", padding: "10px 12px", backgroundColor: "#fafafa" }}>
      <p style={{ fontSize: "9px", fontWeight: 600, textTransform: "uppercase", color: "#94a3b8", letterSpacing: "0.04em", margin: "0 0 3px 0" }}>
        {label}
      </p>
      <p style={{ fontSize: "15px", fontWeight: 700, fontFamily: "'Roboto Mono', ui-monospace, monospace", color, margin: 0 }}>
        {formatCurrency(value)}
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Pivot table for PDF preview                                          */
/* ------------------------------------------------------------------ */

function PivotTablePdf({
  labels,
  rows,
  rowLabel,
}: {
  labels: string[];
  rows: { name: string; meses: Map<string, number>; total: number }[];
  rowLabel: string;
}) {
  const grandTotal = rows.reduce((s, r) => s + r.total, 0);
  const monthTotals = labels.map((ml) => rows.reduce((s, r) => s + (r.meses.get(ml) ?? 0), 0));

  return (
    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "9px" }}>
      <thead>
        <tr style={{ backgroundColor: "#f8fafc", borderBottom: "2px solid #e2e8f0" }}>
          <th style={{ ...S.th, fontSize: "8px" }}>{rowLabel}</th>
          {labels.map((ml) => (
            <th key={ml} style={{ ...S.th, fontSize: "8px", textAlign: "right" }}>{ml}</th>
          ))}
          <th style={{ ...S.th, fontSize: "8px", textAlign: "right" }}>Total</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r, i) => (
          <tr key={r.name} style={{ backgroundColor: i % 2 === 0 ? "#fff" : "#f8fafc", borderBottom: "1px solid #f1f5f9" }}>
            <td style={{ ...S.td, fontWeight: 500, fontSize: "9px" }}>{r.name}</td>
            {labels.map((ml) => {
              const v = r.meses.get(ml);
              return (
                <td key={ml} style={{ ...S.td, textAlign: "right", ...S.mono, fontSize: "8px", color: v ? "#1a1a2e" : "#d1d5db" }}>
                  {v ? formatCurrency(v) : "—"}
                </td>
              );
            })}
            <td style={{ ...S.td, textAlign: "right", ...S.mono, fontWeight: 700, fontSize: "9px" }}>
              {formatCurrency(r.total)}
            </td>
          </tr>
        ))}
      </tbody>
      <tfoot>
        <tr style={{ borderTop: "2px solid #e2e8f0", backgroundColor: "#f1f5f9" }}>
          <td style={{ ...S.td, fontWeight: 700, fontSize: "9px" }}>Total</td>
          {monthTotals.map((t, i) => (
            <td key={i} style={{ ...S.td, textAlign: "right", ...S.mono, fontWeight: 700, fontSize: "8px" }}>
              {t ? formatCurrency(t) : "—"}
            </td>
          ))}
          <td style={{ ...S.td, textAlign: "right", ...S.mono, fontWeight: 700, fontSize: "9px", color: "#5B7FBE" }}>
            {formatCurrency(grandTotal)}
          </td>
        </tr>
      </tfoot>
    </table>
  );
}

/* ------------------------------------------------------------------ */
/* Composed bar + line chart (SVG — html2canvas friendly)               */
/* ------------------------------------------------------------------ */

function BarLineChart({ months, maxVal }: { months: { label: string; ingresos: number; egresos: number }[]; maxVal: number }) {
  const chartW = 714;
  const chartH = 180;
  const padTop = 10;
  const padBottom = 30;
  const padLeft = 0;
  const usableH = chartH - padTop - padBottom;
  const barGroupW = chartW / months.length;
  const barW = Math.min(barGroupW * 0.3, 28);
  const gap = 3;

  function y(val: number) {
    return padTop + usableH - (val / maxVal) * usableH;
  }

  /* Utilidad line points */
  const linePoints = months.map((m, i) => {
    const x = padLeft + barGroupW * i + barGroupW / 2;
    const utilidad = m.ingresos - m.egresos;
    const clampedUtil = Math.max(0, utilidad);
    return `${x},${y(clampedUtil)}`;
  }).join(" ");

  return (
    <svg width={chartW} height={chartH} style={{ display: "block" }}>
      {/* Grid lines */}
      {[0, 0.25, 0.5, 0.75, 1].map((pct) => {
        const yy = padTop + usableH - pct * usableH;
        return (
          <line key={pct} x1={0} y1={yy} x2={chartW} y2={yy} stroke="#f1f5f9" strokeWidth={1} />
        );
      })}

      {months.map((m, i) => {
        const cx = padLeft + barGroupW * i + barGroupW / 2;
        const ingH = (m.ingresos / maxVal) * usableH;
        const egrH = (m.egresos / maxVal) * usableH;

        return (
          <g key={m.label}>
            {/* Ingreso bar */}
            <rect
              x={cx - barW - gap / 2}
              y={padTop + usableH - ingH}
              width={barW}
              height={ingH}
              rx={3}
              fill="#10b981"
              opacity={0.85}
            />
            {/* Egreso bar */}
            <rect
              x={cx + gap / 2}
              y={padTop + usableH - egrH}
              width={barW}
              height={egrH}
              rx={3}
              fill="#ef4444"
              opacity={0.85}
            />
            {/* Label */}
            <text
              x={cx}
              y={chartH - 8}
              textAnchor="middle"
              style={{ fontSize: "9px", fill: "#64748b", fontFamily: "system-ui, sans-serif" }}
            >
              {m.label}
            </text>
          </g>
        );
      })}

      {/* Utilidad line */}
      <polyline
        points={linePoints}
        fill="none"
        stroke="#5B7FBE"
        strokeWidth={2}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {/* Utilidad dots */}
      {months.map((m, i) => {
        const cx = padLeft + barGroupW * i + barGroupW / 2;
        const utilidad = Math.max(0, m.ingresos - m.egresos);
        return (
          <circle key={i} cx={cx} cy={y(utilidad)} r={3} fill="#5B7FBE" stroke="#ffffff" strokeWidth={1.5} />
        );
      })}

      {/* Legend */}
      <rect x={chartW - 210} y={2} width={8} height={8} rx={2} fill="#10b981" />
      <text x={chartW - 198} y={10} style={{ fontSize: "8px", fill: "#64748b", fontFamily: "system-ui, sans-serif" }}>Ingresos</text>
      <rect x={chartW - 148} y={2} width={8} height={8} rx={2} fill="#ef4444" />
      <text x={chartW - 136} y={10} style={{ fontSize: "8px", fill: "#64748b", fontFamily: "system-ui, sans-serif" }}>Egresos</text>
      <rect x={chartW - 90} y={2} width={8} height={8} rx={2} fill="#5B7FBE" />
      <text x={chartW - 78} y={10} style={{ fontSize: "8px", fill: "#64748b", fontFamily: "system-ui, sans-serif" }}>Utilidad</text>
    </svg>
  );
}

"use client";

import * as React from "react";
import { DownloadIcon, Loader2Icon, XIcon } from "lucide-react";

import { formatCurrency } from "@/lib/format";
import type { ServicioListItem } from "../queries-list";

/* ------------------------------------------------------------------ */
/* Types & Constants                                                    */
/* ------------------------------------------------------------------ */

interface ServicioPdfDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  servicios: ServicioListItem[];
  periodoLabel: string;
}

const TIPO_PERSONA_LABELS: Record<string, string> = {
  JURIDICA: "Persona Jurídica",
  NATURAL: "Persona Natural",
  IMMUNOTEC: "Immunotec",
  FOUR_LIFE: "4Life",
  RXH: "RxH",
};

const TIPO_PERSONA_ORDER = ["NATURAL", "JURIDICA", "IMMUNOTEC", "FOUR_LIFE", "RXH"];

/* ------------------------------------------------------------------ */
/* Grouping logic                                                       */
/* ------------------------------------------------------------------ */

interface TipoGroup {
  tipo: string;
  label: string;
  items: ServicioListItem[];
  totals: { baseImponible: number; igv: number; noGravado: number; totalImponible: number; honorarios: number; numTrabajadores: number };
}

interface ContadorGroup {
  nombre: string;
  tipos: TipoGroup[];
  grandTotal: TipoGroup["totals"];
}

function sumTotals(items: ServicioListItem[]) {
  return items.reduce(
    (acc, s) => ({
      baseImponible: acc.baseImponible + s.baseImponible,
      igv: acc.igv + s.igv,
      noGravado: acc.noGravado + s.noGravado,
      totalImponible: acc.totalImponible + s.totalImponible,
      honorarios: acc.honorarios + s.honorarios,
      numTrabajadores: acc.numTrabajadores + (s.persona.numTrabajadores ?? 0),
    }),
    { baseImponible: 0, igv: 0, noGravado: 0, totalImponible: 0, honorarios: 0, numTrabajadores: 0 },
  );
}

function groupData(servicios: ServicioListItem[]): ContadorGroup[] {
  const contadorMap = new Map<string, ServicioListItem[]>();
  for (const s of servicios) {
    const key = `${s.contador.nombre} ${s.contador.apellido}`;
    if (!contadorMap.has(key)) contadorMap.set(key, []);
    contadorMap.get(key)!.push(s);
  }

  const groups: ContadorGroup[] = [];
  for (const [nombre, items] of Array.from(contadorMap.entries()).sort(([a], [b]) => a.localeCompare(b))) {
    const tipoMap = new Map<string, ServicioListItem[]>();
    for (const s of items) {
      const tipo = s.persona.tipoPersona;
      if (!tipoMap.has(tipo)) tipoMap.set(tipo, []);
      tipoMap.get(tipo)!.push(s);
    }

    const tipos: TipoGroup[] = [...TIPO_PERSONA_ORDER, ...Array.from(tipoMap.keys()).filter((t) => !TIPO_PERSONA_ORDER.includes(t))]
      .filter((t) => tipoMap.has(t))
      .map((t) => {
        const tipoItems = tipoMap.get(t)!.sort((a, b) => a.persona.razonSocial.localeCompare(b.persona.razonSocial));
        return { tipo: t, label: TIPO_PERSONA_LABELS[t] ?? t, items: tipoItems, totals: sumTotals(tipoItems) };
      });

    groups.push({ nombre, tipos, grandTotal: sumTotals(items) });
  }
  return groups;
}

/* ------------------------------------------------------------------ */
/* Colors (CSS vars don't work in html2canvas — use explicit hex)       */
/* ------------------------------------------------------------------ */

const C = {
  bg: "#ffffff",
  text: "#1a1a2e",
  muted: "#f8fafc",
  mutedAlt: "#f1f5f9",
  border: "#e2e8f0",
  borderLight: "#f1f5f9",
  primary: "#5B7FBE",
  green: "#10b981",
  red: "#ef4444",
  gray: "#64748b",
  grayLight: "#94a3b8",
};

/* ------------------------------------------------------------------ */
/* Component                                                            */
/* ------------------------------------------------------------------ */

export function ServicioPdfDialog({ open, onOpenChange, servicios, periodoLabel }: ServicioPdfDialogProps) {
  const [generating, setGenerating] = React.useState(false);

  React.useEffect(() => { if (open) setGenerating(false); }, [open]);
  React.useEffect(() => {
    if (!open) return;
    function handleEsc(e: KeyboardEvent) { if (e.key === "Escape") { e.stopImmediatePropagation(); onOpenChange(false); } }
    document.addEventListener("keydown", handleEsc, true);
    return () => document.removeEventListener("keydown", handleEsc, true);
  }, [open, onOpenChange]);

  const groups = React.useMemo(() => groupData(servicios), [servicios]);

  const handleDownload = React.useCallback(async () => {
    setGenerating(true);
    await new Promise((r) => setTimeout(r, 500));
    try {
      const { default: html2canvas } = await import("html2canvas-pro");
      const { jsPDF } = await import("jspdf");
      const el = document.getElementById("pdf-servicios-report");
      if (!el) throw new Error("Elemento no encontrado");
      const canvas = await html2canvas(el, { scale: 2, useCORS: true, backgroundColor: C.bg });
      const pdf = new jsPDF("p", "mm", "a4");
      const pw = pdf.internal.pageSize.getWidth();
      const ph = pdf.internal.pageSize.getHeight();
      const m = 8;
      const usableW = pw - m * 2;
      const usableH = ph - m * 2 - 7;
      const pxPerMm = canvas.width / usableW;
      const pageHeightPx = Math.floor(usableH * pxPerMm);

      const reportRect = el.getBoundingClientRect();
      const rows = el.querySelectorAll("tr, [data-pdf-section]");
      const cutPoints: number[] = [0];
      rows.forEach((row) => { const yPx = Math.round((row.getBoundingClientRect().top - reportRect.top) * 2); if (yPx > 0) cutPoints.push(yPx); });
      cutPoints.push(canvas.height);

      const pages: { srcY: number; srcH: number }[] = [];
      let currentY = 0;
      while (currentY < canvas.height) {
        const idealEnd = currentY + pageHeightPx;
        if (idealEnd >= canvas.height) { pages.push({ srcY: currentY, srcH: canvas.height - currentY }); break; }
        let bestCut = idealEnd;
        for (let i = cutPoints.length - 1; i >= 0; i--) { if (cutPoints[i] <= idealEnd && cutPoints[i] > currentY + pageHeightPx * 0.5) { bestCut = cutPoints[i]; break; } }
        pages.push({ srcY: currentY, srcH: bestCut - currentY });
        currentY = bestCut;
      }

      for (let i = 0; i < pages.length; i++) {
        if (i > 0) pdf.addPage();
        const { srcY, srcH } = pages[i];
        const pc = document.createElement("canvas"); pc.width = canvas.width; pc.height = srcH;
        const ctx = pc.getContext("2d")!; ctx.fillStyle = C.bg; ctx.fillRect(0, 0, pc.width, pc.height);
        ctx.drawImage(canvas, 0, srcY, canvas.width, srcH, 0, 0, canvas.width, srcH);
        pdf.addImage(pc.toDataURL("image/png"), "PNG", m, m, usableW, srcH / pxPerMm);
      }

      const tp = pdf.getNumberOfPages();
      for (let i = 1; i <= tp; i++) { pdf.setPage(i); pdf.setFontSize(7); pdf.setTextColor(148, 163, 184); pdf.text("Generado por C&A — Contadores y Asociados", m, ph - 4); pdf.text(`Pagina ${i} de ${tp}`, pw - m, ph - 4, { align: "right" }); }
      pdf.save(`servicios-${periodoLabel.replace(/\s+/g, "-").toLowerCase()}.pdf`);
    } catch (err) { console.error("Error generando PDF:", err); }
    finally { setGenerating(false); }
  }, [periodoLabel]);

  if (!open) return null;

  const genAt = new Date().toLocaleDateString("es-PE", { day: "2-digit", month: "long", year: "numeric", timeZone: "America/Lima" });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => onOpenChange(false)}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />
      <div className="relative w-full max-w-4xl bg-card rounded-lg shadow-2xl overflow-hidden animate-in zoom-in-95 fade-in duration-150 flex flex-col max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="shrink-0 px-5 pt-4 pb-3 border-b border-border flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <h2 className="text-sm font-bold whitespace-nowrap">Reporte de Servicios</h2>
            <span className="text-xs text-muted-foreground">{periodoLabel} — {servicios.length} servicios</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50" onClick={handleDownload} disabled={generating || servicios.length === 0}>
              {generating ? <><Loader2Icon className="size-3.5 animate-spin" />Generando...</> : <><DownloadIcon className="size-3.5" />Descargar</>}
            </button>
            <button onClick={() => onOpenChange(false)} className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted"><XIcon className="size-4" /></button>
          </div>
        </div>

        {/* Preview */}
        <div className="overflow-y-auto flex-1 p-4 bg-muted/30">
          <div id="pdf-servicios-report" style={{ width: "794px", margin: "0 auto", fontFamily: "system-ui, -apple-system, sans-serif", backgroundColor: C.bg, color: C.text, padding: "32px 36px", boxSizing: "border-box" }}>

            {/* Header */}
            <div style={{ borderBottom: `2.5px solid ${C.primary}`, paddingBottom: "12px", marginBottom: "24px", display: "flex", alignItems: "center", gap: "12px" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo.svg" alt="C&A" style={{ width: "54px", height: "54px", objectFit: "contain" }} crossOrigin="anonymous" />
              <div style={{ flex: 1 }}>
                <h1 style={{ fontSize: "18px", fontWeight: 700, color: C.primary, margin: 0 }}>C&amp;A — Contadores y Asociados</h1>
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: "4px" }}>
                  <p style={{ fontSize: "11px", color: C.gray, margin: 0 }}>Reporte de Servicios: <strong style={{ color: C.text }}>{periodoLabel}</strong></p>
                  <p style={{ fontSize: "10px", color: C.grayLight, margin: 0 }}>Generado el {genAt}</p>
                </div>
              </div>
            </div>

            {/* Contador sections */}
            {groups.map((contador, cIdx) => (
              <div key={contador.nombre} data-pdf-section style={{ marginBottom: "24px" }}>
                {/* Contador header */}
                <div style={{ marginBottom: "14px", paddingBottom: "6px", borderBottom: `1.5px solid ${C.border}` }}>
                  <h2 style={{ fontSize: "13px", fontWeight: 700, color: C.text, margin: 0 }}>{contador.nombre}</h2>
                </div>

                {/* Tipo sections */}
                {contador.tipos.map((tipo) => (
                  <div key={tipo.tipo} data-pdf-section style={{ marginBottom: "16px" }}>
                    {/* Tipo badge-style header */}
                    <div style={{ display: "inline-block", padding: "3px 10px", borderRadius: "4px", backgroundColor: C.mutedAlt, marginBottom: "8px" }}>
                      <span style={{ fontSize: "9px", fontWeight: 600, color: C.gray, textTransform: "uppercase", letterSpacing: "0.05em" }}>{tipo.label}</span>
                    </div>

                    {/* Table — web style */}
                    <table style={{ width: "100%", borderCollapse: "collapse", border: `1px solid ${C.border}`, borderRadius: "6px", overflow: "hidden" }}>
                      <thead>
                        <tr style={{ backgroundColor: C.muted, borderBottom: `1px solid ${C.border}` }}>
                          <Th w="4%" align="center">#</Th>
                          <Th w="28%">Empresa</Th>
                          <Th w="11%" align="right">Base Imp</Th>
                          <Th w="10%" align="right">IGV</Th>
                          <Th w="11%" align="right">No Grav.</Th>
                          <Th w="7%" align="center">Trab.</Th>
                          <Th w="13%" align="right">Total Imp</Th>
                          <Th w="16%" align="right">Honorarios</Th>
                        </tr>
                      </thead>
                      <tbody>
                        {tipo.items.map((s, i) => (
                          <tr key={s.id} style={{ backgroundColor: i % 2 === 0 ? C.bg : C.muted, borderBottom: `1px solid ${C.borderLight}` }}>
                            <Td align="center" muted>{i + 1}</Td>
                            <Td bold>{s.persona.razonSocial}</Td>
                            <Td align="right" mono>{formatCurrency(s.baseImponible)}</Td>
                            <Td align="right" mono>{formatCurrency(s.igv)}</Td>
                            <Td align="right" mono>{formatCurrency(s.noGravado)}</Td>
                            <Td align="center">{s.persona.numTrabajadores ?? "—"}</Td>
                            <Td align="right" mono>{formatCurrency(s.totalImponible)}</Td>
                            <Td align="right" mono bold>{formatCurrency(s.honorarios)}</Td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr style={{ backgroundColor: C.mutedAlt, borderTop: `2px solid ${C.border}` }}>
                          <td colSpan={2} style={{ ...tdBase, fontWeight: 700, fontSize: "9px" }}>Subtotal ({tipo.items.length})</td>
                          <Td align="right" mono bold>{formatCurrency(tipo.totals.baseImponible)}</Td>
                          <Td align="right" mono bold>{formatCurrency(tipo.totals.igv)}</Td>
                          <Td align="right" mono bold>{formatCurrency(tipo.totals.noGravado)}</Td>
                          <Td align="center" bold>{tipo.totals.numTrabajadores}</Td>
                          <Td align="right" mono bold>{formatCurrency(tipo.totals.totalImponible)}</Td>
                          <Td align="right" mono bold>{formatCurrency(tipo.totals.honorarios)}</Td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                ))}

                {/* Contador grand total */}
                <div data-pdf-section style={{ borderRadius: "6px", overflow: "hidden", border: `1px solid ${C.primary}` }}>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <tbody>
                      <tr style={{ backgroundColor: `${C.primary}15` }}>
                        <td style={{ ...tdBase, width: "32%", fontWeight: 700, fontSize: "10px", color: C.primary }}>Total {contador.nombre}</td>
                        <Td align="right" mono bold color={C.primary}>{formatCurrency(contador.grandTotal.baseImponible)}</Td>
                        <Td align="right" mono bold color={C.primary}>{formatCurrency(contador.grandTotal.igv)}</Td>
                        <Td align="right" mono bold color={C.primary}>{formatCurrency(contador.grandTotal.noGravado)}</Td>
                        <Td align="center" bold color={C.primary}>{contador.grandTotal.numTrabajadores}</Td>
                        <Td align="right" mono bold color={C.primary}>{formatCurrency(contador.grandTotal.totalImponible)}</Td>
                        <Td align="right" mono bold color={C.primary}>{formatCurrency(contador.grandTotal.honorarios)}</Td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            ))}

            {/* Global total */}
            {groups.length > 1 && (
              <div data-pdf-section style={{ borderRadius: "6px", overflow: "hidden", backgroundColor: C.primary, marginBottom: "20px" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <tbody>
                    <tr>
                      <td style={{ ...tdBase, width: "32%", fontWeight: 700, fontSize: "11px", color: "#fff" }}>TOTAL GENERAL</td>
                      <TdW>{formatCurrency(servicios.reduce((s, r) => s + r.baseImponible, 0))}</TdW>
                      <TdW>{formatCurrency(servicios.reduce((s, r) => s + r.igv, 0))}</TdW>
                      <TdW>{formatCurrency(servicios.reduce((s, r) => s + r.noGravado, 0))}</TdW>
                      <TdW center>{servicios.reduce((s, r) => s + (r.persona.numTrabajadores ?? 0), 0)}</TdW>
                      <TdW>{formatCurrency(servicios.reduce((s, r) => s + r.totalImponible, 0))}</TdW>
                      <TdW>{formatCurrency(servicios.reduce((s, r) => s + r.honorarios, 0))}</TdW>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}

            {/* Footer */}
            <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: "10px", textAlign: "center" }}>
              <p style={{ fontSize: "9px", color: C.grayLight, margin: 0 }}>
                Generado por C&amp;A &bull; {servicios.length} servicios &bull; {periodoLabel}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Table cell helpers (inline styles for html2canvas)                   */
/* ------------------------------------------------------------------ */

const tdBase: React.CSSProperties = {
  padding: "5px 8px",
  verticalAlign: "middle",
  fontSize: "9px",
};

function Th({ children, w, align = "left" }: { children: React.ReactNode; w: string; align?: string }) {
  return (
    <th style={{
      ...tdBase,
      width: w,
      textAlign: align as any,
      fontWeight: 600,
      fontSize: "8px",
      textTransform: "uppercase",
      letterSpacing: "0.05em",
      color: C.gray,
    }}>
      {children}
    </th>
  );
}

function Td({ children, align = "left", mono, bold, muted, color }: {
  children: React.ReactNode;
  align?: string;
  mono?: boolean;
  bold?: boolean;
  muted?: boolean;
  color?: string;
}) {
  return (
    <td style={{
      ...tdBase,
      textAlign: align as any,
      ...(mono ? { fontFamily: "'Roboto Mono', ui-monospace, monospace" } : {}),
      ...(bold ? { fontWeight: 700 } : {}),
      ...(muted ? { color: C.grayLight } : {}),
      ...(color ? { color } : {}),
    }}>
      {children}
    </td>
  );
}

function TdW({ children, center }: { children: React.ReactNode; center?: boolean }) {
  return (
    <td style={{
      ...tdBase,
      textAlign: center ? "center" : "right",
      fontFamily: "'Roboto Mono', ui-monospace, monospace",
      fontWeight: 700,
      color: "#ffffff",
      fontSize: "10px",
    }}>
      {children}
    </td>
  );
}

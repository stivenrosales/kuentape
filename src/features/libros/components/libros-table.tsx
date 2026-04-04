"use client";

import * as React from "react";
import { ArrowUp, ArrowDown, ArrowUpDown, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { LibroDetailDialog } from "./libro-detail-dialog";

const MESES = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Set", "Oct", "Nov", "Dic"];

export interface LibroRow {
  id: string;
  tipoLibro: string;
  anio: number;
  mes: number;
  completado: boolean;
  constanciaUrl: string | null;
  persona: {
    id: string;
    razonSocial: string;
    contadorAsignado: { id: string; nombre: string; apellido: string };
  };
}

type SortKey = "empresa" | "tipo" | "mes" | "contador" | "completado";
type SortDir = "asc" | "desc";

function SortableHeader({ label, sortKey, currentKey, currentDir, onSort }: {
  label: string; sortKey: SortKey; currentKey: SortKey; currentDir: SortDir; onSort: (k: SortKey) => void;
}) {
  const active = currentKey === sortKey;
  return (
    <th
      className={cn("px-3 py-2.5 text-left text-[10px] uppercase tracking-wider font-medium cursor-pointer select-none transition-colors hover:text-foreground", active ? "text-foreground" : "text-muted-foreground")}
      onClick={() => onSort(sortKey)}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        {active ? (currentDir === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />) : <ArrowUpDown className="h-3 w-3 opacity-30" />}
      </span>
    </th>
  );
}

export function LibrosTable({ data }: { data: LibroRow[] }) {
  const [sortKey, setSortKey] = React.useState<SortKey>("empresa");
  const [sortDir, setSortDir] = React.useState<SortDir>("asc");
  const [selected, setSelected] = React.useState<LibroRow | null>(null);

  function handleSort(key: SortKey) {
    if (sortKey === key) setSortDir((d) => d === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("asc"); }
  }

  const sorted = React.useMemo(() => {
    return [...data].sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case "empresa": cmp = a.persona.razonSocial.localeCompare(b.persona.razonSocial); break;
        case "tipo": cmp = a.tipoLibro.localeCompare(b.tipoLibro); break;
        case "mes": cmp = a.mes - b.mes; break;
        case "contador": cmp = `${a.persona.contadorAsignado.nombre}`.localeCompare(`${b.persona.contadorAsignado.nombre}`); break;
        case "completado": cmp = Number(a.completado) - Number(b.completado); break;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [data, sortKey, sortDir]);

  return (
    <>
      <div className="rounded-lg border border-border bg-card shadow-sm overflow-hidden">
        <table className="w-full text-sm border-collapse" style={{ tableLayout: "fixed" }}>
          <colgroup><col style={{ width: "6%" }} /><col style={{ width: "28%" }} /><col style={{ width: "22%" }} /><col style={{ width: "8%" }} /><col style={{ width: "20%" }} /><col style={{ width: "8%" }} /><col style={{ width: "8%" }} /></colgroup>
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <SortableHeader label="" sortKey="completado" currentKey={sortKey} currentDir={sortDir} onSort={handleSort} />
              <SortableHeader label="Empresa" sortKey="empresa" currentKey={sortKey} currentDir={sortDir} onSort={handleSort} />
              <SortableHeader label="Tipo" sortKey="tipo" currentKey={sortKey} currentDir={sortDir} onSort={handleSort} />
              <SortableHeader label="Mes" sortKey="mes" currentKey={sortKey} currentDir={sortDir} onSort={handleSort} />
              <SortableHeader label="Responsable" sortKey="contador" currentKey={sortKey} currentDir={sortDir} onSort={handleSort} />
              <th className="px-3 py-2.5 text-center text-[10px] uppercase tracking-wider font-medium text-muted-foreground">Año</th>
              <th className="px-3 py-2.5 text-center text-[10px] uppercase tracking-wider font-medium text-muted-foreground">Const.</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50">
            {sorted.length === 0 ? (
              <tr><td colSpan={7} className="py-12 text-center text-sm text-muted-foreground">No se encontraron libros contables.</td></tr>
            ) : sorted.map((row, i) => (
              <tr
                key={row.id}
                onClick={() => setSelected(row)}
                className={cn("cursor-pointer transition-colors hover:bg-primary/5", i % 2 === 0 ? "bg-muted/10" : "bg-background")}
              >
                <td className="px-3 py-2 text-center">
                  <Star className={cn("h-3.5 w-3.5 inline-block", row.completado ? "fill-emerald-500 text-emerald-500" : "text-muted-foreground/30")} />
                </td>
                <td className="px-3 py-2 text-xs font-medium truncate">{row.persona.razonSocial}</td>
                <td className="px-3 py-2 text-xs text-muted-foreground truncate">{row.tipoLibro}</td>
                <td className="px-3 py-2 text-xs text-center">{MESES[row.mes - 1]}</td>
                <td className="px-3 py-2 text-xs text-muted-foreground truncate">{row.persona.contadorAsignado.nombre} {row.persona.contadorAsignado.apellido}</td>
                <td className="px-3 py-2 text-xs text-center font-mono">{row.anio}</td>
                <td className="px-3 py-1 text-center">
                  {row.constanciaUrl ? (
                    <img src={row.constanciaUrl} alt="" className="h-6 w-8 object-cover rounded border border-border inline-block" />
                  ) : (
                    <span className="text-muted-foreground/30 text-xs">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selected && (
        <LibroDetailDialog libro={selected} onClose={() => setSelected(null)} />
      )}
    </>
  );
}

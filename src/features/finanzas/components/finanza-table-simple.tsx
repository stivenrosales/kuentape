"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ArrowUp, ArrowDown, ArrowUpDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import { FinanzaDetailDialog } from "./finanza-detail-dialog";
import type { FinanzaRow } from "./finanza-table";

export type FinanzaSimpleRow = FinanzaRow;

interface FinanzaTableSimpleProps {
  data: FinanzaSimpleRow[];
  total?: number;
  page?: number;
  pageSize?: number;
}

type SortKey = "tipo" | "concepto" | "monto" | "cuenta" | "fecha";
type SortDir = "asc" | "desc";

const TIPO_CONFIG = {
  INGRESO: {
    label: "Ingreso",
    className:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 border-transparent",
  },
  EGRESO: {
    label: "Egreso",
    className:
      "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 border-transparent",
  },
} as const;

function SortableHeader({
  label,
  sortKey,
  currentKey,
  currentDir,
  onSort,
}: {
  label: string;
  sortKey: SortKey;
  currentKey: SortKey;
  currentDir: SortDir;
  onSort: (key: SortKey) => void;
}) {
  const isActive = currentKey === sortKey;
  return (
    <th
      className={cn(
        "px-3 py-2.5 text-left text-[10px] uppercase tracking-wider font-medium cursor-pointer select-none transition-colors hover:text-foreground align-middle",
        isActive ? "text-foreground" : "text-muted-foreground"
      )}
      onClick={() => onSort(sortKey)}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        {isActive ? (
          currentDir === "asc" ? (
            <ArrowUp className="h-3 w-3" />
          ) : (
            <ArrowDown className="h-3 w-3" />
          )
        ) : (
          <ArrowUpDown className="h-3 w-3 opacity-30" />
        )}
      </span>
    </th>
  );
}

export function FinanzaTableSimple({
  data,
  total = 0,
  page = 1,
  pageSize = 25,
}: FinanzaTableSimpleProps) {
  const router = useRouter();
  const totalPages = Math.ceil(total / pageSize);

  const [sortKey, setSortKey] = React.useState<SortKey>("fecha");
  const [sortDir, setSortDir] = React.useState<SortDir>("desc");
  const [selected, setSelected] = React.useState<FinanzaSimpleRow | null>(null);

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  function sortItems(items: FinanzaSimpleRow[]): FinanzaSimpleRow[] {
    return [...items].sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case "tipo":
          cmp = a.tipo.localeCompare(b.tipo);
          break;
        case "concepto":
          cmp = a.concepto.localeCompare(b.concepto);
          break;
        case "monto":
          cmp = a.monto - b.monto;
          break;
        case "cuenta":
          cmp = a.cuenta.nombre.localeCompare(b.cuenta.nombre);
          break;
        case "fecha":
          cmp = new Date(a.fecha).getTime() - new Date(b.fecha).getTime();
          break;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
  }

  function goToPage(p: number) {
    const params = new URLSearchParams(window.location.search);
    params.set("page", String(p));
    router.push(`?${params.toString()}`);
  }

  const sorted = sortItems(data);

  return (
    <>
      <div className="rounded-lg border border-border bg-card shadow-sm overflow-hidden">
        <table className="w-full text-sm border-collapse" style={{ tableLayout: "fixed" }}>
          <colgroup>
            <col style={{ width: "10%" }} />
            <col style={{ width: "34%" }} />
            <col style={{ width: "18%" }} />
            <col style={{ width: "18%" }} />
            <col style={{ width: "20%" }} />
          </colgroup>
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <SortableHeader
                label="Tipo"
                sortKey="tipo"
                currentKey={sortKey}
                currentDir={sortDir}
                onSort={handleSort}
              />
              <SortableHeader
                label="Concepto"
                sortKey="concepto"
                currentKey={sortKey}
                currentDir={sortDir}
                onSort={handleSort}
              />
              <SortableHeader
                label="Monto"
                sortKey="monto"
                currentKey={sortKey}
                currentDir={sortDir}
                onSort={handleSort}
              />
              <SortableHeader
                label="Cuenta"
                sortKey="cuenta"
                currentKey={sortKey}
                currentDir={sortDir}
                onSort={handleSort}
              />
              <SortableHeader
                label="Fecha"
                sortKey="fecha"
                currentKey={sortKey}
                currentDir={sortDir}
                onSort={handleSort}
              />
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50">
            {sorted.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="py-12 text-center text-sm text-muted-foreground"
                >
                  No hay transacciones registradas.
                </td>
              </tr>
            ) : (
              sorted.map((row, i) => (
                <tr
                  key={row.id}
                  onClick={() => setSelected(row)}
                  className={cn(
                    "cursor-pointer transition-colors hover:bg-primary/5",
                    i % 2 === 0 ? "bg-muted/10" : "bg-background"
                  )}
                >
                  <td className="px-3 py-2">
                    <Badge className={`text-[10px] ${TIPO_CONFIG[row.tipo].className}`}>
                      {TIPO_CONFIG[row.tipo].label}
                    </Badge>
                  </td>
                  <td className="px-3 py-2">
                    <p className="text-xs font-medium truncate">{row.concepto}</p>
                    {row.servicio && (
                      <p className="text-[10px] text-muted-foreground truncate">
                        {row.servicio.persona.razonSocial}
                      </p>
                    )}
                  </td>
                  <td className="px-3 py-2">
                    <span
                      className={cn(
                        "font-mono text-xs font-semibold tabular-nums",
                        row.tipo === "INGRESO"
                          ? "text-emerald-700 dark:text-emerald-400"
                          : "text-red-700 dark:text-red-400"
                      )}
                    >
                      {row.tipo === "EGRESO" ? "-" : "+"}
                      {formatCurrency(row.monto)}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-xs text-muted-foreground truncate">
                    {row.cuenta.nombre}
                  </td>
                  <td className="px-3 py-2 text-xs text-muted-foreground whitespace-nowrap">
                    {formatDate(row.fecha)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-3 py-2 border-t border-border text-xs text-muted-foreground">
            <span>
              Página {page} de {totalPages} ({total} registros)
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => goToPage(1)}
                disabled={page <= 1}
                className="px-2 py-1 rounded hover:bg-muted disabled:opacity-30"
              >
                «
              </button>
              <button
                onClick={() => goToPage(page - 1)}
                disabled={page <= 1}
                className="px-2 py-1 rounded hover:bg-muted disabled:opacity-30"
              >
                ‹
              </button>
              <button
                onClick={() => goToPage(page + 1)}
                disabled={page >= totalPages}
                className="px-2 py-1 rounded hover:bg-muted disabled:opacity-30"
              >
                ›
              </button>
              <button
                onClick={() => goToPage(totalPages)}
                disabled={page >= totalPages}
                className="px-2 py-1 rounded hover:bg-muted disabled:opacity-30"
              >
                »
              </button>
            </div>
          </div>
        )}
      </div>

      {selected && (
        <FinanzaDetailDialog
          finanza={selected}
          onClose={() => setSelected(null)}
        />
      )}
    </>
  );
}

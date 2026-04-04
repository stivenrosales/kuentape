"use client";

import * as React from "react";
import { DownloadIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FinanzaPdfDialog } from "./finanza-pdf-dialog";
import type { FinanzaRow } from "./finanza-table";

interface Props {
  data: FinanzaRow[];
  kpis: { totalIngresos: number; totalEgresos: number; utilidad: number; deudaTotal: number };
  cobradoPorCuenta: { id: string; nombre: string; banco: string; tipo: string; montoCobrado: number }[];
  anio: number;
  mes: number;
}

export function FinanzaPdfButton({ data, kpis, cobradoPorCuenta, anio, mes }: Props) {
  const [open, setOpen] = React.useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)} size="sm">
        <DownloadIcon className="mr-1.5 size-4" />
        Descargar PDF
      </Button>
      <FinanzaPdfDialog
        open={open}
        onOpenChange={setOpen}
        data={data}
        kpis={kpis}
        cobradoPorCuenta={cobradoPorCuenta}
        anio={anio}
        mes={mes}
      />
    </>
  );
}

"use client";

import * as React from "react";
import { ServicioListFilters } from "./servicio-list-filters";
import type { ServicioListItem } from "../queries-list";

// Lazy import to avoid loading PDF code in the main bundle
const ServicioPdfDialog = React.lazy(() =>
  import("./servicio-pdf-dialog").then((m) => ({ default: m.ServicioPdfDialog }))
);

interface Props {
  tiposServicio: { id: string; nombre: string }[];
  contadores?: { id: string; nombre: string; apellido: string }[];
  isAdmin: boolean;
  periodoDefault: string;
  servicios: ServicioListItem[];
  periodoLabel: string;
}

export function ServicioFiltersWithPdf({
  tiposServicio,
  contadores,
  isAdmin,
  periodoDefault,
  servicios,
  periodoLabel,
}: Props) {
  const [pdfOpen, setPdfOpen] = React.useState(false);

  return (
    <>
      <ServicioListFilters
        tiposServicio={tiposServicio}
        contadores={isAdmin ? contadores : undefined}
        isAdmin={isAdmin}
        periodoDefault={periodoDefault}
        onPdfClick={isAdmin ? () => setPdfOpen(true) : undefined}
      />

      {pdfOpen && (
        <React.Suspense fallback={null}>
          <ServicioPdfDialog
            open={pdfOpen}
            onOpenChange={setPdfOpen}
            servicios={servicios}
            periodoLabel={periodoLabel}
          />
        </React.Suspense>
      )}
    </>
  );
}

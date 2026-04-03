"use client";

import * as React from "react";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { TipoServicioTable, type TipoServicioRow } from "./tipo-servicio-table";
import { TipoServicioDialog } from "./tipo-servicio-dialog";

interface TiposServicioClientProps {
  data: TipoServicioRow[];
}

export function TiposServicioClient({ data }: TiposServicioClientProps) {
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<TipoServicioRow | null>(null);

  function handleEdit(row: TipoServicioRow) {
    setEditing(row);
    setDialogOpen(true);
  }

  function handleNew() {
    setEditing(null);
    setDialogOpen(true);
  }

  function handleDialogClose(open: boolean) {
    setDialogOpen(open);
    if (!open) setEditing(null);
  }

  return (
    <>
      <div className="flex justify-end">
        <Button onClick={handleNew} className="gap-2">
          <Plus className="size-4" />
          Nuevo Tipo
        </Button>
      </div>

      <TipoServicioTable data={data} onEdit={handleEdit} />

      <TipoServicioDialog
        open={dialogOpen}
        onOpenChange={handleDialogClose}
        editingItem={editing}
      />
    </>
  );
}

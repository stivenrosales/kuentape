"use client";

import * as React from "react";
import { ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LeadConversionDialog } from "./lead-conversion-dialog";
import type { Regimen } from "@prisma/client";

interface LeadData {
  id: string;
  nombre: string;
  apellido: string;
  dni: string | null;
  celular: string;
  email: string | null;
  regimen: Regimen | null;
  numTrabajadores: number | null;
}

interface StaffOption {
  id: string;
  nombre: string;
  apellido: string;
}

interface Props {
  lead: LeadData;
  staff: StaffOption[];
}

export function LeadConversionDialogTrigger({ lead, staff }: Props) {
  const [open, setOpen] = React.useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <ArrowUpRight className="h-4 w-4" />
        Convertir a cliente
      </Button>
      <LeadConversionDialog
        open={open}
        onOpenChange={setOpen}
        lead={lead}
        staff={staff}
      />
    </>
  );
}

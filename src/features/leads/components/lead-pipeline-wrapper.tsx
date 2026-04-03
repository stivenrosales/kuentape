"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { LeadPipeline } from "./lead-pipeline";
import type { EstadoLead } from "@prisma/client";

interface LeadPipelineWrapperProps {
  counts: Record<EstadoLead, number>;
  activeEstado?: EstadoLead;
}

export function LeadPipelineWrapper({
  counts,
  activeEstado,
}: LeadPipelineWrapperProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function handleEstadoClick(estado: EstadoLead | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (estado) {
      params.set("estado", estado);
    } else {
      params.delete("estado");
    }
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <LeadPipeline
      counts={counts}
      activeEstado={activeEstado ?? null}
      onEstadoClick={handleEstadoClick}
    />
  );
}

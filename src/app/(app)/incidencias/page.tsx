import { AlertCircle } from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/empty-state";
import { requireAuth } from "@/lib/auth-guard";
import { getIncidencias } from "@/features/incidencias/queries";
import { IncidenciaTableSimple } from "@/features/incidencias/components/incidencia-table-simple";
import { IncidenciaFilters } from "@/features/incidencias/components/incidencia-filters";
import { NuevaIncidenciaDialog } from "@/features/incidencias/components/nueva-incidencia-dialog";
import { getPersonasActivas, getContadoresActivos } from "@/features/servicios/queries";
import type { Prioridad, EstadoIncidencia } from "@prisma/client";

interface SearchParams {
  contadorId?: string;
  prioridad?: string;
  estado?: string;
  periodo?: string;
  search?: string;
  page?: string;
}

export default async function IncidenciasPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const session = await requireAuth();
  const role = (session.user as any).role as string;
  const isAdmin = role === "GERENCIA" || role === "ADMINISTRADOR";

  const sp = await searchParams;

  const userId = (session.user as any).id as string;
  const isContador = role === "CONTADOR";

  const [contadores, personas] = await Promise.all([
    getContadoresActivos(),
    getPersonasActivas(),
  ]);

  const { incidencias, total } = await getIncidencias({
    contadorId: sp.contadorId,
    prioridad: sp.prioridad as Prioridad | undefined,
    estado: sp.estado as EstadoIncidencia | undefined,
    periodo: sp.periodo,
    search: sp.search,
    page: sp.page ? Number(sp.page) : 1,
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Incidencias"
        description={`${total} incidencia(s) encontrada(s)`}
      >
        <NuevaIncidenciaDialog
          personas={personas as any}
          contadores={contadores}
          currentUserId={userId}
          isContador={isContador}
        />
      </PageHeader>

      <IncidenciaFilters contadores={contadores} isAdmin={isAdmin} />

      {incidencias.length === 0 ? (
        <EmptyState
          icon={<AlertCircle className="size-6" />}
          title="Sin incidencias"
          message="No se encontraron incidencias con los filtros actuales."
        />
      ) : (
        <IncidenciaTableSimple data={incidencias as any} />
      )}
    </div>
  );
}

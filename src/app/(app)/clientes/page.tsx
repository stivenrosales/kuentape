import { Users } from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/empty-state";
import { requireAuth } from "@/lib/auth-guard";
import { getPersonas, getContadoresActivos } from "@/features/personas/queries";
import { PersonaTable } from "@/features/personas/components/persona-table";
import { PersonaFilters } from "@/features/personas/components/persona-filters";
import { NuevoClienteDialog } from "@/features/personas/components/nuevo-cliente-dialog";
import type { TipoPersona, Regimen, EstadoPersona } from "@prisma/client";

interface SearchParams {
  search?: string;
  tipoPersona?: string;
  regimen?: string;
  estado?: string;
  contadorAsignadoId?: string;
  page?: string;
}

export default async function ClientesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const session = await requireAuth();
  const role = (session.user as any).role as string;
  const canManage = role === "GERENCIA" || role === "ADMINISTRADOR";

  const sp = await searchParams;

  const contadores = canManage ? await getContadoresActivos() : [];

  const { personas, total } = await getPersonas({
    search: sp.search,
    tipoPersona: sp.tipoPersona as TipoPersona | undefined,
    regimen: sp.regimen as Regimen | undefined,
    estado: (sp.estado as EstadoPersona | undefined) ?? "ACTIVO",
    contadorAsignadoId: sp.contadorAsignadoId,
    page: sp.page ? Number(sp.page) : 1,
    pageSize: 15,
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Clientes" description={`${total} cliente(s) encontrado(s)`}>
        {canManage && <NuevoClienteDialog contadores={contadores} />}
      </PageHeader>

      <PersonaFilters isAdmin={canManage} contadores={contadores} />

      {personas.length === 0 ? (
        <EmptyState
          icon={<Users className="size-6" />}
          title="Sin clientes"
          message="No se encontraron clientes con los filtros actuales."
        />
      ) : (
        <PersonaTable data={personas as any} total={total} page={sp.page ? Number(sp.page) : 1} pageSize={15} />
      )}
    </div>
  );
}

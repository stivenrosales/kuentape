import Link from "next/link";
import { Archive } from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/empty-state";
import { requireAuth } from "@/lib/auth-guard";
import { getServiciosArchivados } from "@/features/servicios/queries";
import { ServicioTable } from "@/features/servicios/components/servicio-table";

interface SearchParams {
  tipoServicioId?: string;
  mes?: string;
  anio?: string;
  contadorId?: string;
  personaId?: string;
  search?: string;
  page?: string;
}

export default async function ServiciosArchivadosPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const session = await requireAuth();
  const role = (session.user as any).role as string;
  const canDesarchivar = role === "GERENCIA";

  const sp = await searchParams;

  const { servicios, total } = await getServiciosArchivados({
    tipoServicioId: sp.tipoServicioId,
    mes: sp.mes ? parseInt(sp.mes) : undefined,
    anio: sp.anio ? parseInt(sp.anio) : undefined,
    contadorId: sp.contadorId,
    personaId: sp.personaId,
    search: sp.search,
    page: sp.page ? Number(sp.page) : 1,
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Servicios Archivados"
        description={`${total} servicio(s) archivado(s)`}
      >
        <Link href="/servicios" className="inline-flex items-center rounded-lg border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors">
          Volver a Servicios
        </Link>
      </PageHeader>

      {servicios.length === 0 ? (
        <EmptyState
          icon={<Archive className="size-6" />}
          title="Sin servicios archivados"
          message="No se encontraron servicios archivados."
        />
      ) : (
        <ServicioTable
          data={servicios as any}
          canArchivar={false}
          showDesarchivar={canDesarchivar}
        />
      )}
    </div>
  );
}

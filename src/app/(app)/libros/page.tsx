import { BookOpen } from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/empty-state";
import { requireAuth } from "@/lib/auth-guard";
import { getLibros, getLibrosStats } from "@/features/libros/queries";
import { LibrosClient } from "@/features/libros/components/libros-client";
import { GenerarLibrosButton } from "@/features/libros/components/generar-libros-button";

interface SearchParams {
  completado?: string;
  tipoLibro?: string;
  mes?: string;
  anio?: string;
  personaId?: string;
  contadorId?: string;
  page?: string;
}

export default async function LibrosPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const session = await requireAuth();
  const role = (session.user as any).role as string;
  const isAdmin = role === "GERENCIA" || role === "ADMINISTRADOR";

  const sp = await searchParams;
  const anio = sp.anio ? parseInt(sp.anio) : new Date().getFullYear();
  const mes = sp.mes ? parseInt(sp.mes) : undefined;

  const completadoFilter =
    sp.completado === "true"
      ? true
      : sp.completado === "false"
        ? false
        : undefined;

  const [{ libros, total }, stats] = await Promise.all([
    getLibros({
      completado: completadoFilter,
      tipoLibro: sp.tipoLibro,
      mes,
      anio,
      personaId: sp.personaId,
      contadorId: sp.contadorId,
      page: sp.page ? Number(sp.page) : 1,
    }),
    getLibrosStats(anio),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Libros Contables"
        description={`${total} libro(s) encontrado(s) · Año ${anio}`}
      >
        {isAdmin && <GenerarLibrosButton />}
      </PageHeader>

      {libros.length === 0 && !sp.tipoLibro && !sp.mes ? (
        <EmptyState
          icon={<BookOpen className="size-6" />}
          title="Sin libros contables"
          message="No se encontraron libros contables para el período seleccionado."
        />
      ) : (
        <LibrosClient
          data={libros as any}
          total={stats.total}
          completados={stats.completados}
          pendientes={stats.pendientes}
          searchParams={{
            completado: sp.completado,
            tipoLibro: sp.tipoLibro,
            mes: sp.mes,
            anio: String(anio),
            personaId: sp.personaId,
          }}
        />
      )}
    </div>
  );
}

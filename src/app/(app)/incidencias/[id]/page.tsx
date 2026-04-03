import { notFound } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { requireAuth } from "@/lib/auth-guard";
import { getIncidenciaDetail } from "@/features/incidencias/queries";
import { IncidenciaDetailClient } from "@/features/incidencias/components/incidencia-detail-client";

export default async function IncidenciaDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireAuth();
  const role = (session.user as any).role as string;
  const canEdit =
    role === "GERENCIA" || role === "ADMINISTRADOR" || role === "CONTADOR";

  const { id } = await params;
  const incidencia = await getIncidenciaDetail(id);

  if (!incidencia) notFound();

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <PageHeader
        title={incidencia.titulo}
        description={`${incidencia.persona.razonSocial} · Creada el ${new Date(incidencia.createdAt).toLocaleDateString("es-PE", { timeZone: "America/Lima" })}`}
      />

      <IncidenciaDetailClient incidencia={incidencia as any} canEdit={canEdit} />
    </div>
  );
}

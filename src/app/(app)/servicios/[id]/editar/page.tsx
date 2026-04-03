import { notFound } from "next/navigation";

import { PageHeader } from "@/components/layout/page-header";
import { requireAuth } from "@/lib/auth-guard";
import {
  getServicioDetail,
  getTiposServicio,
  getPersonasActivas,
  getContadoresActivos,
} from "@/features/servicios/queries";
import { ServicioForm } from "@/features/servicios/components/servicio-form";

export default async function EditarServicioPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireAuth();
  const role = (session.user as any).role as string;
  const userId = (session.user as any).id as string;
  const isContador = role === "CONTADOR";

  const { id } = await params;

  const [servicio, tiposServicio, personas, contadores] = await Promise.all([
    getServicioDetail(id),
    getTiposServicio(),
    getPersonasActivas(),
    getContadoresActivos(),
  ]);

  if (!servicio) notFound();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        title="Editar Servicio"
        description={servicio.persona.razonSocial}
      />

      <ServicioForm
        mode="edit"
        servicioId={servicio.id}
        defaultValues={{
          personaId: servicio.personaId,
          tipoServicioId: servicio.tipoServicioId,
          contadorId: servicio.contadorId,
          periodo: servicio.periodo ?? undefined,
          baseImponible: servicio.baseImponible,
          noGravado: servicio.noGravado,
          honorarios: servicio.honorarios,
          descuento: servicio.descuento,
          notas: servicio.notas ?? undefined,
        }}
        tiposServicio={tiposServicio}
        personas={personas}
        contadores={contadores}
        currentUserId={userId}
        isContador={isContador}
      />
    </div>
  );
}

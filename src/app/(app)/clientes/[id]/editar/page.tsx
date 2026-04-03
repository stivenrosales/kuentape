import { notFound, redirect } from "next/navigation";

import { PageHeader } from "@/components/layout/page-header";
import { requireAuth } from "@/lib/auth-guard";
import { getPersonaDetail, getContadoresActivos } from "@/features/personas/queries";
import { PersonaForm } from "@/features/personas/components/persona-form";

export default async function EditarClientePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await requireAuth();
  const role = (session.user as any).role as string;

  const allowedRoles = ["GERENCIA", "ADMINISTRADOR", "CONTADOR"];
  if (!allowedRoles.includes(role)) {
    redirect(`/clientes/${id}`);
  }

  const [persona, contadores] = await Promise.all([
    getPersonaDetail(id),
    getContadoresActivos(),
  ]);

  if (!persona) notFound();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Editar Cliente"
        description={persona.razonSocial}
      />
      <PersonaForm
        mode="edit"
        personaId={id}
        contadores={contadores}
        defaultValues={{
          razonSocial: persona.razonSocial,
          ruc: persona.ruc,
          tipoPersona: persona.tipoPersona,
          regimen: persona.regimen,
          direccion: persona.direccion ?? undefined,
          telefono: persona.telefono ?? undefined,
          email: persona.email ?? undefined,
          representanteNombre: persona.representanteNombre ?? undefined,
          representanteDni: persona.representanteDni ?? undefined,
          representanteTelefono: persona.representanteTelefono ?? undefined,
          contadorAsignadoId: persona.contadorAsignadoId,
          detracciones: persona.detracciones,
          planilla: persona.planilla,
          numTrabajadores: persona.numTrabajadores ?? undefined,
          tipoContabilidad: persona.tipoContabilidad,
          partidaElectronica: persona.partidaElectronica ?? undefined,
        }}
      />
    </div>
  );
}

import { PageHeader } from "@/components/layout/page-header";
import { requireAuth } from "@/lib/auth-guard";
import { getPersonasActivas, getContadoresActivos } from "@/features/servicios/queries";
import { IncidenciaForm } from "@/features/incidencias/components/incidencia-form";

export default async function NuevaIncidenciaPage() {
  const session = await requireAuth();
  const role = (session.user as any).role as string;
  const userId = (session.user as any).id as string;
  const isContador = role === "CONTADOR";

  const [personas, contadores] = await Promise.all([
    getPersonasActivas(),
    getContadoresActivos(),
  ]);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        title="Nueva Incidencia"
        description="Registrá una nueva incidencia para una empresa"
      />

      <IncidenciaForm
        mode="create"
        personas={personas}
        contadores={contadores}
        currentUserId={userId}
        isContador={isContador}
      />
    </div>
  );
}

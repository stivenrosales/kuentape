import { PageHeader } from "@/components/layout/page-header";
import { requireAuth } from "@/lib/auth-guard";
import { getTiposServicio, getPersonasActivas, getContadoresActivos } from "@/features/servicios/queries";
import { ServicioForm } from "@/features/servicios/components/servicio-form";

export default async function NuevoServicioPage() {
  const session = await requireAuth();
  const role = (session.user as any).role as string;
  const userId = (session.user as any).id as string;
  const isContador = role === "CONTADOR";

  const [tiposServicio, personas, contadores] = await Promise.all([
    getTiposServicio(),
    getPersonasActivas(),
    getContadoresActivos(),
  ]);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        title="Nuevo Servicio"
        description="Registrar un nuevo servicio contable"
      />

      <ServicioForm
        mode="create"
        tiposServicio={tiposServicio}
        personas={personas}
        contadores={contadores}
        currentUserId={userId}
        isContador={isContador}
      />
    </div>
  );
}

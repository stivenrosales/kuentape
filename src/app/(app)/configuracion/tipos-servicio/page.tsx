import { PageHeader } from "@/components/layout/page-header";
import { requireRole } from "@/lib/auth-guard";
import { getTodosLosTiposServicio } from "@/features/servicios/queries";
import { TiposServicioClient } from "@/features/servicios/components/tipos-servicio-client";

export default async function TiposServicioPage() {
  await requireRole(["GERENCIA"]);

  const tipos = await getTodosLosTiposServicio();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tipos de Servicio"
        description="Configurar los tipos de servicio disponibles"
      />

      <TiposServicioClient data={tipos} />
    </div>
  );
}

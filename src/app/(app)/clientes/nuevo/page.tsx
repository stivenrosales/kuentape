import { redirect } from "next/navigation";

import { PageHeader } from "@/components/layout/page-header";
import { requireAuth } from "@/lib/auth-guard";
import { getContadoresActivos } from "@/features/personas/queries";
import { PersonaForm } from "@/features/personas/components/persona-form";

export default async function NuevoClientePage() {
  const session = await requireAuth();
  const role = (session.user as any).role as string;

  if (role !== "GERENCIA" && role !== "ADMINISTRADOR") {
    redirect("/clientes");
  }

  const contadores = await getContadoresActivos();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Nuevo Cliente"
        description="Completá los datos del nuevo cliente para registrarlo en el sistema."
      />
      <PersonaForm mode="create" contadores={contadores} />
    </div>
  );
}

import { requireRole } from "@/lib/auth-guard";
import { PageHeader } from "@/components/layout/page-header";
import { prisma } from "@/lib/prisma";
import { LeadForm } from "@/features/leads/components/lead-form";

export default async function NuevoProspectoPage() {
  await requireRole(["GERENCIA", "ADMINISTRADOR", "VENTAS"]);

  const staff = await prisma.user.findMany({
    where: { activo: true },
    select: { id: true, nombre: true, apellido: true },
    orderBy: { nombre: "asc" },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Nuevo Prospecto"
        description="Registrá un nuevo cliente potencial"
      />
      <div className="max-w-2xl">
        <LeadForm mode="create" staff={staff} />
      </div>
    </div>
  );
}

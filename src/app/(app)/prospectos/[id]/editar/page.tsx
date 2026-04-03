import { notFound } from "next/navigation";

import { requireRole } from "@/lib/auth-guard";
import { PageHeader } from "@/components/layout/page-header";
import { prisma } from "@/lib/prisma";
import { getLeadDetail } from "@/features/leads/queries";
import { LeadForm } from "@/features/leads/components/lead-form";

export default async function EditarProspectoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireRole(["GERENCIA", "ADMINISTRADOR", "VENTAS"]);
  const { id } = await params;

  const [lead, staff] = await Promise.all([
    getLeadDetail(id),
    prisma.user.findMany({
      where: { activo: true },
      select: { id: true, nombre: true, apellido: true },
      orderBy: { nombre: "asc" },
    }),
  ]);

  if (!lead) notFound();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Editar Prospecto"
        description={`${lead.nombre} ${lead.apellido}`}
      />
      <div className="max-w-2xl">
        <LeadForm
          mode="edit"
          leadId={id}
          staff={staff}
          defaultValues={{
            nombre: lead.nombre,
            apellido: lead.apellido,
            dni: lead.dni ?? "",
            celular: lead.celular,
            email: lead.email ?? "",
            regimen: lead.regimen ?? undefined,
            rubro: lead.rubro ?? "",
            numTrabajadores: lead.numTrabajadores ?? undefined,
            notas: lead.notas ?? "",
            asignadoAId: lead.asignadoAId ?? "",
          }}
        />
      </div>
    </div>
  );
}

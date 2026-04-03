import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/layout/page-header";
import { requireAuth } from "@/lib/auth-guard";
import {
  getServicioDetail,
  getCuentasBancarias,
} from "@/features/servicios/queries";
import { getStaffList } from "@/features/staff/queries";
import { ServicioDetailClient } from "@/features/servicios/components/servicio-detail-client";
import type { CategoriaServicio } from "@prisma/client";

const CATEGORIA_BADGE: Record<CategoriaServicio, { className: string }> = {
  MENSUAL: {
    className:
      "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border-transparent",
  },
  ANUAL: {
    className:
      "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 border-transparent",
  },
  TRAMITE: {
    className:
      "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 border-transparent",
  },
  ASESORIA: {
    className:
      "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300 border-transparent",
  },
  CONSTITUCION: {
    className:
      "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300 border-transparent",
  },
  REGULARIZACION: {
    className:
      "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300 border-transparent",
  },
  MODIF_ESTATUTO: {
    className:
      "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 border-transparent",
  },
  OTROS: {
    className:
      "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 border-transparent",
  },
};

export default async function ServicioDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireAuth();
  const role = (session.user as any).role as string;
  const canArchivar = role === "GERENCIA";
  const canEdit =
    role === "GERENCIA" || role === "ADMINISTRADOR" || role === "CONTADOR";

  const { id } = await params;
  const [servicio, cuentas, staffList] = await Promise.all([
    getServicioDetail(id),
    getCuentasBancarias(),
    getStaffList(),
  ]);

  const equipo = staffList
    .filter((s) => s.activo)
    .map((s) => ({ id: s.id, nombre: s.nombre, apellido: s.apellido }));

  if (!servicio) notFound();

  const categoriaCfg = CATEGORIA_BADGE[servicio.tipoServicio.categoria];

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <PageHeader
        title={servicio.persona.razonSocial}
        description={`RUC: ${servicio.persona.ruc}`}
      >
        <Badge className={categoriaCfg.className}>
          {servicio.tipoServicio.nombre}
        </Badge>
      </PageHeader>

      <ServicioDetailClient
        servicio={servicio as any}
        cuentas={cuentas}
        equipo={equipo}
        canArchivar={canArchivar}
        canEdit={canEdit}
      />
    </div>
  );
}

import { notFound } from "next/navigation";

import { ClienteDetailClient } from "@/features/personas/components/cliente-detail-client";
import { requireAuth } from "@/lib/auth-guard";
import { getPersonaDetail } from "@/features/personas/queries";
import { prisma } from "@/lib/prisma";

export default async function ClienteDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await requireAuth();
  const role = (session.user as any).role as string;
  const canManage = role === "GERENCIA" || role === "ADMINISTRADOR" || role === "CONTADOR";

  const persona = await getPersonaDetail(id);
  if (!persona) notFound();

  const [servicios, incidencias, libros] = await Promise.all([
    prisma.servicio.findMany({
      where: { personaId: id },
      select: {
        id: true,
        periodo: true,
        precioFinal: true,
        montoCobrado: true,
        montoRestante: true,
        estadoCobranza: true,
        tipoServicio: { select: { nombre: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.incidencia.findMany({
      where: { personaId: id },
      select: {
        id: true,
        titulo: true,
        prioridad: true,
        estado: true,
        periodo: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.libro.findMany({
      where: { personaId: id },
      select: {
        id: true,
        tipoLibro: true,
        anio: true,
        mes: true,
        completado: true,
      },
      orderBy: [{ anio: "desc" }, { mes: "asc" }, { tipoLibro: "asc" }],
    }),
  ]);

  return (
    <ClienteDetailClient
      persona={persona}
      servicios={servicios}
      incidencias={incidencias}
      libros={libros}
      canManage={canManage}
    />
  );
}

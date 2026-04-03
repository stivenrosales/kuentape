import { prisma } from "@/lib/prisma";

export async function getStaffList() {
  return prisma.user.findMany({
    orderBy: { nombre: "asc" },
    select: {
      id: true,
      nombre: true,
      apellido: true,
      email: true,
      role: true,
      telefono: true,
      activo: true,
      createdAt: true,
      _count: {
        select: {
          servicios: true,
          personasAsignadas: true,
        },
      },
    },
  });
}

export async function getStaffDetail(id: string) {
  return prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      nombre: true,
      apellido: true,
      email: true,
      role: true,
      telefono: true,
      activo: true,
      createdAt: true,
      _count: {
        select: {
          servicios: true,
          personasAsignadas: true,
        },
      },
    },
  });
}

export async function getStaffPerformance(
  id: string,
  anio: number,
  mes: number
) {
  const periodo = `${anio}-${String(mes).padStart(2, "0")}`;

  const result = await prisma.servicio.aggregate({
    where: {
      contadorId: id,
      periodo,
    },
    _sum: {
      honorarios: true,
      montoCobrado: true,
    },
    _count: {
      id: true,
    },
  });

  const totalHonorarios = result._sum.honorarios ?? 0;
  const totalCobrado = result._sum.montoCobrado ?? 0;
  const porcentajeCobranza =
    totalHonorarios > 0 ? totalCobrado / totalHonorarios : 0;

  return {
    periodo,
    totalHonorarios,
    totalCobrado,
    porcentajeCobranza,
    totalServicios: result._count.id,
  };
}

export async function getStaffRecentServicios(id: string, limit = 10) {
  return prisma.servicio.findMany({
    where: { contadorId: id },
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true,
      periodo: true,
      honorarios: true,
      montoCobrado: true,
      estadoCobranza: true,
      estado: true,
      createdAt: true,
      persona: {
        select: {
          id: true,
          razonSocial: true,
          ruc: true,
        },
      },
      tipoServicio: {
        select: {
          nombre: true,
          categoria: true,
        },
      },
    },
  });
}

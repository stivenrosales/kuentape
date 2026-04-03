import { prisma } from "@/lib/prisma";
import { requireAuth, scopedWhere } from "@/lib/auth-guard";

export interface ListFilters {
  periodo: string; // "2026-03"
  tipoServicioId?: string;
  contadorId?: string;
  search?: string;
}

export interface ServicioListItem {
  id: string;
  periodo: string | null;
  baseImponible: number;
  igv: number;
  noGravado: number;
  totalImponible: number;
  honorarios: number;
  descuento: number;
  precioFinal: number;
  montoCobrado: number;
  montoRestante: number;
  estadoCobranza: string;
  estadoTrabajo: string;
  estado: string;
  notas: string | null;
  persona: { id: string; razonSocial: string; tipoPersona: string; regimen: string };
  tipoServicio: { id: string; nombre: string; categoria: string };
  contador: { id: string; nombre: string; apellido: string };
}

const listInclude = {
  persona: {
    select: { id: true, razonSocial: true, tipoPersona: true, regimen: true },
  },
  tipoServicio: {
    select: { id: true, nombre: true, categoria: true },
  },
  contador: {
    select: { id: true, nombre: true, apellido: true },
  },
};

function buildListWhere(filters: ListFilters, role: string, userId: string) {
  const baseWhere: Record<string, any> = {
    periodo: filters.periodo,
    estado: { not: "ARCHIVADO" as const },
  };

  if (filters.tipoServicioId) {
    baseWhere.tipoServicioId = filters.tipoServicioId;
  }

  if (filters.contadorId) {
    baseWhere.contadorId = filters.contadorId;
  }

  if (filters.search) {
    baseWhere.persona = {
      razonSocial: { contains: filters.search, mode: "insensitive" },
    };
  }

  return scopedWhere(baseWhere, role, userId);
}

/**
 * Returns servicios for the list view, grouped logically:
 * pending first (POR_DECLARAR, DECLARADO, POR_COBRAR with montoRestante > 0),
 * then paid (COBRADO + POR_COBRAR with montoRestante === 0).
 * Order within each group: by empresa name asc.
 */
export async function getServiciosList(filters: ListFilters): Promise<ServicioListItem[]> {
  const session = await requireAuth();
  const role = (session.user as any).role as string;
  const userId = (session.user as any).id as string;

  const where = buildListWhere(filters, role, userId);

  const servicios = await prisma.servicio.findMany({
    where,
    include: listInclude,
    orderBy: [
      { persona: { razonSocial: "asc" } },
    ],
  });

  // Sort: pendientes first (estadoCobranza !== COBRADO), cobrados last
  const pendientes = servicios.filter(
    (s) => s.estadoCobranza !== "COBRADO"
  );
  const cobrados = servicios.filter(
    (s) => s.estadoCobranza === "COBRADO"
  );

  return [...pendientes, ...cobrados] as ServicioListItem[];
}

export interface ServiciosListStats {
  totalCount: number;
  totalHonorarios: number;
  totalCobrado: number;
  totalRestante: number;
  avancePorcentaje: number;
  pendientesCount: number;
  cobradosCount: number;
  pendientesHonorarios: number;
  cobradosHonorarios: number;
}

export async function getServiciosListStats(filters: ListFilters): Promise<ServiciosListStats> {
  const session = await requireAuth();
  const role = (session.user as any).role as string;
  const userId = (session.user as any).id as string;

  const where = buildListWhere(filters, role, userId);

  const [aggregate, byCobranza] = await Promise.all([
    prisma.servicio.aggregate({
      where,
      _count: { _all: true },
      _sum: {
        honorarios: true,
        montoCobrado: true,
        montoRestante: true,
      },
    }),
    prisma.servicio.groupBy({
      by: ["estadoCobranza"],
      where,
      _count: { _all: true },
      _sum: { honorarios: true },
    }),
  ]);

  const totalHonorarios = aggregate._sum.honorarios ?? 0;
  const totalCobrado = aggregate._sum.montoCobrado ?? 0;
  const totalRestante = aggregate._sum.montoRestante ?? 0;
  const totalCount = aggregate._count._all;

  const cobradoGroup = byCobranza.find((g) => g.estadoCobranza === "COBRADO");
  const cobradosCount = cobradoGroup?._count._all ?? 0;
  const cobradosHonorarios = cobradoGroup?._sum.honorarios ?? 0;
  const pendientesCount = totalCount - cobradosCount;
  const pendientesHonorarios = totalHonorarios - cobradosHonorarios;

  return {
    totalCount,
    totalHonorarios,
    totalCobrado,
    totalRestante,
    avancePorcentaje: totalHonorarios > 0 ? Math.round((totalCobrado / totalHonorarios) * 100) : 0,
    pendientesCount,
    cobradosCount,
    pendientesHonorarios,
    cobradosHonorarios,
  };
}

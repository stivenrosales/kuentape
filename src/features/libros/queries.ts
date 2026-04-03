import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-guard";
import { TIPOS_LIBRO } from "./schemas";
import { scopedPersonaWhere } from "@/lib/auth-guard";

export interface LibroFilters {
  completado?: boolean;
  tipoLibro?: string;
  mes?: number;
  anio?: number;
  personaId?: string;
  contadorId?: string;
  page?: number;
  pageSize?: number;
}

export async function getLibros(filters: LibroFilters = {}) {
  const session = await requireAuth();
  const role = (session.user as any).role as string;
  const userId = (session.user as any).id as string;

  const {
    completado,
    tipoLibro,
    mes,
    anio,
    personaId,
    contadorId,
    page = 1,
    pageSize = 50,
  } = filters;

  const baseWhere: Record<string, any> = {};

  if (completado !== undefined) baseWhere.completado = completado;
  if (tipoLibro) baseWhere.tipoLibro = tipoLibro;
  if (mes) baseWhere.mes = mes;
  if (anio) baseWhere.anio = anio;
  if (personaId) baseWhere.personaId = personaId;

  // Scope by contador role: CONTADOR sees only their own clients' libros
  const personaConditions: Record<string, any> = {};
  if (contadorId) personaConditions.contadorAsignadoId = contadorId;

  const scopedPersona = scopedPersonaWhere(personaConditions, role, userId);
  // Only add persona filter if there are actual conditions
  if (Object.keys(scopedPersona).length > 0) {
    baseWhere.persona = scopedPersona;
  }

  const where = baseWhere;

  const [libros, total] = await Promise.all([
    prisma.libro.findMany({
      where,
      include: {
        persona: {
          select: {
            id: true,
            razonSocial: true,
            contadorAsignado: {
              select: { id: true, nombre: true, apellido: true },
            },
          },
        },
      },
      orderBy: [{ anio: "desc" }, { mes: "desc" }, { tipoLibro: "asc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.libro.count({ where }),
  ]);

  return {
    libros,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

export async function getLibrosStats(anio: number) {
  await requireAuth();

  const where = { anio };

  const [total, completados, porMes, completadosPorMes] = await Promise.all([
    prisma.libro.count({ where }),
    prisma.libro.count({ where: { ...where, completado: true } }),
    prisma.libro.groupBy({
      by: ["mes"],
      where,
      _count: { _all: true },
    }),
    prisma.libro.groupBy({
      by: ["mes"],
      where: { ...where, completado: true },
      _count: { _all: true },
    }),
  ]);

  // Merge counts
  const porMesMerged = porMes.map((item) => {
    const completadosMes = completadosPorMes.find((c) => c.mes === item.mes);
    return {
      mes: item.mes,
      total: item._count._all,
      completados: completadosMes?._count._all ?? 0,
    };
  });

  return {
    total,
    completados,
    pendientes: total - completados,
    porMes: porMesMerged,
  };
}

export async function getLibrosCompletionMatrix(anio: number) {
  await requireAuth();

  const libros = await prisma.libro.findMany({
    where: { anio },
    select: {
      id: true,
      personaId: true,
      tipoLibro: true,
      mes: true,
      completado: true,
      persona: { select: { id: true, razonSocial: true } },
    },
    orderBy: [{ mes: "asc" }],
  });

  // Group by persona
  const byPersona: Record<
    string,
    {
      persona: { id: string; razonSocial: string };
      entries: Array<{
        id: string;
        tipoLibro: string;
        mes: number;
        completado: boolean;
      }>;
    }
  > = {};

  for (const libro of libros) {
    if (!byPersona[libro.personaId]) {
      byPersona[libro.personaId] = {
        persona: libro.persona,
        entries: [],
      };
    }
    byPersona[libro.personaId]!.entries.push({
      id: libro.id,
      tipoLibro: libro.tipoLibro,
      mes: libro.mes,
      completado: libro.completado,
    });
  }

  return Object.values(byPersona);
}

import { prisma } from "@/lib/prisma";
import { requireAuth, scopedWhere } from "@/lib/auth-guard";
import type { Prioridad, EstadoIncidencia } from "@prisma/client";

export interface IncidenciaFilters {
  contadorId?: string;
  prioridad?: Prioridad;
  estado?: EstadoIncidencia;
  periodo?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}

export async function getIncidencias(filters: IncidenciaFilters = {}) {
  const session = await requireAuth();
  const role = (session.user as any).role as string;
  const userId = (session.user as any).id as string;

  const { contadorId, prioridad, estado, periodo, search, page = 1, pageSize = 25 } = filters;

  const baseWhere: Record<string, any> = {};

  if (contadorId) baseWhere.contadorId = contadorId;
  if (prioridad) baseWhere.prioridad = prioridad;
  if (estado) baseWhere.estado = estado;
  if (periodo) baseWhere.periodo = periodo;

  if (search) {
    baseWhere.OR = [
      { titulo: { contains: search, mode: "insensitive" } },
      { descripcion: { contains: search, mode: "insensitive" } },
    ];
  }

  const where = scopedWhere(baseWhere, role, userId);

  const [incidencias, total] = await Promise.all([
    prisma.incidencia.findMany({
      where,
      include: {
        persona: { select: { id: true, razonSocial: true } },
        contador: { select: { id: true, nombre: true, apellido: true } },
        _count: { select: { adjuntos: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.incidencia.count({ where }),
  ]);

  return {
    incidencias,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

export async function getIncidenciaDetail(id: string) {
  const session = await requireAuth();
  const role = (session.user as any).role as string;
  const userId = (session.user as any).id as string;

  const baseWhere = { id };
  const where = scopedWhere(baseWhere, role, userId);

  return prisma.incidencia.findFirst({
    where,
    include: {
      persona: { select: { id: true, razonSocial: true, ruc: true } },
      contador: { select: { id: true, nombre: true, apellido: true, email: true } },
      adjuntos: { orderBy: { createdAt: "asc" } },
    },
  });
}

export async function getIncidenciasStats(anio: number, mes?: number) {
  const session = await requireAuth();
  const role = (session.user as any).role as string;
  const userId = (session.user as any).id as string;

  const baseWhere: Record<string, any> = {};

  if (mes) {
    const mesStr = String(mes).padStart(2, "0");
    baseWhere.periodo = `${anio}-${mesStr}`;
  } else {
    baseWhere.periodo = { startsWith: String(anio) };
  }

  const where = scopedWhere(baseWhere, role, userId);

  const [porPrioridad, porEstado] = await Promise.all([
    prisma.incidencia.groupBy({
      by: ["prioridad"],
      where,
      _count: { _all: true },
    }),
    prisma.incidencia.groupBy({
      by: ["estado"],
      where,
      _count: { _all: true },
    }),
  ]);

  return { porPrioridad, porEstado };
}

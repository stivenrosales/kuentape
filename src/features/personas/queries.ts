import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-guard";
import { scopedPersonaWhere } from "@/lib/auth-guard";
import type { EstadoPersona, TipoPersona, Regimen } from "@prisma/client";

export interface PersonaFilters {
  search?: string;
  tipoPersona?: TipoPersona;
  regimen?: Regimen;
  estado?: EstadoPersona;
  contadorAsignadoId?: string;
  page?: number;
  pageSize?: number;
}

export async function getPersonas(filters: PersonaFilters = {}) {
  const session = await requireAuth();
  const role = (session.user as any).role as string;
  const userId = (session.user as any).id as string;

  const {
    search,
    tipoPersona,
    regimen,
    estado,
    contadorAsignadoId,
    page = 1,
    pageSize = 25,
  } = filters;

  const baseWhere: Record<string, any> = {};

  if (search) {
    baseWhere.OR = [
      { razonSocial: { contains: search, mode: "insensitive" } },
      { ruc: { contains: search } },
    ];
  }

  if (tipoPersona) baseWhere.tipoPersona = tipoPersona;
  if (regimen) baseWhere.regimen = regimen;
  if (estado) baseWhere.estado = estado;
  if (contadorAsignadoId) baseWhere.contadorAsignadoId = contadorAsignadoId;

  const where = scopedPersonaWhere(baseWhere, role, userId);

  const [personas, total] = await Promise.all([
    prisma.persona.findMany({
      where,
      include: {
        contadorAsignado: {
          select: { id: true, nombre: true, apellido: true },
        },
        _count: {
          select: {
            servicios: true,
            incidencias: true,
          },
        },
      },
      orderBy: { razonSocial: "asc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.persona.count({ where }),
  ]);

  return {
    personas,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

export async function getPersonaDetail(id: string) {
  const session = await requireAuth();
  const role = (session.user as any).role as string;
  const userId = (session.user as any).id as string;

  const baseWhere = { id };
  const where = scopedPersonaWhere(baseWhere, role, userId);

  const persona = await prisma.persona.findFirst({
    where,
    include: {
      contadorAsignado: {
        select: { id: true, nombre: true, apellido: true, email: true },
      },
      _count: {
        select: {
          servicios: true,
          incidencias: true,
          libros: true,
        },
      },
      servicios: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: {
          id: true,
          createdAt: true,
          estado: true,
          tipoServicio: { select: { nombre: true } },
        },
      },
    },
  });

  return persona;
}

export async function getPersonaStats() {
  const session = await requireAuth();
  const role = (session.user as any).role as string;
  const userId = (session.user as any).id as string;

  const baseWhere = { estado: "ACTIVO" as EstadoPersona };
  const where = scopedPersonaWhere(baseWhere, role, userId);

  const [totalActivos, porTipo, porRegimen] = await Promise.all([
    prisma.persona.count({ where }),
    prisma.persona.groupBy({
      by: ["tipoPersona"],
      where,
      _count: true,
    }),
    prisma.persona.groupBy({
      by: ["regimen"],
      where,
      _count: true,
    }),
  ]);

  return { totalActivos, porTipo, porRegimen };
}

export async function getContadoresActivos() {
  return prisma.user.findMany({
    where: { activo: true, role: { in: ["CONTADOR", "ADMINISTRADOR", "GERENCIA"] } },
    select: { id: true, nombre: true, apellido: true },
    orderBy: [{ apellido: "asc" }, { nombre: "asc" }],
  });
}

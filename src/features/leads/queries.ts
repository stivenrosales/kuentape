import { prisma } from "@/lib/prisma";
import { planillaPrecio } from "@/lib/pricing";
import type { EstadoLead } from "@prisma/client";

export interface LeadFilters {
  estado?: EstadoLead;
  search?: string;
  asignadoAId?: string;
}

export async function getLeads(filters: LeadFilters = {}) {
  const where: Record<string, unknown> = {};

  if (filters.estado) {
    where.estado = filters.estado;
  }

  if (filters.asignadoAId) {
    where.asignadoAId = filters.asignadoAId;
  }

  if (filters.search) {
    where.OR = [
      { nombre: { contains: filters.search, mode: "insensitive" } },
      { apellido: { contains: filters.search, mode: "insensitive" } },
    ];
  }

  return prisma.lead.findMany({
    where,
    include: {
      asignadoA: {
        select: { id: true, nombre: true, apellido: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getLeadDetail(id: string) {
  return prisma.lead.findUnique({
    where: { id },
    include: {
      asignadoA: {
        select: { id: true, nombre: true, apellido: true },
      },
      convertidoA: {
        select: {
          id: true,
          razonSocial: true,
          ruc: true,
          tipoPersona: true,
          regimen: true,
          estado: true,
        },
      },
    },
  });
}

export async function getLeadPipelineCounts() {
  const counts = await prisma.lead.groupBy({
    by: ["estado"],
    _count: { _all: true },
  });

  const result: Record<EstadoLead, number> = {
    NUEVO: 0,
    CONTACTADO: 0,
    COTIZADO: 0,
    CONVERTIDO: 0,
    PERDIDO: 0,
  };

  for (const row of counts) {
    result[row.estado] = row._count._all;
  }

  return result;
}

export async function getLeadCotizacionData(id: string) {
  const lead = await prisma.lead.findUnique({
    where: { id },
    select: {
      id: true,
      nombre: true,
      apellido: true,
      celular: true,
      email: true,
      regimen: true,
      rubro: true,
      numTrabajadores: true,
      notas: true,
    },
  });

  if (!lead) return null;

  const planillaPrecioCalculado =
    lead.numTrabajadores && lead.numTrabajadores > 0
      ? planillaPrecio(lead.numTrabajadores)
      : 0;

  return {
    ...lead,
    planillaPrecioCalculado,
  };
}

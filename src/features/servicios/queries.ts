import { prisma } from "@/lib/prisma";
import { requireAuth, scopedWhere } from "@/lib/auth-guard";
import type { EstadoCobranza, EstadoServicio } from "@prisma/client";

export interface ServicioFilters {
  tipoServicioId?: string;
  mes?: number;
  anio?: number;
  estadoCobranza?: EstadoCobranza;
  estado?: EstadoServicio;
  contadorId?: string;
  personaId?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}

function buildBaseWhere(filters: ServicioFilters, excludeArchivado = true) {
  const {
    tipoServicioId,
    mes,
    anio,
    estadoCobranza,
    estado,
    contadorId,
    personaId,
    search,
  } = filters;

  const baseWhere: Record<string, any> = {};

  if (excludeArchivado && !estado) {
    baseWhere.estado = { not: "ARCHIVADO" };
  } else if (estado) {
    baseWhere.estado = estado;
  }

  if (tipoServicioId) baseWhere.tipoServicioId = tipoServicioId;
  if (estadoCobranza) baseWhere.estadoCobranza = estadoCobranza;
  if (contadorId) baseWhere.contadorId = contadorId;
  if (personaId) baseWhere.personaId = personaId;

  if (anio && mes) {
    const mesStr = String(mes).padStart(2, "0");
    baseWhere.periodo = `${anio}-${mesStr}`;
  } else if (anio) {
    baseWhere.periodo = { startsWith: String(anio) };
  }

  if (search) {
    baseWhere.persona = {
      razonSocial: { contains: search, mode: "insensitive" },
    };
  }

  return baseWhere;
}

const servicioInclude = {
  persona: {
    select: { id: true, razonSocial: true, ruc: true },
  },
  tipoServicio: {
    select: { id: true, nombre: true, categoria: true },
  },
  contador: {
    select: { id: true, nombre: true, apellido: true },
  },
};

export async function getServicios(filters: ServicioFilters = {}) {
  const session = await requireAuth();
  const role = (session.user as any).role as string;
  const userId = (session.user as any).id as string;

  const { page = 1, pageSize = 25 } = filters;
  const baseWhere = buildBaseWhere(filters, true);
  const where = scopedWhere(baseWhere, role, userId);

  const [servicios, total] = await Promise.all([
    prisma.servicio.findMany({
      where,
      include: servicioInclude,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.servicio.count({ where }),
  ]);

  return {
    servicios,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

export async function getServicioDetail(id: string) {
  const session = await requireAuth();
  const role = (session.user as any).role as string;
  const userId = (session.user as any).id as string;

  const baseWhere = { id };
  const where = scopedWhere(baseWhere, role, userId);

  return prisma.servicio.findFirst({
    where,
    include: {
      persona: {
        select: {
          id: true,
          razonSocial: true,
          ruc: true,
          tipoPersona: true,
          regimen: true,
        },
      },
      tipoServicio: {
        select: { id: true, nombre: true, categoria: true, requierePeriodo: true },
      },
      contador: {
        select: { id: true, nombre: true, apellido: true, email: true },
      },
      finanzas: {
        orderBy: { fecha: "desc" },
        include: {
          cuenta: { select: { id: true, nombre: true, banco: true } },
          creadoPor: { select: { id: true, nombre: true, apellido: true } },
        },
      },
      actividades: {
        orderBy: { horaInicio: "desc" },
        include: {
          equipo: { select: { id: true, nombre: true, apellido: true } },
        },
      },
      declaracionAnualDetalles: {
        orderBy: { mes: "asc" },
      },
    },
  });
}

export async function getServiciosArchivados(filters: ServicioFilters = {}) {
  const session = await requireAuth();
  const role = (session.user as any).role as string;
  const userId = (session.user as any).id as string;

  const { page = 1, pageSize = 25 } = filters;
  const baseWhere = buildBaseWhere({ ...filters, estado: "ARCHIVADO" }, false);
  const where = scopedWhere(baseWhere, role, userId);

  const [servicios, total] = await Promise.all([
    prisma.servicio.findMany({
      where,
      include: servicioInclude,
      orderBy: { updatedAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.servicio.count({ where }),
  ]);

  return {
    servicios,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

export async function getTiposServicio() {
  return prisma.tipoServicio.findMany({
    where: { activo: true },
    orderBy: { orden: "asc" },
  });
}

export async function getTodosLosTiposServicio() {
  return prisma.tipoServicio.findMany({
    orderBy: { orden: "asc" },
  });
}

export async function getServiciosSummary(anio: number, mes?: number) {
  const session = await requireAuth();
  const role = (session.user as any).role as string;
  const userId = (session.user as any).id as string;

  const baseWhere: Record<string, any> = {
    estado: { not: "ARCHIVADO" as EstadoServicio },
  };

  if (mes) {
    const mesStr = String(mes).padStart(2, "0");
    baseWhere.periodo = `${anio}-${mesStr}`;
  } else {
    baseWhere.periodo = { startsWith: String(anio) };
  }

  const where = scopedWhere(baseWhere, role, userId);

  const [aggregate, porTipo] = await Promise.all([
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
      by: ["tipoServicioId"],
      where,
      _count: { _all: true },
      _sum: { honorarios: true },
    }),
  ]);

  const tipoIds = porTipo.map((p) => p.tipoServicioId);
  const tipos = await prisma.tipoServicio.findMany({
    where: { id: { in: tipoIds } },
    select: { id: true, nombre: true, categoria: true },
  });

  const tipoMap = Object.fromEntries(tipos.map((t) => [t.id, t]));

  return {
    totalCount: aggregate._count._all,
    totalHonorarios: aggregate._sum.honorarios ?? 0,
    totalCobrado: aggregate._sum.montoCobrado ?? 0,
    totalRestante: aggregate._sum.montoRestante ?? 0,
    porTipo: porTipo.map((p) => ({
      tipo: tipoMap[p.tipoServicioId],
      count: p._count._all,
      totalHonorarios: p._sum.honorarios ?? 0,
    })),
  };
}

export async function getCuentasBancarias() {
  return prisma.cuentaBancaria.findMany({
    where: { activo: true },
    orderBy: { orden: "asc" },
  });
}

export async function getPersonasActivas() {
  return prisma.persona.findMany({
    where: { estado: "ACTIVO" },
    select: { id: true, razonSocial: true, ruc: true },
    orderBy: { razonSocial: "asc" },
  });
}

export async function getContadoresActivos() {
  return prisma.user.findMany({
    where: { activo: true, role: { in: ["CONTADOR", "ADMINISTRADOR", "GERENCIA"] } },
    select: { id: true, nombre: true, apellido: true },
    orderBy: [{ apellido: "asc" }, { nombre: "asc" }],
  });
}

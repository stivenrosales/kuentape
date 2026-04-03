import { prisma } from "@/lib/prisma";
import { getCobranzasPorContador } from "@/features/cobranzas/queries";

// ─── Gerencia / Administrador ─────────────────────────────────────────────────

export async function getDashboardGerencia(anio: number, mes: number) {
  const periodo = `${anio}-${String(mes).padStart(2, "0")}`;
  const fechaInicio = new Date(anio, mes - 1, 1);
  const fechaFin = new Date(anio, mes, 0, 23, 59, 59, 999);

  const [
    totalClientesActivos,
    serviciosMes,
    ingresosMes,
    deudaTotal,
    incidenciasAbiertas,
    librosPendientesMes,
    ultimasTransacciones,
    cobranzasPorContador,
  ] = await Promise.all([
    // Clientes activos
    prisma.persona.count({ where: { estado: "ACTIVO" } }),

    // Servicios del mes
    prisma.servicio.count({
      where: { periodo, estado: { not: "ARCHIVADO" } },
    }),

    // Ingresos del mes
    prisma.finanza.aggregate({
      where: { tipo: "INGRESO", fecha: { gte: fechaInicio, lte: fechaFin } },
      _sum: { monto: true },
    }),

    // Deuda total pendiente
    prisma.servicio.aggregate({
      where: { estadoCobranza: { in: ["PENDIENTE", "PARCIAL"] } },
      _sum: { montoRestante: true },
    }),

    // Incidencias abiertas
    prisma.incidencia.count({
      where: { estado: { in: ["ABIERTA", "EN_PROGRESO"] } },
    }),

    // Libros pendientes del mes
    prisma.libro.count({
      where: { anio, mes, completado: false },
    }),

    // Últimas 5 transacciones
    prisma.finanza.findMany({
      orderBy: { fecha: "desc" },
      take: 5,
      select: {
        id: true,
        tipo: true,
        monto: true,
        fecha: true,
        concepto: true,
        cuenta: { select: { nombre: true, banco: true } },
        servicio: {
          select: {
            persona: { select: { razonSocial: true } },
            tipoServicio: { select: { nombre: true } },
          },
        },
      },
    }),

    // Rendimiento por contador del mes
    getCobranzasPorContador(anio, mes),
  ]);

  // Calcular % cobranza general del mes
  const totalHonorariosMes = cobranzasPorContador.reduce((acc, c) => acc + c.honorarios, 0);
  const totalCobradoMes = cobranzasPorContador.reduce((acc, c) => acc + c.cobrado, 0);
  const porcentajeCobranzaGeneral =
    totalHonorariosMes > 0
      ? Math.round((totalCobradoMes / totalHonorariosMes) * 100)
      : 0;

  return {
    totalClientesActivos,
    serviciosMes,
    ingresosMes: ingresosMes._sum.monto ?? 0,
    deudaTotal: deudaTotal._sum.montoRestante ?? 0,
    incidenciasAbiertas,
    librosPendientesMes,
    ultimasTransacciones,
    cobranzasPorContador,
    porcentajeCobranzaGeneral,
  };
}

// ─── Contador ─────────────────────────────────────────────────────────────────

export async function getDashboardContador(
  userId: string,
  anio: number,
  mes: number
) {
  const periodo = `${anio}-${String(mes).padStart(2, "0")}`;

  const [
    misClientes,
    misServiciosMes,
    cobranzaAggregate,
    misIncidenciasAbiertas,
    misServiciosPendientes,
  ] = await Promise.all([
    // Mis clientes activos
    prisma.persona.count({
      where: { contadorAsignadoId: userId, estado: "ACTIVO" },
    }),

    // Mis servicios del mes
    prisma.servicio.count({
      where: { contadorId: userId, periodo, estado: { not: "ARCHIVADO" } },
    }),

    // Cobranza del mes
    prisma.servicio.aggregate({
      where: { contadorId: userId, periodo },
      _sum: { honorarios: true, montoCobrado: true, montoRestante: true },
    }),

    // Mis incidencias abiertas
    prisma.incidencia.count({
      where: {
        contadorId: userId,
        estado: { in: ["ABIERTA", "EN_PROGRESO"] },
      },
    }),

    // Mis servicios con cobro pendiente (top 5)
    prisma.servicio.findMany({
      where: {
        contadorId: userId,
        estadoCobranza: { in: ["PENDIENTE", "PARCIAL"] },
        montoRestante: { gt: 0 },
      },
      orderBy: { montoRestante: "desc" },
      take: 5,
      include: {
        persona: { select: { id: true, razonSocial: true, tipoPersona: true, regimen: true } },
        tipoServicio: { select: { id: true, nombre: true, categoria: true } },
        contador: { select: { id: true, nombre: true, apellido: true } },
      },
    }),
  ]);

  const totalHonorarios = cobranzaAggregate._sum.honorarios ?? 0;
  const totalCobrado = cobranzaAggregate._sum.montoCobrado ?? 0;
  const montoPendiente = cobranzaAggregate._sum.montoRestante ?? 0;
  const porcentajeCobranza =
    totalHonorarios > 0
      ? Math.round((totalCobrado / totalHonorarios) * 100)
      : 0;

  return {
    misClientes,
    misServiciosMes,
    porcentajeCobranza,
    montoPendiente,
    misIncidenciasAbiertas,
    misServiciosPendientes,
  };
}

// ─── Ventas ───────────────────────────────────────────────────────────────────

export async function getDashboardVentas(userId: string) {
  const [pipeline, misLeadsRecientes] = await Promise.all([
    // Pipeline por estado
    prisma.lead.groupBy({
      by: ["estado"],
      _count: { _all: true },
    }),

    // Mis leads recientes
    prisma.lead.findMany({
      where: { asignadoAId: userId },
      orderBy: { createdAt: "desc" },
      take: 8,
      select: {
        id: true,
        nombre: true,
        apellido: true,
        celular: true,
        estado: true,
        regimen: true,
        createdAt: true,
      },
    }),
  ]);

  const pipelineMap: Record<string, number> = {};
  for (const row of pipeline) {
    pipelineMap[row.estado] = row._count._all;
  }

  return {
    pipeline: {
      NUEVO: pipelineMap["NUEVO"] ?? 0,
      CONTACTADO: pipelineMap["CONTACTADO"] ?? 0,
      COTIZADO: pipelineMap["COTIZADO"] ?? 0,
      CONVERTIDO: pipelineMap["CONVERTIDO"] ?? 0,
      PERDIDO: pipelineMap["PERDIDO"] ?? 0,
    },
    misLeadsRecientes,
  };
}

import { prisma } from "@/lib/prisma";
import type { CajaChicaFilters } from "./schemas";

const MESES = [
  "Ene", "Feb", "Mar", "Abr", "May", "Jun",
  "Jul", "Ago", "Set", "Oct", "Nov", "Dic",
];

export async function getCajaChicaMovimientos(filters: CajaChicaFilters = {}) {
  const { tipo, fechaDesde, fechaHasta, mes, anio } = filters;

  const where: Record<string, unknown> = {};

  if (tipo) where.tipo = tipo;

  if (anio && mes) {
    where.fecha = {
      gte: new Date(anio, mes - 1, 1),
      lte: new Date(anio, mes, 0, 23, 59, 59, 999),
    };
  } else if (fechaDesde || fechaHasta) {
    where.fecha = {
      ...(fechaDesde ? { gte: fechaDesde } : {}),
      ...(fechaHasta ? { lte: fechaHasta } : {}),
    };
  }

  return prisma.cajaChica.findMany({
    where,
    include: {
      creadoPor: { select: { id: true, nombre: true, apellido: true } },
    },
    orderBy: { fecha: "desc" },
  });
}

export async function getCajaChicaSaldo(): Promise<number> {
  const last = await prisma.cajaChica.findFirst({
    orderBy: [{ fecha: "desc" }, { createdAt: "desc" }],
    select: { saldoAcumulado: true },
  });
  return last?.saldoAcumulado ?? 0;
}

/** Saldo diario del mes seleccionado — para sparkline */
export async function getCajaChicaBalanceDiario(anio: number, mes: number) {
  const fechaInicio = new Date(anio, mes - 1, 1);
  const fechaFin = new Date(anio, mes, 0, 23, 59, 59, 999);
  const diasEnMes = new Date(anio, mes, 0).getDate();

  // Saldo inicial: último saldo antes del mes
  const prevMovimiento = await prisma.cajaChica.findFirst({
    where: { fecha: { lt: fechaInicio } },
    orderBy: [{ fecha: "desc" }, { createdAt: "desc" }],
    select: { saldoAcumulado: true },
  });
  const saldoInicial = prevMovimiento?.saldoAcumulado ?? 0;

  // Movimientos del mes
  const movimientos = await prisma.cajaChica.findMany({
    where: { fecha: { gte: fechaInicio, lte: fechaFin } },
    select: { fecha: true, saldoAcumulado: true },
    orderBy: [{ fecha: "asc" }, { createdAt: "asc" }],
  });

  // Agrupar por día: tomar el último saldo del día
  const porDia: Record<number, number> = {};
  for (const m of movimientos) {
    const dia = new Date(m.fecha).getDate();
    porDia[dia] = m.saldoAcumulado;
  }

  // Generar array de días, heredando saldo del día anterior
  let saldo = saldoInicial;
  return Array.from({ length: diasEnMes }, (_, i) => {
    const dia = i + 1;
    if (porDia[dia] !== undefined) saldo = porDia[dia];
    return { dia: String(dia), saldo };
  });
}

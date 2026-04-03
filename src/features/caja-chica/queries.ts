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

export async function getCajaChicaBalanceHistory(anio: number) {
  const fechaInicio = new Date(anio, 0, 1);
  const fechaFin = new Date(anio, 11, 31, 23, 59, 59, 999);

  const movimientos = await prisma.cajaChica.findMany({
    where: { fecha: { gte: fechaInicio, lte: fechaFin } },
    select: { fecha: true, saldoAcumulado: true },
    orderBy: { fecha: "asc" },
  });

  // Agrupar por mes: tomar el último saldo del mes
  const porMes: Record<number, number> = {};
  for (const m of movimientos) {
    const mes = new Date(m.fecha).getMonth();
    porMes[mes] = m.saldoAcumulado;
  }

  // Si el mes no tiene movimientos, heredar el saldo del mes anterior
  let lastSaldo = 0;
  return MESES.map((label, i) => {
    if (porMes[i] !== undefined) {
      lastSaldo = porMes[i];
    }
    return { mes: label, saldo: lastSaldo };
  });
}

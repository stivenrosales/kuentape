import { prisma } from "@/lib/prisma";
import type { TipoPersona } from "@prisma/client";

// Helper: periodo string
function toPeriodo(anio: number, mes: number) {
  return `${anio}-${String(mes).padStart(2, "0")}`;
}

// ─── Cobranzas por contador (mes) ────────────────────────────────────────────

export async function getCobranzasPorContador(
  anio: number,
  mes: number,
  contadorId?: string
) {
  const periodo = toPeriodo(anio, mes);

  // Servicios del mes actual
  const servicios = await prisma.servicio.groupBy({
    by: ["contadorId"],
    where: { periodo, ...(contadorId ? { contadorId } : {}) },
    _sum: { honorarios: true, montoCobrado: true, montoRestante: true },
  });

  // Rezago: deuda de meses ANTERIORES al seleccionado
  const rezagoData = await prisma.servicio.groupBy({
    by: ["contadorId"],
    where: {
      periodo: { lt: periodo },
      estadoCobranza: { in: ["PENDIENTE", "PARCIAL"] },
      montoRestante: { gt: 0 },
      ...(contadorId ? { contadorId } : {}),
    },
    _sum: { montoRestante: true },
  });
  const rezagoMap = new Map(rezagoData.map((r) => [r.contadorId, r._sum.montoRestante ?? 0]));

  // Collect all contador IDs (from both current month and rezago)
  const allContadorIds = new Set([
    ...servicios.map((s) => s.contadorId),
    ...rezagoData.map((r) => r.contadorId),
  ]);

  if (allContadorIds.size === 0) return [];

  const users = await prisma.user.findMany({
    where: { id: { in: Array.from(allContadorIds) } },
    select: { id: true, nombre: true, apellido: true },
  });
  const userMap = Object.fromEntries(users.map((u) => [u.id, u]));
  const serviciosMap = new Map(servicios.map((s) => [s.contadorId, s]));

  return Array.from(allContadorIds)
    .map((contId) => {
      const u = userMap[contId];
      const s = serviciosMap.get(contId);
      const honorarios = s?._sum.honorarios ?? 0;
      const cobrado = s?._sum.montoCobrado ?? 0;
      const deuda = s?._sum.montoRestante ?? 0;
      const rezago = rezagoMap.get(contId) ?? 0;
      const porcentaje = honorarios > 0 ? Math.round((cobrado / honorarios) * 100) : 0;
      return {
        contadorId: contId,
        contador: u ? `${u.nombre} ${u.apellido}` : contId,
        honorarios,
        cobrado,
        deuda,
        rezago,
        porcentaje,
      };
    })
    .sort((a, b) => b.honorarios - a.honorarios);
}

// ─── Cobranzas diarias (mes) por contador ─────────────────────────────────────

export async function getCobranzasDiarias(
  anio: number,
  mes: number,
  contadorId?: string
) {
  const fechaInicio = new Date(anio, mes - 1, 1);
  const fechaFin = new Date(anio, mes, 0, 23, 59, 59, 999);

  const finanzas = await prisma.finanza.findMany({
    where: {
      tipo: "INGRESO",
      fecha: { gte: fechaInicio, lte: fechaFin },
      servicioId: { not: null },
      ...(contadorId
        ? { servicio: { contadorId } }
        : {}),
    },
    select: {
      monto: true,
      fecha: true,
      servicio: {
        select: {
          contador: { select: { id: true, nombre: true, apellido: true } },
        },
      },
    },
  });

  // Group by day + contador
  const byDay: Record<string, Record<string, number>> = {};
  const contadoresSet = new Set<string>();

  for (const f of finanzas) {
    const day = new Date(f.fecha).getDate();
    const key = String(day).padStart(2, "0");
    const contadorNombre = f.servicio?.contador
      ? `${f.servicio.contador.nombre} ${f.servicio.contador.apellido}`
      : "Sin asignar";
    contadoresSet.add(contadorNombre);
    if (!byDay[key]) byDay[key] = {};
    byDay[key][contadorNombre] = (byDay[key][contadorNombre] ?? 0) + f.monto;
  }

  const contadores = Array.from(contadoresSet);
  const daysInMonth = new Date(anio, mes, 0).getDate();

  return {
    data: Array.from({ length: daysInMonth }, (_, i) => {
      const key = String(i + 1).padStart(2, "0");
      return {
        dia: `${i + 1}`,
        ...Object.fromEntries(contadores.map((c) => [c, byDay[key]?.[c] ?? 0])),
      };
    }),
    contadores,
  };
}

// ─── Montos por cobrar este mes ────────────────────────────────────────────────

export async function getMontosPorCobrarMes(
  anio: number,
  mes: number,
  contadorId?: string
) {
  const periodo = toPeriodo(anio, mes);

  const servicios = await prisma.servicio.groupBy({
    by: ["contadorId"],
    where: { periodo, ...(contadorId ? { contadorId } : {}) },
    _sum: { honorarios: true, montoCobrado: true },
  });

  if (servicios.length === 0) return [];

  const userIds = servicios.map((s) => s.contadorId);
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, nombre: true, apellido: true },
  });
  const userMap = Object.fromEntries(users.map((u) => [u.id, u]));

  return servicios.map((s) => {
    const u = userMap[s.contadorId];
    const honorarios = s._sum.honorarios ?? 0;
    const cobrado = s._sum.montoCobrado ?? 0;
    const porcentaje =
      honorarios > 0 ? Math.round((cobrado / honorarios) * 100) : 0;
    return {
      contador: u ? `${u.nombre} ${u.apellido}` : s.contadorId,
      porcentaje,
      monto: cobrado,
    };
  });
}

// ─── Deuda del mes por contador ───────────────────────────────────────────────

export async function getDeudaDelMes(
  anio: number,
  mes: number,
  contadorId?: string
) {
  const periodo = toPeriodo(anio, mes);

  const servicios = await prisma.servicio.groupBy({
    by: ["contadorId"],
    where: {
      periodo,
      estadoCobranza: { in: ["PENDIENTE", "PARCIAL"] },
      ...(contadorId ? { contadorId } : {}),
    },
    _sum: { montoRestante: true },
  });

  if (servicios.length === 0) return [];

  const userIds = servicios.map((s) => s.contadorId);
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, nombre: true, apellido: true },
  });
  const userMap = Object.fromEntries(users.map((u) => [u.id, u]));

  return servicios
    .map((s) => {
      const u = userMap[s.contadorId];
      return {
        contador: u ? `${u.nombre} ${u.apellido}` : s.contadorId,
        deuda: s._sum.montoRestante ?? 0,
      };
    })
    .sort((a, b) => b.deuda - a.deuda);
}

// ─── Monto restante por contador (filtrable) ──────────────────────────────────

export interface MontoRestanteFilters {
  tipoServicioId?: string;
  tipoPersona?: TipoPersona;
  mes?: number;
  anio?: number;
  contadorId?: string;
}

export async function getMontoRestantePorContador(
  filters: MontoRestanteFilters = {}
) {
  const { tipoServicioId, tipoPersona, mes, anio, contadorId } = filters;

  const where: Record<string, unknown> = {
    estadoCobranza: { in: ["PENDIENTE", "PARCIAL"] },
    montoRestante: { gt: 0 },
  };

  if (tipoServicioId) where.tipoServicioId = tipoServicioId;
  if (contadorId) where.contadorId = contadorId;

  if (anio && mes) {
    where.periodo = toPeriodo(anio, mes);
  } else if (anio) {
    where.periodo = { startsWith: String(anio) };
  }

  if (tipoPersona) {
    where.persona = { tipoPersona };
  }

  const servicios = await prisma.servicio.findMany({
    where,
    select: {
      montoRestante: true,
      contador: { select: { id: true, nombre: true, apellido: true } },
    },
  });

  const map = new Map<string, { nombre: string; monto: number }>();
  for (const s of servicios) {
    const key = s.contador.id;
    if (!map.has(key)) {
      map.set(key, {
        nombre: `${s.contador.nombre} ${s.contador.apellido}`,
        monto: 0,
      });
    }
    map.get(key)!.monto += s.montoRestante;
  }

  return Array.from(map.values())
    .map((v) => ({ contador: v.nombre, monto: v.monto }))
    .sort((a, b) => b.monto - a.monto);
}

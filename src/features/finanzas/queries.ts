import { prisma } from "@/lib/prisma";
import type { FinanzaFilters } from "./schemas";

const MESES = [
  "Ene", "Feb", "Mar", "Abr", "May", "Jun",
  "Jul", "Ago", "Set", "Oct", "Nov", "Dic",
];

/** Genera las etiquetas y rangos de los últimos 12 meses terminando en anio/mes */
function getLast12Months(anio: number, mes: number) {
  const months: { label: string; year: number; month: number; start: Date; end: Date }[] = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(anio, mes - 1 - i, 1);
    const y = d.getFullYear();
    const m = d.getMonth(); // 0-based
    months.push({
      label: `${MESES[m]} ${String(y).slice(2)}`,
      year: y,
      month: m,
      start: new Date(y, m, 1),
      end: new Date(y, m + 1, 0, 23, 59, 59, 999),
    });
  }
  return months;
}

export async function getFinanzas(filters: FinanzaFilters = {}) {
  const {
    tipo,
    cuentaId,
    categoriaGasto,
    fechaDesde,
    fechaHasta,
    search,
    page = 1,
    pageSize = 25,
  } = filters;

  const where: Record<string, unknown> = {};

  if (tipo) where.tipo = tipo;
  if (cuentaId) where.cuentaId = cuentaId;
  if (categoriaGasto) where.categoriaGasto = categoriaGasto;

  if (fechaDesde || fechaHasta) {
    where.fecha = {
      ...(fechaDesde ? { gte: fechaDesde } : {}),
      ...(fechaHasta ? { lte: fechaHasta } : {}),
    };
  }

  if (search) {
    where.concepto = { contains: search, mode: "insensitive" };
  }

  const [items, total] = await Promise.all([
    prisma.finanza.findMany({
      where,
      include: {
        cuenta: { select: { id: true, nombre: true, banco: true, tipo: true } },
        servicio: {
          select: {
            id: true,
            persona: { select: { razonSocial: true } },
            tipoServicio: { select: { nombre: true } },
            contador: { select: { id: true, nombre: true, apellido: true } },
          },
        },
        creadoPor: { select: { id: true, nombre: true, apellido: true } },
      },
      orderBy: { fecha: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.finanza.count({ where }),
  ]);

  return { items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
}

export async function getFinanzaKPIs(anio: number, mes: number) {
  const fechaInicio = new Date(anio, mes - 1, 1);
  const fechaFin = new Date(anio, mes, 0, 23, 59, 59, 999);

  const today = new Date();
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const todayEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);

  const [ingresosMes, egresosMes, deudaTotal, cobradoHoy] = await Promise.all([
    prisma.finanza.aggregate({
      where: { tipo: "INGRESO", fecha: { gte: fechaInicio, lte: fechaFin } },
      _sum: { monto: true },
    }),
    prisma.finanza.aggregate({
      where: { tipo: "EGRESO", fecha: { gte: fechaInicio, lte: fechaFin } },
      _sum: { monto: true },
    }),
    prisma.servicio.aggregate({
      where: { estadoCobranza: { in: ["PENDIENTE", "PARCIAL"] } },
      _sum: { montoRestante: true },
    }),
    prisma.finanza.aggregate({
      where: { tipo: "INGRESO", fecha: { gte: todayStart, lte: todayEnd } },
      _sum: { monto: true },
    }),
  ]);

  const totalIngresos = ingresosMes._sum.monto ?? 0;
  const totalEgresos = egresosMes._sum.monto ?? 0;

  return {
    totalIngresos,
    totalEgresos,
    utilidad: totalIngresos - totalEgresos,
    deudaTotal: deudaTotal._sum.montoRestante ?? 0,
    cobradoHoy: cobradoHoy._sum.monto ?? 0,
  };
}

export async function getIngresosPorCuenta(fecha: Date) {
  const start = new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate());
  const end = new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate(), 23, 59, 59, 999);

  const cuentas = await prisma.cuentaBancaria.findMany({
    where: { activo: true },
    orderBy: { orden: "asc" },
  });

  const ingresos = await prisma.finanza.groupBy({
    by: ["cuentaId"],
    where: { tipo: "INGRESO", fecha: { gte: start, lte: end } },
    _sum: { monto: true },
  });

  const ingresosMap = new Map(
    ingresos.map((i) => [i.cuentaId, i._sum.monto ?? 0])
  );

  return cuentas.map((c) => ({
    id: c.id,
    nombre: c.nombre,
    banco: c.banco,
    tipo: c.tipo,
    montoCobrado: ingresosMap.get(c.id) ?? 0,
  }));
}

export async function getFinanzasMensuales(anio: number, mes: number) {
  const months = getLast12Months(anio, mes);
  const fechaInicio = months[0].start;
  const fechaFin = months[11].end;

  const finanzas = await prisma.finanza.findMany({
    where: { fecha: { gte: fechaInicio, lte: fechaFin } },
    select: { tipo: true, monto: true, fecha: true },
  });

  // Index by "year-month"
  const dataMap = new Map<string, { ingreso: number; egreso: number }>();
  for (const m of months) {
    dataMap.set(`${m.year}-${m.month}`, { ingreso: 0, egreso: 0 });
  }

  for (const f of finanzas) {
    const d = new Date(f.fecha);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    const entry = dataMap.get(key);
    if (!entry) continue;
    if (f.tipo === "INGRESO") entry.ingreso += f.monto;
    else entry.egreso += f.monto;
  }

  return months.map((m) => {
    const d = dataMap.get(`${m.year}-${m.month}`)!;
    return {
      mes: m.label,
      ingreso: d.ingreso,
      egreso: d.egreso,
      utilidad: d.ingreso - d.egreso,
    };
  });
}

export async function getIngresosPorTipoServicio(anio: number, mes: number) {
  const months = getLast12Months(anio, mes);
  const fechaInicio = months[0].start;
  const fechaFin = months[11].end;

  const finanzas = await prisma.finanza.findMany({
    where: {
      tipo: "INGRESO",
      fecha: { gte: fechaInicio, lte: fechaFin },
      servicioId: { not: null },
    },
    select: {
      monto: true,
      fecha: true,
      servicio: {
        select: { tipoServicio: { select: { nombre: true } } },
      },
    },
  });

  const tiposSet = new Set<string>();
  const byKey: Record<string, Record<string, number>> = {};

  for (const f of finanzas) {
    const d = new Date(f.fecha);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    const tipo = f.servicio?.tipoServicio?.nombre ?? "Sin tipo";
    tiposSet.add(tipo);
    if (!byKey[key]) byKey[key] = {};
    byKey[key][tipo] = (byKey[key][tipo] ?? 0) + f.monto;
  }

  const tipos = Array.from(tiposSet);

  return {
    data: months.map((m) => {
      const key = `${m.year}-${m.month}`;
      return {
        mes: m.label,
        ...Object.fromEntries(tipos.map((t) => [t, byKey[key]?.[t] ?? 0])),
      };
    }),
    tipos,
  };
}

export async function getVentasPorContador(anio: number, mes: number) {
  const months = getLast12Months(anio, mes);
  // Build periodo strings like "2026-04" for filtering
  const periodos = months.map((m) => `${m.year}-${String(m.month + 1).padStart(2, "0")}`);

  const servicios = await prisma.servicio.findMany({
    where: { periodo: { in: periodos } },
    select: {
      honorarios: true,
      periodo: true,
      contador: { select: { id: true, nombre: true, apellido: true } },
    },
  });

  const contadoresMap = new Map<string, { nombre: string; meses: Record<string, number> }>();

  for (const s of servicios) {
    const key = s.contador.id;
    if (!contadoresMap.has(key)) {
      contadoresMap.set(key, {
        nombre: `${s.contador.nombre} ${s.contador.apellido}`,
        meses: {},
      });
    }
    // periodo is "2026-03" → parse to "2026-2" (year-monthIndex)
    if (!s.periodo) continue;
    const [pYear, pMonth] = s.periodo.split("-").map(Number);
    const mKey = `${pYear}-${pMonth! - 1}`;
    const entry = contadoresMap.get(key)!;
    entry.meses[mKey] = (entry.meses[mKey] ?? 0) + s.honorarios;
  }

  const labels = months.map((m) => m.label);

  return {
    labels,
    rows: Array.from(contadoresMap.values()).map((c) => ({
      contador: c.nombre,
      ...Object.fromEntries(months.map((m) => [m.label, c.meses[`${m.year}-${m.month}`] ?? 0])),
      total: Object.values(c.meses).reduce((a, b) => a + b, 0),
    })),
  };
}

export async function getVentasPorServicio(anio: number, mes: number) {
  const months = getLast12Months(anio, mes);
  const periodos = months.map((m) => `${m.year}-${String(m.month + 1).padStart(2, "0")}`);

  const servicios = await prisma.servicio.findMany({
    where: { periodo: { in: periodos } },
    select: {
      honorarios: true,
      periodo: true,
      tipoServicio: { select: { nombre: true } },
    },
  });

  const tiposMap = new Map<string, Record<string, number>>();

  for (const s of servicios) {
    const tipo = s.tipoServicio.nombre;
    if (!tiposMap.has(tipo)) tiposMap.set(tipo, {});
    if (!s.periodo) continue;
    const [pYear, pMonth] = s.periodo.split("-").map(Number);
    const mKey = `${pYear}-${pMonth! - 1}`;
    const entry = tiposMap.get(tipo)!;
    entry[mKey] = (entry[mKey] ?? 0) + s.honorarios;
  }

  const labels = months.map((m) => m.label);

  return {
    labels,
    rows: Array.from(tiposMap.entries()).map(([tipo, meses]) => ({
      tipoServicio: tipo,
      ...Object.fromEntries(months.map((m) => [m.label, meses[`${m.year}-${m.month}`] ?? 0])),
      total: Object.values(meses).reduce((a, b) => a + b, 0),
    })),
  };
}

export async function getMontoPorCobrarPorContador() {
  const servicios = await prisma.servicio.findMany({
    where: { estadoCobranza: { in: ["PENDIENTE", "PARCIAL"] } },
    select: {
      montoRestante: true,
      contador: { select: { id: true, nombre: true, apellido: true } },
    },
  });

  const contadoresMap = new Map<string, { nombre: string; monto: number }>();

  for (const s of servicios) {
    const key = s.contador.id;
    if (!contadoresMap.has(key)) {
      contadoresMap.set(key, {
        nombre: `${s.contador.nombre} ${s.contador.apellido}`,
        monto: 0,
      });
    }
    contadoresMap.get(key)!.monto += s.montoRestante;
  }

  return Array.from(contadoresMap.values()).sort((a, b) => b.monto - a.monto);
}

export async function getEgresosPorCategoria(anio: number, mes: number) {
  const fechaInicio = new Date(anio, mes - 1, 1);
  const fechaFin = new Date(anio, mes, 0, 23, 59, 59, 999);

  const egresos = await prisma.finanza.groupBy({
    by: ["categoriaGasto"],
    where: {
      tipo: "EGRESO",
      fecha: { gte: fechaInicio, lte: fechaFin },
    },
    _sum: { monto: true },
  });

  return egresos
    .filter((e) => e.categoriaGasto !== null)
    .map((e) => ({
      name: e.categoriaGasto!,
      value: e._sum.monto ?? 0,
    }))
    .sort((a, b) => b.value - a.value);
}

export async function getEgresosPorCategoriaAnual(anio: number) {
  const fechaInicio = new Date(anio, 0, 1);
  const fechaFin = new Date(anio, 11, 31, 23, 59, 59, 999);

  const egresos = await prisma.finanza.findMany({
    where: {
      tipo: "EGRESO",
      fecha: { gte: fechaInicio, lte: fechaFin },
    },
    select: { monto: true, fecha: true, categoriaGasto: true },
  });

  const categoriasSet = new Set<string>();
  const byMes: Record<string, Record<string, number>> = {};

  for (const e of egresos) {
    const mesIdx = new Date(e.fecha).getMonth();
    const label = MESES[mesIdx];
    const cat = e.categoriaGasto ?? "Otros";
    categoriasSet.add(cat);
    if (!byMes[label]) byMes[label] = {};
    byMes[label][cat] = (byMes[label][cat] ?? 0) + e.monto;
  }

  const categorias = Array.from(categoriasSet);

  return {
    data: MESES.map((m) => ({
      mes: m,
      ...Object.fromEntries(categorias.map((c) => [c, byMes[m]?.[c] ?? 0])),
    })),
    categorias,
  };
}

export async function getCuentasBancarias() {
  return prisma.cuentaBancaria.findMany({
    where: { activo: true },
    orderBy: { orden: "asc" },
  });
}

export async function getAllCuentasBancarias() {
  return prisma.cuentaBancaria.findMany({
    orderBy: { orden: "asc" },
    include: {
      _count: { select: { finanzas: true } },
    },
  });
}

export async function getServiciosConDeuda() {
  return prisma.servicio.findMany({
    where: {
      estadoCobranza: { in: ["PENDIENTE", "PARCIAL"] },
      montoRestante: { gt: 0 },
    },
    select: {
      id: true,
      montoRestante: true,
      precioFinal: true,
      persona: { select: { razonSocial: true } },
      tipoServicio: { select: { nombre: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 200,
  });
}

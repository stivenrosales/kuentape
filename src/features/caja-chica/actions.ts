"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { authorizeAction } from "@/lib/auth-guard";
import { logAction } from "@/lib/audit";
import { createCajaChicaSchema } from "./schemas";
import type { CreateCajaChicaInput } from "./schemas";

export async function createCajaChicaAction(data: CreateCajaChicaInput) {
  const session = await authorizeAction(["GERENCIA", "ADMINISTRADOR"]);
  const userId = (session.user as { id: string }).id;

  const parsed = createCajaChicaSchema.safeParse({
    ...data,
    fecha: data.fecha instanceof Date ? data.fecha : new Date(data.fecha as unknown as string),
  });
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  const { tipo, monto, fecha, concepto, comprobanteUrl, categoriaGasto, cuentaOrigenId } = parsed.data;

  // Obtener saldo anterior
  const last = await prisma.cajaChica.findFirst({
    orderBy: [{ fecha: "desc" }, { createdAt: "desc" }],
    select: { saldoAcumulado: true },
  });

  const saldoPrevio = last?.saldoAcumulado ?? 0;
  const saldoAcumulado = tipo === "INGRESO" ? saldoPrevio + monto : saldoPrevio - monto;

  let finanzaVinculadaId: string | null = null;

  // Si es INGRESO a Caja Chica y tiene cuenta de origen → crear egreso en Finanzas
  if (tipo === "INGRESO" && cuentaOrigenId) {
    const finanza = await prisma.finanza.create({
      data: {
        tipo: "EGRESO",
        monto,
        fecha,
        concepto: `Fondo Caja Chica: ${concepto}`,
        categoriaGasto: "Caja Chica",
        cuentaId: cuentaOrigenId,
        creadoPorId: userId,
      },
    });
    finanzaVinculadaId = finanza.id;
  }

  const movimiento = await prisma.cajaChica.create({
    data: {
      tipo,
      monto,
      fecha,
      concepto,
      categoriaGasto: tipo === "GASTO" ? (categoriaGasto ?? null) : null,
      comprobanteUrl: comprobanteUrl ?? null,
      saldoAcumulado,
      finanzaVinculada: finanzaVinculadaId,
      creadoPorId: userId,
    },
  });

  await logAction({
    userId,
    accion: "CREATE",
    entidad: "CajaChica",
    entidadId: movimiento.id,
    metadata: { tipo, monto, concepto, saldoAcumulado, finanzaVinculadaId },
  });

  revalidatePath("/finanzas");
  revalidatePath("/finanzas/caja-chica");
  return { data: movimiento };
}

export async function updateCajaChicaAction(id: string, data: CreateCajaChicaInput) {
  const session = await authorizeAction(["GERENCIA"]);
  const userId = (session.user as { id: string }).id;

  const parsed = createCajaChicaSchema.safeParse({
    ...data,
    fecha: data.fecha instanceof Date ? data.fecha : new Date(data.fecha as unknown as string),
  });
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  const { tipo, monto, fecha, concepto, comprobanteUrl, categoriaGasto } = parsed.data;

  const movimientoActual = await prisma.cajaChica.findUnique({ where: { id } });
  if (!movimientoActual) return { error: "Movimiento no encontrado" };

  const result = await prisma.$transaction(async (tx) => {
    const anterior = await tx.cajaChica.findFirst({
      where: { fecha: { lt: movimientoActual.fecha }, id: { not: id } },
      orderBy: [{ fecha: "desc" }, { createdAt: "desc" }],
      select: { saldoAcumulado: true },
    });

    const saldoBase = anterior?.saldoAcumulado ?? 0;
    const nuevoSaldo = tipo === "INGRESO" ? saldoBase + monto : saldoBase - monto;

    const updated = await tx.cajaChica.update({
      where: { id },
      data: {
        tipo,
        monto,
        fecha,
        concepto,
        categoriaGasto: tipo === "GASTO" ? (categoriaGasto ?? null) : null,
        comprobanteUrl: comprobanteUrl ?? null,
        saldoAcumulado: nuevoSaldo,
      },
    });

    // Recomputar saldos posteriores
    const siguientes = await tx.cajaChica.findMany({
      where: { fecha: { gte: movimientoActual.fecha }, id: { not: id } },
      orderBy: [{ fecha: "asc" }, { createdAt: "asc" }],
    });

    let saldoCorriente = nuevoSaldo;
    for (const mov of siguientes) {
      saldoCorriente = mov.tipo === "INGRESO" ? saldoCorriente + mov.monto : saldoCorriente - mov.monto;
      await tx.cajaChica.update({ where: { id: mov.id }, data: { saldoAcumulado: saldoCorriente } });
    }

    // Actualizar finanza vinculada si existe
    if (updated.finanzaVinculada) {
      await tx.finanza.update({
        where: { id: updated.finanzaVinculada },
        data: { monto, fecha, concepto: `Fondo Caja Chica: ${concepto}` },
      });
    }

    return updated;
  });

  await logAction({
    userId,
    accion: "UPDATE",
    entidad: "CajaChica",
    entidadId: id,
    metadata: { tipo, monto, concepto },
  });

  revalidatePath("/finanzas");
  revalidatePath("/finanzas/caja-chica");
  return { data: result };
}

/** Resumen de caja chica para el PDF — llamado desde el client */
export async function getCajaChicaResumenAction(desdeAnio: number, desdeMes: number, hastaAnio: number, hastaMes: number) {
  await authorizeAction(["GERENCIA", "ADMINISTRADOR"]);

  const desde = new Date(desdeAnio, desdeMes - 1, 1);
  const hasta = new Date(hastaAnio, hastaMes, 0, 23, 59, 59, 999);

  const movimientos = await prisma.cajaChica.findMany({
    where: { fecha: { gte: desde, lte: hasta } },
    select: { tipo: true, monto: true, categoriaGasto: true, concepto: true, fecha: true, saldoAcumulado: true },
    orderBy: { fecha: "asc" },
  });

  const totalIngresos = movimientos.filter((m) => m.tipo === "INGRESO").reduce((s, m) => s + m.monto, 0);
  const totalGastos = movimientos.filter((m) => m.tipo === "GASTO").reduce((s, m) => s + m.monto, 0);
  const saldoFinal = movimientos.length > 0 ? movimientos[movimientos.length - 1].saldoAcumulado : 0;

  // Gastos por categoría
  const catMap = new Map<string, number>();
  movimientos.filter((m) => m.tipo === "GASTO").forEach((m) => {
    const cat = m.categoriaGasto ?? "Sin categoría";
    catMap.set(cat, (catMap.get(cat) ?? 0) + m.monto);
  });
  const gastosPorCategoria = Array.from(catMap.entries())
    .map(([cat, monto]) => ({ cat, monto }))
    .sort((a, b) => b.monto - a.monto);

  return {
    totalIngresos,
    totalGastos,
    saldoFinal,
    movimientos: movimientos.length,
    gastosPorCategoria,
  };
}

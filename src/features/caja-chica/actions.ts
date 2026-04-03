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

  const { tipo, monto, fecha, concepto, comprobanteUrl } = parsed.data;

  // Obtener saldo anterior
  const last = await prisma.cajaChica.findFirst({
    orderBy: [{ fecha: "desc" }, { createdAt: "desc" }],
    select: { saldoAcumulado: true },
  });

  const saldoPrevio = last?.saldoAcumulado ?? 0;
  const saldoAcumulado =
    tipo === "INGRESO" ? saldoPrevio + monto : saldoPrevio - monto;

  const movimiento = await prisma.cajaChica.create({
    data: {
      tipo,
      monto,
      fecha,
      concepto,
      comprobanteUrl: comprobanteUrl ?? null,
      saldoAcumulado,
      creadoPorId: userId,
    },
  });

  await logAction({
    userId,
    accion: "CREATE",
    entidad: "CajaChica",
    entidadId: movimiento.id,
    metadata: { tipo, monto, concepto, saldoAcumulado },
  });

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

  const { tipo, monto, fecha, concepto, comprobanteUrl } = parsed.data;

  const movimientoActual = await prisma.cajaChica.findUnique({ where: { id } });
  if (!movimientoActual) return { error: "Movimiento no encontrado" };

  // Recompute this and all subsequent entries
  const result = await prisma.$transaction(async (tx) => {
    // Obtener el saldo justo antes de este movimiento
    const anterior = await tx.cajaChica.findFirst({
      where: {
        fecha: { lt: movimientoActual.fecha },
        id: { not: id },
      },
      orderBy: [{ fecha: "desc" }, { createdAt: "desc" }],
      select: { saldoAcumulado: true },
    });

    const saldoBase = anterior?.saldoAcumulado ?? 0;
    const nuevoSaldo = tipo === "INGRESO" ? saldoBase + monto : saldoBase - monto;

    // Actualizar el movimiento actual
    const updated = await tx.cajaChica.update({
      where: { id },
      data: {
        tipo,
        monto,
        fecha,
        concepto,
        comprobanteUrl: comprobanteUrl ?? null,
        saldoAcumulado: nuevoSaldo,
      },
    });

    // Obtener y recomputar todos los movimientos posteriores
    const siguientes = await tx.cajaChica.findMany({
      where: {
        fecha: { gte: movimientoActual.fecha },
        id: { not: id },
      },
      orderBy: [{ fecha: "asc" }, { createdAt: "asc" }],
    });

    let saldoCorriente = nuevoSaldo;
    for (const mov of siguientes) {
      saldoCorriente =
        mov.tipo === "INGRESO"
          ? saldoCorriente + mov.monto
          : saldoCorriente - mov.monto;

      await tx.cajaChica.update({
        where: { id: mov.id },
        data: { saldoAcumulado: saldoCorriente },
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

  revalidatePath("/finanzas/caja-chica");
  return { data: result };
}

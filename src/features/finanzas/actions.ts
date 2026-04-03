"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { authorizeAction } from "@/lib/auth-guard";
import { logAction } from "@/lib/audit";
import { createFinanzaSchema, updateFinanzaSchema } from "./schemas";
import type { CreateFinanzaInput, UpdateFinanzaInput } from "./schemas";

export async function createFinanzaAction(data: CreateFinanzaInput) {
  const session = await authorizeAction(["GERENCIA", "ADMINISTRADOR"]);
  const userId = (session.user as { id: string }).id;

  const parsed = createFinanzaSchema.safeParse({
    ...data,
    fecha: data.fecha instanceof Date ? data.fecha : new Date(data.fecha as unknown as string),
  });
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  const { tipo, monto, fecha, concepto, cuentaId, servicioId, categoriaGasto, numeroOperacion, comprobanteUrl, notas } = parsed.data;

  let finanza;
  try {
    finanza = await prisma.$transaction(async (tx) => {
      const created = await tx.finanza.create({
        data: {
          tipo,
          monto,
          fecha,
          concepto,
          cuentaId,
          servicioId: servicioId ?? null,
          categoriaGasto: categoriaGasto ?? null,
          numeroOperacion: numeroOperacion ?? null,
          comprobanteUrl: comprobanteUrl ?? null,
          notas: notas ?? null,
          creadoPorId: userId,
        },
      });

      // Si es INGRESO vinculado a un servicio, actualizar montoCobrado
      if (tipo === "INGRESO" && servicioId) {
        const servicio = await tx.servicio.findUnique({ where: { id: servicioId } });
        if (servicio) {
          const saldoPendiente = servicio.precioFinal - servicio.montoCobrado;
          if (monto > saldoPendiente) {
            throw new Error(`El monto excede el saldo pendiente (S/. ${saldoPendiente.toFixed(2)} restante)`);
          }

          // Atomic increment to prevent race conditions
          const updatedServicio = await tx.servicio.update({
            where: { id: servicioId },
            data: { montoCobrado: { increment: monto } },
          });

          const nuevoRestante = Math.max(0, updatedServicio.precioFinal - updatedServicio.montoCobrado);
          const nuevoEstado =
            nuevoRestante === 0
              ? "COBRADO"
              : updatedServicio.montoCobrado > 0
                ? "PARCIAL"
                : "PENDIENTE";

          await tx.servicio.update({
            where: { id: servicioId },
            data: {
              montoRestante: nuevoRestante,
              estadoCobranza: nuevoEstado,
            },
          });
        }
      }

      return created;
    });
  } catch (err: any) {
    return { error: err?.message ?? "Error al registrar la transacción" };
  }

  await logAction({
    userId,
    accion: "CREATE",
    entidad: "Finanza",
    entidadId: finanza.id,
    metadata: { tipo, monto, concepto },
  });

  revalidatePath("/finanzas");
  revalidatePath("/finanzas/egresos");
  return { data: finanza };
}

export async function updateFinanzaAction(id: string, data: UpdateFinanzaInput) {
  const session = await authorizeAction(["GERENCIA"]);
  const userId = (session.user as { id: string }).id;

  const parsed = updateFinanzaSchema.safeParse({
    ...data,
    fecha: data.fecha instanceof Date ? data.fecha : new Date(data.fecha as unknown as string),
  });
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  const { tipo, monto, fecha, concepto, cuentaId, servicioId, categoriaGasto, numeroOperacion, comprobanteUrl, notas } = parsed.data;

  // Obtener finanza anterior para recalcular servicio
  const finanzaAnterior = await prisma.finanza.findUnique({ where: { id } });
  if (!finanzaAnterior) return { error: "Transacción no encontrada" };

  const finanza = await prisma.$transaction(async (tx) => {
    // Revertir efecto anterior en el servicio (si aplica)
    if (finanzaAnterior.tipo === "INGRESO" && finanzaAnterior.servicioId) {
      const servicioAnterior = await tx.servicio.findUnique({
        where: { id: finanzaAnterior.servicioId },
      });
      if (servicioAnterior) {
        const cobradoRevertido = Math.max(0, servicioAnterior.montoCobrado - finanzaAnterior.monto);
        const restanteRevertido = Math.max(0, servicioAnterior.precioFinal - cobradoRevertido);
        const estadoRevertido =
          restanteRevertido === servicioAnterior.precioFinal
            ? "PENDIENTE"
            : cobradoRevertido > 0
              ? "PARCIAL"
              : "PENDIENTE";

        await tx.servicio.update({
          where: { id: finanzaAnterior.servicioId },
          data: {
            montoCobrado: cobradoRevertido,
            montoRestante: restanteRevertido,
            estadoCobranza: estadoRevertido,
          },
        });
      }
    }

    const updated = await tx.finanza.update({
      where: { id },
      data: {
        tipo,
        monto,
        fecha,
        concepto,
        cuentaId,
        servicioId: servicioId ?? null,
        categoriaGasto: categoriaGasto ?? null,
        numeroOperacion: numeroOperacion ?? null,
        comprobanteUrl: comprobanteUrl ?? null,
        notas: notas ?? null,
      },
    });

    // Aplicar nuevo efecto en el servicio
    if (tipo === "INGRESO" && servicioId) {
      const servicio = await tx.servicio.findUnique({ where: { id: servicioId } });
      if (servicio) {
        const nuevoCobrado = servicio.montoCobrado + monto;
        const nuevoRestante = Math.max(0, servicio.precioFinal - nuevoCobrado);
        const nuevoEstado =
          nuevoRestante === 0
            ? "COBRADO"
            : nuevoCobrado > 0
              ? "PARCIAL"
              : "PENDIENTE";

        await tx.servicio.update({
          where: { id: servicioId },
          data: {
            montoCobrado: nuevoCobrado,
            montoRestante: nuevoRestante,
            estadoCobranza: nuevoEstado,
          },
        });
      }
    }

    return updated;
  });

  await logAction({
    userId,
    accion: "UPDATE",
    entidad: "Finanza",
    entidadId: id,
    metadata: { tipo, monto, concepto },
  });

  revalidatePath("/finanzas");
  revalidatePath("/finanzas/egresos");
  return { data: finanza };
}

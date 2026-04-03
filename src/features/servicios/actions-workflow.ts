"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { authorizeAction, scopedWhere } from "@/lib/auth-guard";
import type { EstadoTrabajo } from "@prisma/client";

// Transiciones permitidas en el flujo Kanban
const TRANSICIONES_PERMITIDAS: Record<EstadoTrabajo, EstadoTrabajo[]> = {
  POR_DECLARAR: ["DECLARADO", "POR_COBRAR", "COBRADO", "ARCHIVADO"],
  DECLARADO: ["POR_DECLARAR", "POR_COBRAR", "COBRADO", "ARCHIVADO"],
  POR_COBRAR: ["POR_DECLARAR", "DECLARADO", "COBRADO", "ARCHIVADO"],
  COBRADO: ["POR_DECLARAR", "DECLARADO", "POR_COBRAR", "ARCHIVADO"],
  ARCHIVADO: ["POR_DECLARAR", "DECLARADO", "POR_COBRAR", "COBRADO"],
};

function isTransicionValida(
  estadoActual: EstadoTrabajo,
  nuevoEstado: EstadoTrabajo
): boolean {
  return TRANSICIONES_PERMITIDAS[estadoActual]?.includes(nuevoEstado) ?? false;
}

export async function moveServicioAction(
  servicioId: string,
  nuevoEstado: EstadoTrabajo
) {
  const session = await authorizeAction([
    "GERENCIA",
    "ADMINISTRADOR",
    "CONTADOR",
  ]);
  const role = (session.user as any).role as string;
  const userId = (session.user as any).id as string;

  // Buscar el servicio con scope de rol
  const baseWhere = { id: servicioId };
  const where = scopedWhere(baseWhere, role, userId);

  const servicio = await prisma.servicio.findFirst({ where });
  if (!servicio) {
    return { error: "Servicio no encontrado o sin permiso" };
  }

  const estadoActual = servicio.estadoTrabajo;

  if (estadoActual === nuevoEstado) {
    return { success: true }; // no-op
  }

  if (!isTransicionValida(estadoActual, nuevoEstado)) {
    return {
      error: `Transición no permitida: ${estadoActual} → ${nuevoEstado}`,
    };
  }

  await prisma.servicio.update({
    where: { id: servicioId },
    data: { estadoTrabajo: nuevoEstado },
  });

  await prisma.auditLog.create({
    data: {
      userId,
      accion: "SERVICIO_ESTADO_TRABAJO_CAMBIADO",
      entidad: "Servicio",
      entidadId: servicioId,
      metadata: {
        estadoAnterior: estadoActual,
        nuevoEstado,
      },
    },
  });

  revalidatePath("/servicios");
  revalidatePath(`/servicios/${servicioId}`);
  return { success: true };
}

export async function bulkMoveServiciosAction(
  servicioIds: string[],
  nuevoEstado: EstadoTrabajo
) {
  const session = await authorizeAction([
    "GERENCIA",
    "ADMINISTRADOR",
    "CONTADOR",
  ]);
  const role = (session.user as any).role as string;
  const userId = (session.user as any).id as string;

  if (servicioIds.length === 0) {
    return { success: true, moved: 0 };
  }

  // Recuperar todos los servicios en scope
  const baseWhere = { id: { in: servicioIds } };
  const where = scopedWhere(baseWhere, role, userId);

  const servicios = await prisma.servicio.findMany({
    where,
    select: { id: true, estadoTrabajo: true },
  });

  const elegibles = servicios.filter((s) =>
    isTransicionValida(s.estadoTrabajo, nuevoEstado)
  );

  if (elegibles.length === 0) {
    return { error: "Ningún servicio puede moverse a ese estado" };
  }

  const elegiblesIds = elegibles.map((s) => s.id);

  await prisma.servicio.updateMany({
    where: { id: { in: elegiblesIds } },
    data: { estadoTrabajo: nuevoEstado },
  });

  await prisma.auditLog.createMany({
    data: elegibles.map((s) => ({
      userId,
      accion: "SERVICIO_ESTADO_TRABAJO_CAMBIADO",
      entidad: "Servicio",
      entidadId: s.id,
      metadata: {
        estadoAnterior: s.estadoTrabajo,
        nuevoEstado,
        bulk: true,
      },
    })),
  });

  revalidatePath("/servicios");
  return { success: true, moved: elegiblesIds.length };
}

/**
 * Marcar servicio como declarado — mueve de POR_DECLARAR a POR_COBRAR
 */
export async function declararServicioAction(servicioId: string) {
  const session = await authorizeAction(["GERENCIA", "ADMINISTRADOR", "CONTADOR"]);
  const role = (session.user as any).role as string;
  const userId = (session.user as any).id as string;

  const where = scopedWhere({ id: servicioId }, role, userId);
  const servicio = await prisma.servicio.findFirst({ where });

  if (!servicio) {
    return { error: "Servicio no encontrado" };
  }

  if (servicio.estadoTrabajo !== "POR_DECLARAR") {
    return { error: "Solo se pueden declarar servicios en estado Por Declarar" };
  }

  await prisma.servicio.update({
    where: { id: servicioId },
    data: { estadoTrabajo: "POR_COBRAR" },
  });

  await prisma.auditLog.create({
    data: {
      userId,
      accion: "SERVICIO_DECLARADO",
      entidad: "Servicio",
      entidadId: servicioId,
      metadata: { estadoAnterior: "POR_DECLARAR", nuevoEstado: "POR_COBRAR" },
    },
  });

  revalidatePath("/servicios");
  return { success: true };
}

/**
 * Deshacer declaración — mueve de POR_COBRAR a POR_DECLARAR
 */
export async function desdeclararServicioAction(servicioId: string) {
  const session = await authorizeAction(["GERENCIA", "ADMINISTRADOR", "CONTADOR"]);
  const role = (session.user as any).role as string;
  const userId = (session.user as any).id as string;

  const where = scopedWhere({ id: servicioId }, role, userId);
  const servicio = await prisma.servicio.findFirst({ where });

  if (!servicio) {
    return { error: "Servicio no encontrado" };
  }

  if (servicio.estadoTrabajo !== "POR_COBRAR") {
    return { error: "Solo se puede deshacer la declaración de servicios en estado Por Cobrar" };
  }

  await prisma.servicio.update({
    where: { id: servicioId },
    data: { estadoTrabajo: "POR_DECLARAR" },
  });

  await prisma.auditLog.create({
    data: {
      userId,
      accion: "SERVICIO_DESDECLARADO",
      entidad: "Servicio",
      entidadId: servicioId,
      metadata: { estadoAnterior: "POR_COBRAR", nuevoEstado: "POR_DECLARAR" },
    },
  });

  revalidatePath("/servicios");
  return { success: true };
}

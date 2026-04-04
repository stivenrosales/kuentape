"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { authorizeAction, scopedWhere } from "@/lib/auth-guard";
import {
  createIncidenciaSchema,
  updateIncidenciaSchema,
  updateEstadoIncidenciaSchema,
} from "./schemas";
import type {
  CreateIncidenciaInput,
  UpdateIncidenciaInput,
} from "./schemas";
import type { EstadoIncidencia } from "@prisma/client";

export async function createIncidenciaAction(data: CreateIncidenciaInput) {
  const session = await authorizeAction(["GERENCIA", "ADMINISTRADOR", "CONTADOR"]);
  const userId = (session.user as any).id as string;

  const parsed = createIncidenciaSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  const {
    personaId,
    contadorId,
    prioridad,
    titulo,
    descripcion,
    detalleFinanciero,
    estado,
    fechaLimite,
    periodo,
  } = parsed.data;

  const incidencia = await prisma.incidencia.create({
    data: {
      personaId,
      contadorId,
      prioridad,
      titulo,
      descripcion,
      detalleFinanciero: detalleFinanciero || null,
      estado,
      fechaLimite: fechaLimite ?? null,
      periodo: periodo || null,
    },
  });

  await prisma.auditLog.create({
    data: {
      userId,
      accion: "INCIDENCIA_CREATED",
      entidad: "Incidencia",
      entidadId: incidencia.id,
      metadata: { personaId, titulo, prioridad },
    },
  });

  revalidatePath("/incidencias");
  return { success: true, id: incidencia.id };
}

export async function updateIncidenciaAction(
  id: string,
  data: UpdateIncidenciaInput,
) {
  const session = await authorizeAction(["GERENCIA", "ADMINISTRADOR", "CONTADOR"]);
  const role = (session.user as any).role as string;
  const userId = (session.user as any).id as string;

  const parsed = updateIncidenciaSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  const baseWhere = { id };
  const where = scopedWhere(baseWhere, role, userId);

  const existing = await prisma.incidencia.findFirst({ where });
  if (!existing) {
    return { error: { _: ["Incidencia no encontrada o sin permiso"] } };
  }

  const {
    personaId,
    contadorId,
    prioridad,
    titulo,
    descripcion,
    detalleFinanciero,
    estado,
    fechaLimite,
    periodo,
  } = parsed.data;

  await prisma.incidencia.update({
    where: { id },
    data: {
      personaId,
      contadorId,
      prioridad,
      titulo,
      descripcion,
      detalleFinanciero: detalleFinanciero ?? null,
      estado,
      fechaLimite: fechaLimite ?? null,
      periodo: periodo || null,
    },
  });

  await prisma.auditLog.create({
    data: {
      userId,
      accion: "INCIDENCIA_UPDATED",
      entidad: "Incidencia",
      entidadId: id,
      metadata: { titulo, estado },
    },
  });

  revalidatePath("/incidencias");
  revalidatePath(`/incidencias/${id}`);
  return { success: true };
}

export async function updateIncidenciaEstadoAction(
  id: string,
  estado: EstadoIncidencia,
) {
  const session = await authorizeAction(["GERENCIA", "ADMINISTRADOR", "CONTADOR"]);
  const role = (session.user as any).role as string;
  const userId = (session.user as any).id as string;

  const parsed = updateEstadoIncidenciaSchema.safeParse({ estado });
  if (!parsed.success) {
    return { error: "Estado inválido" };
  }

  const baseWhere = { id };
  const where = scopedWhere(baseWhere, role, userId);

  const existing = await prisma.incidencia.findFirst({ where });
  if (!existing) {
    return { error: "Incidencia no encontrada o sin permiso" };
  }

  await prisma.incidencia.update({
    where: { id },
    data: { estado: parsed.data.estado },
  });

  await prisma.auditLog.create({
    data: {
      userId,
      accion: "INCIDENCIA_ESTADO_UPDATED",
      entidad: "Incidencia",
      entidadId: id,
      metadata: { estadoAnterior: existing.estado, nuevoEstado: estado },
    },
  });

  revalidatePath("/incidencias");
  revalidatePath(`/incidencias/${id}`);
  return { success: true };
}

export async function addAdjuntoAction(
  incidenciaId: string,
  fileData: {
    fileName: string;
    fileType: string;
    fileSize: number;
    storagePath: string;
    url: string;
  },
) {
  await authorizeAction(["GERENCIA", "ADMINISTRADOR", "CONTADOR"]);

  const adjunto = await prisma.attachment.create({
    data: {
      incidenciaId,
      fileName: fileData.fileName,
      fileType: fileData.fileType,
      fileSize: fileData.fileSize,
      storagePath: fileData.storagePath,
      url: fileData.url,
    },
  });

  revalidatePath(`/incidencias/${incidenciaId}`);
  return { success: true, id: adjunto.id };
}

export async function removeAdjuntoAction(adjuntoId: string) {
  await authorizeAction(["GERENCIA", "ADMINISTRADOR", "CONTADOR"]);

  const adjunto = await prisma.attachment.findUnique({
    where: { id: adjuntoId },
  });
  if (!adjunto) return { error: "Adjunto no encontrado" };

  await prisma.attachment.delete({ where: { id: adjuntoId } });

  if (adjunto.incidenciaId) {
    revalidatePath(`/incidencias/${adjunto.incidenciaId}`);
  }
  return { success: true };
}

/** Load incidencia detail for popup */
export async function getIncidenciaDetailAction(id: string) {
  await authorizeAction(["GERENCIA", "ADMINISTRADOR", "CONTADOR"]);
  return prisma.incidencia.findUnique({
    where: { id },
    include: {
      persona: { select: { id: true, razonSocial: true, ruc: true } },
      contador: { select: { id: true, nombre: true, apellido: true, email: true } },
      adjuntos: { select: { id: true, fileName: true, fileType: true, fileSize: true, url: true, createdAt: true } },
    },
  });
}

"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { authorizeAction, scopedPersonaWhere } from "@/lib/auth-guard";
import { encrypt } from "@/lib/encryption";
import { createPersonaSchema, updatePersonaSchema, updateCredentialsSchema } from "./schemas";
import type { CreatePersonaInput, UpdatePersonaInput, UpdateCredentialsInput } from "./schemas";
import type { EstadoPersona } from "@prisma/client";

export async function createPersonaAction(data: CreatePersonaInput) {
  const session = await authorizeAction(["GERENCIA", "ADMINISTRADOR"]);

  const parsed = createPersonaSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  const existing = await prisma.persona.findUnique({
    where: { ruc: parsed.data.ruc },
  });
  if (existing) {
    return { error: { ruc: ["Este RUC ya está registrado"] } };
  }

  const persona = await prisma.persona.create({
    data: {
      razonSocial: parsed.data.razonSocial,
      ruc: parsed.data.ruc,
      tipoPersona: parsed.data.tipoPersona,
      regimen: parsed.data.regimen,
      direccion: parsed.data.direccion,
      telefono: parsed.data.telefono,
      email: parsed.data.email || null,
      representanteNombre: parsed.data.representanteNombre,
      representanteDni: parsed.data.representanteDni || null,
      representanteTelefono: parsed.data.representanteTelefono,
      contadorAsignadoId: parsed.data.contadorAsignadoId,
      detracciones: parsed.data.detracciones,
      planilla: parsed.data.planilla,
      numTrabajadores: parsed.data.numTrabajadores,
      tipoContabilidad: parsed.data.tipoContabilidad,
      partidaElectronica: parsed.data.partidaElectronica,
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: (session.user as any).id,
      accion: "PERSONA_CREATED",
      entidad: "Persona",
      entidadId: persona.id,
      metadata: { razonSocial: persona.razonSocial, ruc: persona.ruc },
    },
  });

  revalidatePath("/clientes");
  return { success: true, id: persona.id };
}

export async function updatePersonaAction(id: string, data: UpdatePersonaInput) {
  const session = await authorizeAction(["GERENCIA", "ADMINISTRADOR", "CONTADOR"]);
  const role = (session.user as any).role as string;
  const userId = (session.user as any).id as string;

  const parsed = updatePersonaSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  // CONTADOR can only update their own personas
  const baseWhere = { id };
  const where = scopedPersonaWhere(baseWhere, role, userId);

  const persona = await prisma.persona.findFirst({ where });
  if (!persona) {
    return { error: { _: ["Persona no encontrada o sin permiso"] } };
  }

  // Check RUC uniqueness if changed
  if (parsed.data.ruc && parsed.data.ruc !== persona.ruc) {
    const existing = await prisma.persona.findUnique({
      where: { ruc: parsed.data.ruc },
    });
    if (existing) {
      return { error: { ruc: ["Este RUC ya está registrado"] } };
    }
  }

  const updated = await prisma.persona.update({
    where: { id },
    data: {
      razonSocial: parsed.data.razonSocial,
      ruc: parsed.data.ruc,
      tipoPersona: parsed.data.tipoPersona,
      regimen: parsed.data.regimen,
      direccion: parsed.data.direccion,
      telefono: parsed.data.telefono,
      email: parsed.data.email || null,
      representanteNombre: parsed.data.representanteNombre,
      representanteDni: parsed.data.representanteDni || null,
      representanteTelefono: parsed.data.representanteTelefono,
      contadorAsignadoId: parsed.data.contadorAsignadoId,
      detracciones: parsed.data.detracciones,
      planilla: parsed.data.planilla,
      numTrabajadores: parsed.data.numTrabajadores,
      tipoContabilidad: parsed.data.tipoContabilidad,
      partidaElectronica: parsed.data.partidaElectronica,
    },
  });

  await prisma.auditLog.create({
    data: {
      userId,
      accion: "PERSONA_UPDATED",
      entidad: "Persona",
      entidadId: updated.id,
      metadata: { razonSocial: updated.razonSocial },
    },
  });

  revalidatePath("/clientes");
  revalidatePath(`/clientes/${id}`);
  return { success: true };
}

export async function updatePersonaEstadoAction(
  id: string,
  estado: EstadoPersona
) {
  const session = await authorizeAction(["GERENCIA", "ADMINISTRADOR"]);

  const persona = await prisma.persona.findUnique({ where: { id } });
  if (!persona) return { error: "Persona no encontrada" };

  await prisma.persona.update({
    where: { id },
    data: { estado },
  });

  await prisma.auditLog.create({
    data: {
      userId: (session.user as any).id,
      accion: "PERSONA_ESTADO_CHANGED",
      entidad: "Persona",
      entidadId: id,
      metadata: { estadoAnterior: persona.estado, estadoNuevo: estado },
    },
  });

  revalidatePath("/clientes");
  revalidatePath(`/clientes/${id}`);
  return { success: true };
}

export async function updateCredentialsAction(
  personaId: string,
  data: UpdateCredentialsInput
) {
  const session = await authorizeAction(["GERENCIA", "ADMINISTRADOR", "CONTADOR"]);
  const role = (session.user as any).role as string;
  const userId = (session.user as any).id as string;

  const parsed = updateCredentialsSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  // CONTADOR can only update credentials of their own personas
  const baseWhere = { id: personaId };
  const where = scopedPersonaWhere(baseWhere, role, userId);

  const persona = await prisma.persona.findFirst({ where });
  if (!persona) {
    return { error: "Persona no encontrada o sin permiso" };
  }

  const updateData: Record<string, string | null> = {};

  if (parsed.data.claveSolUsuario !== undefined) {
    updateData.claveSolUsuario = parsed.data.claveSolUsuario
      ? encrypt(parsed.data.claveSolUsuario)
      : null;
  }
  if (parsed.data.claveSolClave !== undefined) {
    updateData.claveSolClave = parsed.data.claveSolClave
      ? encrypt(parsed.data.claveSolClave)
      : null;
  }
  if (parsed.data.afpUsuario !== undefined) {
    updateData.afpUsuario = parsed.data.afpUsuario
      ? encrypt(parsed.data.afpUsuario)
      : null;
  }
  if (parsed.data.afpClave !== undefined) {
    updateData.afpClave = parsed.data.afpClave
      ? encrypt(parsed.data.afpClave)
      : null;
  }

  await prisma.persona.update({
    where: { id: personaId },
    data: updateData,
  });

  await prisma.auditLog.create({
    data: {
      userId,
      accion: "CREDENTIAL_UPDATED",
      entidad: "Persona",
      entidadId: personaId,
      metadata: {
        fields: Object.keys(updateData),
        razonSocial: persona.razonSocial,
      },
    },
  });

  revalidatePath(`/clientes/${personaId}`);
  return { success: true };
}

export async function deletePersonaAction(id: string) {
  const session = await authorizeAction(["GERENCIA"]);

  const persona = await prisma.persona.findUnique({ where: { id } });
  if (!persona) return { error: "Persona no encontrada" };

  // Soft delete: set to ARCHIVADO
  await prisma.persona.update({
    where: { id },
    data: { estado: "ARCHIVADO" },
  });

  await prisma.auditLog.create({
    data: {
      userId: (session.user as any).id,
      accion: "PERSONA_ARCHIVED",
      entidad: "Persona",
      entidadId: id,
      metadata: { razonSocial: persona.razonSocial, ruc: persona.ruc },
    },
  });

  revalidatePath("/clientes");
  return { success: true };
}

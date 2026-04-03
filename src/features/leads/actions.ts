"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { authorizeAction } from "@/lib/auth-guard";
import {
  createLeadSchema,
  updateLeadEstadoSchema,
  convertLeadSchema,
} from "./schemas";
import type { CreateLeadInput, ConvertLeadInput } from "./schemas";

export async function createLeadAction(data: CreateLeadInput) {
  await authorizeAction(["GERENCIA", "ADMINISTRADOR", "VENTAS"]);

  const parsed = createLeadSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  const { dni, email, regimen, rubro, numTrabajadores, notas, asignadoAId, ...rest } =
    parsed.data;

  const lead = await prisma.lead.create({
    data: {
      ...rest,
      dni: dni || null,
      email: email || null,
      regimen: regimen ?? null,
      rubro: rubro || null,
      numTrabajadores: numTrabajadores ?? null,
      notas: notas || null,
      asignadoAId: asignadoAId || null,
    },
  });

  revalidatePath("/prospectos");
  return { data: lead };
}

export async function updateLeadAction(id: string, data: CreateLeadInput) {
  await authorizeAction(["GERENCIA", "ADMINISTRADOR", "VENTAS"]);

  const parsed = createLeadSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  const { dni, email, regimen, rubro, numTrabajadores, notas, asignadoAId, ...rest } =
    parsed.data;

  const lead = await prisma.lead.update({
    where: { id },
    data: {
      ...rest,
      dni: dni || null,
      email: email || null,
      regimen: regimen ?? null,
      rubro: rubro || null,
      numTrabajadores: numTrabajadores ?? null,
      notas: notas || null,
      asignadoAId: asignadoAId || null,
    },
  });

  revalidatePath("/prospectos");
  return { data: lead };
}

export async function updateLeadEstadoAction(
  id: string,
  estado: string
) {
  await authorizeAction(["GERENCIA", "ADMINISTRADOR", "VENTAS"]);

  const parsed = updateLeadEstadoSchema.safeParse({ estado });
  if (!parsed.success) {
    return { error: "Estado inválido" };
  }

  const lead = await prisma.lead.update({
    where: { id },
    data: { estado: parsed.data.estado },
  });

  revalidatePath("/prospectos");
  return { data: lead };
}

export async function convertLeadToPersonaAction(
  id: string,
  data: ConvertLeadInput
) {
  const session = await authorizeAction(["GERENCIA", "ADMINISTRADOR"]);

  const parsed = convertLeadSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  const result = await prisma.$transaction(async (tx) => {
    const lead = await tx.lead.findUnique({ where: { id } });
    if (!lead) throw new Error("Prospecto no encontrado");
    if (lead.estado === "CONVERTIDO") throw new Error("El prospecto ya fue convertido");
    if (lead.estado !== "COTIZADO") throw new Error("Solo se pueden convertir leads en estado COTIZADO");

    const { tipoPersona, razonSocial, ruc, regimen, contadorAsignadoId } = parsed.data;

    let personaData: Record<string, unknown>;

    if (tipoPersona === "JURIDICA") {
      if (!razonSocial || !ruc) {
        throw new Error("Razón social y RUC son requeridos para persona jurídica");
      }
      personaData = {
        razonSocial,
        ruc,
        tipoPersona: "JURIDICA",
        regimen,
        contadorAsignadoId,
        representanteNombre: `${lead.nombre} ${lead.apellido}`,
        representanteDni: lead.dni ?? null,
        representanteTelefono: lead.celular,
        email: lead.email ?? null,
        planilla: (lead.numTrabajadores ?? 0) > 0,
        numTrabajadores: lead.numTrabajadores ?? null,
      };
    } else {
      // NATURAL: use lead's own data
      const generatedRuc = lead.dni ? `10${lead.dni}` : null;
      personaData = {
        razonSocial: `${lead.nombre} ${lead.apellido}`,
        ruc: generatedRuc ?? `10${Date.now().toString().slice(-8)}`,
        tipoPersona: "NATURAL",
        regimen,
        contadorAsignadoId,
        representanteNombre: `${lead.nombre} ${lead.apellido}`,
        representanteDni: lead.dni ?? null,
        representanteTelefono: lead.celular,
        email: lead.email ?? null,
        planilla: (lead.numTrabajadores ?? 0) > 0,
        numTrabajadores: lead.numTrabajadores ?? null,
      };
    }

    const persona = await tx.persona.create({ data: personaData as any });

    await tx.lead.update({
      where: { id },
      data: {
        convertidoAId: persona.id,
        estado: "CONVERTIDO",
      },
    });

    return persona;
  });

  revalidatePath("/prospectos");
  return { data: result };
}

export async function deleteLeadAction(id: string) {
  await authorizeAction(["GERENCIA"]);

  const lead = await prisma.lead.findUnique({ where: { id } });
  if (!lead) return { error: "Prospecto no encontrado" };
  if (lead.convertidoAId) {
    return { error: "No se puede eliminar un prospecto convertido" };
  }

  await prisma.lead.delete({ where: { id } });

  revalidatePath("/prospectos");
  return { data: true };
}

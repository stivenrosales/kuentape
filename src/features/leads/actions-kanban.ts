"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { authorizeAction } from "@/lib/auth-guard";
import type { EstadoLead } from "@prisma/client";
import type { Regimen } from "@prisma/client";

// ─── Partial field update (used by inline editing in the dialog) ─────────────

type LeadFieldPatch = {
  nombre?: string;
  apellido?: string;
  celular?: string;
  email?: string | null;
  dni?: string | null;
  rubro?: string | null;
  numTrabajadores?: number | null;
  notas?: string | null;
  regimen?: Regimen | null;
};

export async function updateLeadFieldAction(
  leadId: string,
  patch: LeadFieldPatch
): Promise<{ data?: { id: string }; error?: string }> {
  await authorizeAction(["GERENCIA", "ADMINISTRADOR", "VENTAS"]);

  // Validate field lengths
  if (patch.dni && patch.dni.length > 8) return { error: "DNI debe tener máximo 8 caracteres" };
  if (patch.celular && patch.celular.length > 20) return { error: "Celular demasiado largo" };
  if (patch.email && patch.email.length > 255) return { error: "Email demasiado largo" };

  // Clean empty strings to null for optional fields
  const cleanPatch: Record<string, any> = {};
  for (const [key, val] of Object.entries(patch)) {
    if (val === undefined) continue;
    cleanPatch[key] = val === "" ? null : val;
  }

  const updated = await prisma.lead.update({
    where: { id: leadId },
    data: cleanPatch,
    select: { id: true },
  });

  revalidatePath("/prospectos");
  return { data: updated };
}

// Allowed forward transitions
const FORWARD_TRANSITIONS: Partial<Record<EstadoLead, EstadoLead>> = {
  NUEVO: "CONTACTADO",
  CONTACTADO: "COTIZADO",
};

// Allowed backward transitions
const BACKWARD_TRANSITIONS: Partial<Record<EstadoLead, EstadoLead>> = {
  CONTACTADO: "NUEVO",
  COTIZADO: "CONTACTADO",
};

// Any estado can go to PERDIDO (except already CONVERTIDO)
// CONVERTIDO is only reachable via convertLeadToPersonaAction (conversion dialog)

function isValidTransition(from: EstadoLead, to: EstadoLead): boolean {
  if (from === "CONVERTIDO") return false; // CONVERTIDO is a terminal state
  if (to === "PERDIDO") return true; // any (non-CONVERTIDO, already filtered above) → PERDIDO
  if (FORWARD_TRANSITIONS[from] === to) return true;
  if (BACKWARD_TRANSITIONS[from] === to) return true;
  return false;
}

export async function moveLeadAction(
  leadId: string,
  nuevoEstado: EstadoLead
): Promise<{ data?: { id: string; estado: string }; error?: string }> {
  await authorizeAction(["GERENCIA", "ADMINISTRADOR", "VENTAS"]);

  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
    select: { id: true, estado: true },
  });

  if (!lead) {
    return { error: "Prospecto no encontrado" };
  }

  if (!isValidTransition(lead.estado as EstadoLead, nuevoEstado)) {
    return {
      error: `Transición no permitida: ${lead.estado} → ${nuevoEstado}`,
    };
  }

  const updated = await prisma.lead.update({
    where: { id: leadId },
    data: { estado: nuevoEstado },
    select: { id: true, estado: true },
  });

  revalidatePath("/prospectos");
  return { data: updated };
}

export async function updateLeadNotasAction(
  leadId: string,
  notas: string
): Promise<{ data?: { id: string }; error?: string }> {
  await authorizeAction(["GERENCIA", "ADMINISTRADOR", "VENTAS"]);

  const updated = await prisma.lead.update({
    where: { id: leadId },
    data: { notas: notas || null },
    select: { id: true },
  });

  revalidatePath("/prospectos");
  return { data: updated };
}
